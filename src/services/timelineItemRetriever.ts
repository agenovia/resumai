import { LLMChain, LLMChainInput } from "langchain/chains";
import { Document } from "langchain/document";
import { BufferMemory } from "langchain/memory";
import { PromptTemplate } from "langchain/prompts";
import { ParentDocumentRetriever } from "langchain/retrievers/parent_document";
import { ScoreThresholdRetriever } from "langchain/retrievers/score_threshold";
import { BaseMessage } from "langchain/schema";
import { RunnableSequence } from "langchain/schema/runnable";
import { InMemoryStore } from "langchain/storage/in_memory";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { formatDocumentsAsString } from "langchain/util/document";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import WorkHistoryFormValues from "../components/WorkHistory/types";
import OpenAIClient from "./openAIClient";

class TimelineItemRetriever extends OpenAIClient {
  workHistory: WorkHistoryFormValues;
  vectorStore: MemoryVectorStore | null = null;
  documents: Document[] = [];
  memory: BufferMemory;
  slowChainPrompt = PromptTemplate.fromTemplate(
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
  fastChainPrompt = PromptTemplate.fromTemplate(
    `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question.
    ----------
    CHAT HISTORY: {chatHistory}
    ----------
    FOLLOWUP QUESTION: {question}
    ----------
    Standalone question:`
  );
  refineChainPrompt = PromptTemplate.fromTemplate(
    `Given a previously generated AI response, human context and the original question, refine the response to be more accurate, gramatically correct, contextually relevant, and professional yet conversational. Avoid flowery language.
    ----------
    CONTEXT: {context}
    ----------
    RESPONSE: {response}
    ----------
    Refined answer:`
  );
  questionAnsweringChain: RunnableSequence;
  questionRefiningChain: RunnableSequence;
  mainSequence: RunnableSequence;
  retriever: ParentDocumentRetriever | undefined;

  constructor(workHistory: WorkHistoryFormValues) {
    super(import.meta.env.VITE_OPENAI_KEY);
    this.workHistory = workHistory;
    this.memory = new BufferMemory({
      memoryKey: "ChatHistory",
      inputKey: "question", // The key for the input to the chain
      outputKey: "text", // The key for the final conversational output of the chain
      returnMessages: true, // If using with a chat model (e.g. gpt-3.5 or gpt-4)
    });
    this.questionAnsweringChain = RunnableSequence.from([
      {
        // Pipe the question through unchanged
        question: (input: { question: string }) => input.question,
        memory: () => this.memory,
        // Fetch the chat history, and return the history or null if not present
        chatHistory: async () => {
          const savedMemory = await this.memory.loadMemoryVariables({});
          const hasHistory = savedMemory.chatHistory?.length > 0;
          return hasHistory ? savedMemory.chatHistory : null;
        },
        chatHistorySerializer: () => this.serializeChatHistory,
        slowChainSettings: () => {
          return { llm: this.slowModel, prompt: this.slowChainPrompt };
        },
        fastChainSettings: () => {
          return { llm: this.fastModel, prompt: this.fastChainPrompt };
        },
        context: async (input: { question: string }) =>
          (await this.fetchParentDocumentRetriever()).getRelevantDocuments(
            input.question
          ),
      },
      this.performQuestionAnswering,
    ]);
    this.questionRefiningChain = RunnableSequence.from([
      {
        result: (input: {
          originalQuestion: string;
          result: string;
          sourceDocuments: Array<Document>;
        }) => input.result,
        sourceDocuments: (input: {
          originalQuestion: string;
          result: string;
          sourceDocuments: Array<Document>;
        }) => input.sourceDocuments,
        originalQuestion: (input: {
          originalQuestion: string;
          result: string;
          sourceDocuments: Array<Document>;
        }) => input.originalQuestion,
        refineChainSettings: () => {
          return { llm: this.fastModel, prompt: this.refineChainPrompt };
        },
      },
      this.performAnswerRefining,
    ]);
    this.mainSequence = RunnableSequence.from([
      this.questionAnsweringChain,
      this.questionRefiningChain,
    ]);
  }

  getDocuments = () => {
    return this.workHistory.accomplishments.map(
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
  };

  fetchParentDocumentRetriever = async () => {
    if (!this.retriever) {
      const vectorstore = new MemoryVectorStore(this.embeddings);
      const childDocumentRetriever = ScoreThresholdRetriever.fromVectorStore(
        vectorstore,
        {
          minSimilarityScore: 0.8,
          maxK: 1, // Only return the top result
          kIncrement: 200,
          searchType: "similarity",
        }
      );
      const docstore = new InMemoryStore();
      const retriever = new ParentDocumentRetriever({
        vectorstore,
        childDocumentRetriever,
        docstore,
        childSplitter: new RecursiveCharacterTextSplitter({
          chunkOverlap: 0,
          chunkSize: 50,
        }),
        childK: 100,
        parentK: 20,
      });
      await retriever.addDocuments(this.getDocuments());
      return retriever;
    }
    return this.retriever;
  };

  serializeChatHistory = async (chatHistory: Array<BaseMessage>) => {
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
  };

  performQuestionAnswering = async (input: {
    question: string;
    memory: BufferMemory;
    chatHistory: Array<BaseMessage> | null;
    chatHistorySerializer: (chatHistory: Array<BaseMessage>) => Promise<string>;
    slowChainSettings: LLMChainInput;
    fastChainSettings: LLMChainInput;
    context: Array<Document>;
  }): Promise<{
    originalQuestion: string;
    result: string;
    sourceDocuments: Array<Document>;
  }> => {
    let newQuestion = input.question;
    // Serialize context and chat history into strings
    const serializedDocs = formatDocumentsAsString(input.context);
    const chatHistoryString = input.chatHistory
      ? input.chatHistorySerializer(input.chatHistory)
      : null;

    const fastChain = new LLMChain(input.fastChainSettings);
    const slowChain = new LLMChain(input.slowChainSettings);

    if (chatHistoryString) {
      // Call the faster chain to generate a new question
      const { text } = await fastChain.invoke({
        chatHistory: chatHistoryString,
        context: serializedDocs,
        question: input.question,
      });

      newQuestion = text;
    }

    const response = await slowChain.invoke({
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
      originalQuestion: input.question,
      result: response.text,
      sourceDocuments: input.context,
    };
  };

  performAnswerRefining = async (input: {
    originalQuestion: string;
    result: string;
    sourceDocuments: Array<Document>;
    refineChainSettings: LLMChainInput;
  }): Promise<{ result: string; sourceDocuments: Array<Document> }> => {
    const serializedDocs = formatDocumentsAsString(input.sourceDocuments);
    const refineChain = new LLMChain(input.refineChainSettings);
    const response = await refineChain.invoke({
      originalQuestion: input.originalQuestion,
      context: serializedDocs,
      response: input.result,
    });
    return {
      result: response.text,
      sourceDocuments: input.sourceDocuments,
    };
  };

  ask = async (question: string) => {
    // const response = await this.questionAnsweringChain.invoke({ question });
    const response = await this.mainSequence.invoke({ question });
    return response.result?.trim();
  };
}

export default TimelineItemRetriever;
