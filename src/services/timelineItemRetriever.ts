import { LLMChain, LLMChainInput } from "langchain/chains";
import { Document } from "langchain/document";
import { BufferMemory } from "langchain/memory";
import {
  ChatPromptTemplate,
  FewShotChatMessagePromptTemplate,
} from "langchain/prompts";
import { ParentDocumentRetriever } from "langchain/retrievers/parent_document";
import { ScoreThresholdRetriever } from "langchain/retrievers/score_threshold";
import { SelfQueryRetriever } from "langchain/retrievers/self_query";
import { FunctionalTranslator } from "langchain/retrievers/self_query/functional";
import { BaseMessage } from "langchain/schema";
import { AttributeInfo } from "langchain/schema/query_constructor";
import { RunnableBranch, RunnableSequence } from "langchain/schema/runnable";
import { InMemoryStore } from "langchain/storage/in_memory";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { formatDocumentsAsString } from "langchain/util/document";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import WorkHistoryFormValues from "../components/WorkHistory/types";
import OpenAIClient from "./openAIClient";

export interface Response {
  result: string;
  sourceDocuments: Array<Document>;
}

class TimelineItemRetriever extends OpenAIClient {
  workHistory: WorkHistoryFormValues;
  vectorStore: MemoryVectorStore | null = null;
  memory: BufferMemory;
  documents: Document[] = [];
  retrieverChain: RunnableSequence;
  generalChain: RunnableSequence;
  refiningChain: RunnableSequence;
  specificSequence: RunnableSequence;
  generalSequence: RunnableSequence;
  discoverDocumentBranch: RunnableBranch;
  qaChain: RunnableSequence;
  slowChainPrompt = ChatPromptTemplate.fromTemplate(
    `The context provided below is from your accomplishments; use it to answer the question at the end. If you don't know the answer, just say that you don't know, don't try to make up an answer.
        ----------
        CONTEXT: {context}
        ----------
        CHAT HISTORY: {chatHistory}
        ----------
        QUESTION: {question}
        ----------
        Helpful Answer:`
  );
  fastChainPrompt = ChatPromptTemplate.fromTemplate(
    `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question. If the context is inadequate, simply return the original question.
        ----------
        CHAT HISTORY: {chatHistory}
        ----------
        FOLLOWUP QUESTION: {question}
        ----------
        Standalone question:`
  );
  refineChainPrompt = ChatPromptTemplate.fromTemplate(
    `Given a previously generated AI response and human context, refine the response to be more contextually accurate, gramatically correct, and professional. Emphasize readability by breaking a large paragraph into smaller paragraphs wherever appropriate. Avoid flowery language.
        ----------
        CONTEXT: {context}
        ----------
        RESPONSE: {response}
        ----------
        Refined answer:`
  );
  questionClassificationExamples = [
    {
      input: "Tell me about your role in this company",
      output: "general",
    },
    {
      input:
        "Tell me about the database migration project your were involved in",
      output: "specific",
    },
    {
      input: "What did you do in this role?",
      output: "general",
    },
    {
      input: "Tell me about a time you had to lead a team",
      output: "general",
    },
    {
      input: "What challenges did you face when you implemented this feature?",
      output: "specific",
    },
    {
      input: "What experience do you have with project management?",
      output: "general",
    },
    {
      input: "What are your top skills?",
      output: "general",
    },
  ];
  questionClassificationPrompt = new FewShotChatMessagePromptTemplate({
    prefix: `Classify the user's query into "general" or "specific". The broader the scope of the \
        user's query, the more "general" it is; likewise, the more targetted the search terms, the \
        more "specific" it is.`,
    suffix: "Human: {input}",
    examplePrompt: ChatPromptTemplate.fromTemplate(`{output}`),
    examples: this.questionClassificationExamples,
    inputVariables: ["input"],
  });

  constructor(workHistory: WorkHistoryFormValues) {
    super(import.meta.env.VITE_OPENAI_KEY);
    this.workHistory = workHistory;
    this.memory = new BufferMemory({
      memoryKey: "ChatHistory",
      inputKey: "question", // The key for the input to the chain
      outputKey: "text", // The key for the final conversational output of the chain
      returnMessages: true, // If using with a chat model (e.g. gpt-3.5 or gpt-4)
    });
    this.retrieverChain = RunnableSequence.from([
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
    this.generalChain = RunnableSequence.from([
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
        context: () => this.getDocuments(),
      },
      this.performQuestionAnswering,
    ]);
    this.refiningChain = RunnableSequence.from([
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
          return { llm: this.slowModel, prompt: this.refineChainPrompt };
        },
      },
      this.performAnswerRefining,
    ]);
    this.specificSequence = RunnableSequence.from([
      this.retrieverChain,
      this.refiningChain,
    ]);
    this.generalSequence = RunnableSequence.from([
      this.generalChain,
      this.refiningChain,
    ]);

