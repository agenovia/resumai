import { LLMChain } from "langchain/chains";
import { Document } from "langchain/document";
import { BufferMemory } from "langchain/memory";
import { PromptTemplate } from "langchain/prompts";
import { ScoreThresholdRetrieverInput } from "langchain/retrievers/score_threshold";
import { BaseMessage } from "langchain/schema";
import { RunnableSequence } from "langchain/schema/runnable";
import {
  RecursiveCharacterTextSplitter,
  RecursiveCharacterTextSplitterParams,
} from "langchain/text_splitter";
import { formatDocumentsAsString } from "langchain/util/document";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import WorkHistoryFormValues from "../components/WorkHistory/types";
import OpenAIClient from "./openAIClient";

type RetrieverSettings = Omit<
  ScoreThresholdRetrieverInput<MemoryVectorStore>,
  "vectorStore"
>;
type SplitterSettings = Partial<RecursiveCharacterTextSplitterParams>;

const defaultRetrieverSettings: RetrieverSettings = {
  minSimilarityScore: 0.75,
  maxK: 100,
  kIncrement: 2,
};

const defaultSplitterSettings: SplitterSettings = {
  chunkSize: 500,
  chunkOverlap: 100,
};

/**
 * Create two prompt templates, one for answering questions, and one for
 * generating questions.
 */
const questionPrompt = PromptTemplate.fromTemplate(
  `Use the following pieces of context to answer the question at the end. If you don't know the answer, just say that you don't know, don't try to make up an answer.
  ----------
  CONTEXT: {context}
  ----------
  CHAT HISTORY: {chatHistory}
  ----------
  QUESTION: {question}
  ----------
  Helpful Answer:`
);
const questionGeneratorTemplate = PromptTemplate.fromTemplate(
  `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.
  ----------
  CHAT HISTORY: {chatHistory}
  ----------
  FOLLOWUP QUESTION: {question}
  ----------
  Standalone question:`
);

class RetrieverClient extends OpenAIClient {
  workHistory: WorkHistoryFormValues;
  retrieverSettings: RetrieverSettings;
  splitterSettings: SplitterSettings;
  splitter: RecursiveCharacterTextSplitter;
  vectorStore: MemoryVectorStore | null = null;
  private documents: Document[] = [];
  private memory: BufferMemory;
  private fastChain: LLMChain;
  private slowChain: LLMChain;

  constructor(
    workHistory: WorkHistoryFormValues,
    retrieverSettings?: RetrieverSettings,
    splitterSettings?: SplitterSettings
  ) {
    super(import.meta.env.VITE_OPENAI_KEY);
    this.workHistory = workHistory;
    this.retrieverSettings = retrieverSettings ?? defaultRetrieverSettings;
    this.splitterSettings = splitterSettings ?? defaultSplitterSettings;
    this.splitter = new RecursiveCharacterTextSplitter(this.splitterSettings);
    this.memory = new BufferMemory({
      memoryKey: "ChatHistory",
      inputKey: "question", // The key for the input to the chain
      outputKey: "text", // The key for the final conversational output of the chain
      returnMessages: true, // If using with a chat model (e.g. gpt-3.5 or gpt-4)
    });
    this.slowChain = new LLMChain({
      llm: this.slowModel,
      prompt: questionPrompt,
    });
    this.fastChain = new LLMChain({
      llm: this.fastModel,
      prompt: questionGeneratorTemplate,
    });
  }

  private splitDocuments = async () => {
    if (this.documents.length > 0) {
      return this.documents;
    } else {
      const doc = this.workHistory.accomplishments.map(
        (a) =>
          new Document({
            pageContent: a.context,
            metadata: {
              company: this.workHistory.company,
              jobTitle: this.workHistory.jobTitle,
              startDate: this.workHistory.startDate,
              endDate: this.workHistory.endDate,
              headline: a.headline,
              skills: a.skills,
              section: "accomplishments",
            },
          })
      );
      return await this.splitter.splitDocuments(doc);
    }
  };

  private async fetchVectorStore() {
    if (!this.vectorStore) {
      this.vectorStore = await MemoryVectorStore.fromDocuments(
        await this.splitDocuments(),
        this.embeddings
      );
    }
    return this.vectorStore;
  }

  public async fetchDomainRetriever() {
    const vectorStore = await this.fetchVectorStore();
    return vectorStore.asRetriever();
  }

  private serializeChatHistory(chatHistory: Array<BaseMessage>) {
    return chatHistory
      .map((chatMessage) => {
        if (chatMessage._getType() === "human") {
          return `Human: ${chatMessage.content}`;
        } else if (chatMessage._getType() === "ai") {
          return `Assistant: ${chatMessage.content}`;
        } else {
          return `${chatMessage.content}`;
        }
      })
      .join("\n");
  }

  private async performQuestionAnswering(input: {
    question: string;
    chatHistory: Array<BaseMessage> | null;
    context: Array<Document>;
    memory: BufferMemory;
    slowChain: LLMChain;
    fastChain: LLMChain;
  }): Promise<{ result: string; sourceDocuments: Array<Document> }> {
    let newQuestion = input.question;
    // Serialize context and chat history into strings
    const serializedDocs = formatDocumentsAsString(input.context);
    const chatHistoryString = input.chatHistory
      ? this.serializeChatHistory(input.chatHistory)
      : null;
    if (chatHistoryString) {
      // Call the faster chain to generate a new question
      const { text } = await input.fastChain.invoke({
        chatHistory: chatHistoryString,
        context: serializedDocs,
        question: input.question,
      });

      newQuestion = text;
    }

    const response = await input.slowChain.invoke({
      chatHistory: chatHistoryString ?? "",
      context: serializedDocs,
      question: newQuestion,
    });

    // Save the chat history to memory
    await input.memory.saveContext(
      {
        question: input.question,
      },
      {
        text: response.text,
      }
    );

    return {
      result: response.text,
      sourceDocuments: input.context,
    };
  }

  public async ask(question: string): Promise<string> {
    const retriever = await this.fetchDomainRetriever();
    const context = await retriever.getRelevantDocuments(question);
    const savedMemory = await this.memory.loadMemoryVariables({});
    const hasHistory = savedMemory.chatHistory?.length > 0;
    const sequence = RunnableSequence.from([
      {
        // Pipe the question through unchanged
        question: (input: { question: string }) => input.question,
        // Fetch the chat history, and return the history or null if not present
        chatHistory: () => (hasHistory ? savedMemory.chatHistory : null),
        // Fetch relevant context based on the question
        context: () => context,
        // Run the question answering pipeline
        slowChain: this.slowChain,
        fastChain: this.fastChain,
        memory: () => {
          return this.memory;
        },
      },
      this.performQuestionAnswering,
    ]);

    const response = await sequence.invoke({ question });
    return response.result?.trim();
  }
}

export default RetrieverClient;
