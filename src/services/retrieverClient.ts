import { LLMChain } from "langchain/chains";
import { Document } from "langchain/document";
import { BufferMemory } from "langchain/memory";
import { PromptTemplate } from "langchain/prompts";
import { ParentDocumentRetriever } from "langchain/retrievers/parent_document";
import {
  ScoreThresholdRetriever,
  ScoreThresholdRetrieverInput,
} from "langchain/retrievers/score_threshold";
import { BaseMessage } from "langchain/schema";
import { RunnableSequence } from "langchain/schema/runnable";
import { InMemoryStore } from "langchain/storage/in_memory";
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
  chunkSize: 250,
  chunkOverlap: 50,
};

/**
 * Create two prompt templates, one for answering questions, and one for
 * generating questions.
 */
const slowChainPrompt = PromptTemplate.fromTemplate(
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
const fastChainPrompt = PromptTemplate.fromTemplate(
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
  documents: Document[] = [];
  memory: BufferMemory;
  fastChain: LLMChain;
  slowChain: LLMChain;

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
      prompt: slowChainPrompt,
    });
    this.fastChain = new LLMChain({
      llm: this.fastModel,
      prompt: fastChainPrompt,
    });
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

  splitDocuments = async () => {
    if (this.documents.length > 0) {
      return this.documents;
    } else {
      return await this.splitter.splitDocuments(this.getDocuments());
    }
  };

  fetchVectorStore = async () => {
    if (!this.vectorStore) {
      this.vectorStore = await MemoryVectorStore.fromDocuments(
        await this.splitDocuments(),
        this.embeddings
      );
    }
    return this.vectorStore;
  };

  fetchUnsplitVectorStore = async () => {
    return await MemoryVectorStore.fromDocuments(
      this.getDocuments(),
      this.embeddings
    );
  };

  fetchScoreThresholdRetriever = async () => {
    const vectorStore = await this.fetchVectorStore();
    return ScoreThresholdRetriever.fromVectorStore(vectorStore, {
      minSimilarityScore: 0.8, // Essentially no threshold
      maxK: 1, // Only return the top result
      kIncrement: vectorStore.memoryVectors.length,
      verbose: true,
      searchType: "similarity",
    });
  };

  fetchUnsplitScoreThresholdRetriever = async () => {
    const vectorStore = await this.fetchUnsplitVectorStore();
    return ScoreThresholdRetriever.fromVectorStore(vectorStore, {
      minSimilarityScore: 0.8, // Essentially no threshold
      maxK: 1, // Only return the top result
      verbose: true,
      searchType: "similarity",
    });
  };

  fetchDomainRetriever = async () => {
    const vectorStore = await this.fetchVectorStore();
    return vectorStore.asRetriever();
  };

  fetchParentDocumentRetriever = async () => {
    // const vectorstore = await this.fetchVectorStore();
    // const vectorstore = await this.fetchUnsplitVectorStore();
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
      // Optional `k` parameter to search for more child documents in VectorStore.
      // Note that this does not exactly correspond to the number of final (parent) documents
      // retrieved, as multiple child documents can point to the same parent.
      childK: 100,
      // Optional `k` parameter to limit number of final, parent documents returned from this
      // retriever and sent to LLM. This is an upper-bound, and the final count may be lower than this.
      parentK: 20,
    });
    await retriever.addDocuments(this.getDocuments());
    return retriever;
  };

  ask = async (question: string) => {
    const retriever = await this.fetchParentDocumentRetriever();
    const fasterChain = this.fastChain;
    const slowerChain = this.slowChain;

    const serializeChatHistory = async (chatHistory: Array<BaseMessage>) => {
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

    const performQuestionAnswering = async (input: {
      question: string;
      memory: BufferMemory;
      chatHistory: Array<BaseMessage> | null;
      context: Array<Document>;
    }): Promise<{ result: string; sourceDocuments: Array<Document> }> => {
      let newQuestion = input.question;
      // Serialize context and chat history into strings
      const serializedDocs = formatDocumentsAsString(input.context);
      const chatHistoryString = input.chatHistory
        ? serializeChatHistory(input.chatHistory)
        : null;

      if (chatHistoryString) {
        // Call the faster chain to generate a new question
        const { text } = await fasterChain.invoke({
          chatHistory: chatHistoryString,
          context: serializedDocs,
          question: input.question,
        });

        newQuestion = text;
      }

      const response = await slowerChain.invoke({
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
    };
    const chain = RunnableSequence.from([
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
        // Fetch relevant context based on the question
        context: async (input: { question: string }) =>
          retriever.getRelevantDocuments(input.question),
      },
      performQuestionAnswering,
    ]);

    const response = await chain.invoke({ question });
    return response.result?.trim();
  };
}

export default RetrieverClient;