    // first we take the question and classify as specific or general
    // const classifyBranch

    // then we try to discover documents; parentDocumentRetriever and selfQueryRetriever for specific
    // if specific returns nothing, then we use general
    this.discoverDocumentBranch = RunnableBranch.from([
      [
        (x: {
          relevantDocuments: Array<Document>;
          topic: string;
          question: string;
        }) => x.relevantDocuments.length > 0 && x.topic === "specific",
        this.specificSequence,
      ],
      this.generalSequence,
    ]);
    this.qaChain = RunnableSequence.from([
      {
        relevantDocuments: async (input: { question: string }) => {
          const _selfQuery = await (
            await this.fetchSelfQueryRetriever()
          ).getRelevantDocuments(input.question);
          const _parentDocument = await (
            await this.fetchParentDocumentRetriever()
          ).getRelevantDocuments(input.question);
          return _selfQuery.length > 0 ? _selfQuery : _parentDocument;
        },
        topic: async (input: { question: string }) =>
          await this.classifyQuestion(input.question),
        question: (input: { question: string }) => input.question,
      },
      this.discoverDocumentBranch,
    ]);
  }

  getDocuments = () => {
    return this.workHistory.accomplishments.map(
      (a) =>
        new Document({
          pageContent: `${a.headline}: ${a.context}`,
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

  fetchSelfQueryRetriever = async () => {
    const vectorStore = await MemoryVectorStore.fromDocuments(
      this.getDocuments(),
      this.embeddings
    );
    const documentContents = "Context of a client's work history.";
    const attributeInfo: AttributeInfo[] = [
      {
        name: "headline",
        description: "The headline/title of an accomplishment",
        type: "string",
      },
    ];
    const selfQueryRetriever = SelfQueryRetriever.fromLLM({
      llm: this.slowModel,
      vectorStore,
      documentContents,
      attributeInfo,
      structuredQueryTranslator: new FunctionalTranslator(),
    });
    return selfQueryRetriever;
  };

  fetchParentDocumentRetriever = async (filter?: Document) => {
    const vectorstore = new MemoryVectorStore(this.embeddings);
    const childDocumentRetriever = ScoreThresholdRetriever.fromVectorStore(
      vectorstore,
      {
        minSimilarityScore: 0.8,
        maxK: 1, // Only return the top result
        kIncrement: 250,
        searchType: "similarity",
        filter(doc) {
          if (!filter) return true;
          return doc == filter;
        },
      }
    );
    const docstore = new InMemoryStore();
    const retriever = new ParentDocumentRetriever({
      vectorstore,
      childDocumentRetriever,
      docstore,
      childSplitter: new RecursiveCharacterTextSplitter({
        chunkOverlap: 0,
        chunkSize: 100,
      }),
      childK: 250,
      parentK: 50,
    });
    await retriever.addDocuments(this.getDocuments());
    return retriever;
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
    const skills = input.context
      .map((d) => d.metadata.skills)
      .flat()
      .join(", ");
    const serializedDocs = formatDocumentsAsString(input.context);
    let _context;
    if (skills.trim().length > 0) {
      _context = `${serializedDocs}\nSkills: ${skills}`;
    } else {
      _context = serializedDocs;
    }

    const chatHistoryString = input.chatHistory
      ? input.chatHistorySerializer(input.chatHistory)
      : null;

    const fastChain = new LLMChain(input.fastChainSettings);
    const slowChain = new LLMChain(input.slowChainSettings);

    if (chatHistoryString) {
      // Call the faster chain to generate a new question
      const { text } = await fastChain.invoke({
        chatHistory: chatHistoryString,
        context: _context,
        question: input.question,
      });

      newQuestion = text;
    }

    const response = await slowChain.invoke({
      chatHistory: chatHistoryString ?? "",
      context: _context,
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

  classifyQuestion = async (question: string) => {
    const fewShotPrompt = await this.questionClassificationPrompt.format({
      input: question,
    });
    const response = (await this.baseModel.invoke(fewShotPrompt)).trim();
    return response;
  };

  ask = async (question: string): Promise<Response> => {
    const response = await this.qaChain.invoke({ question });
    if (response.sourceDocuments.length === 0) {
      return await this.generalChain.invoke({ question });
    }
    return response;
  };
}

export default TimelineItemRetriever;
