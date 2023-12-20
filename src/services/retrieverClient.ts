import { Document, DocumentInput } from "langchain/document";
import { PromptTemplate } from "langchain/prompts";
import {
  ScoreThresholdRetriever,
  ScoreThresholdRetrieverInput,
} from "langchain/retrievers/score_threshold";
import {
  FunctionalTranslator,
  SelfQueryRetriever,
} from "langchain/retrievers/self_query";
import { RunnablePassthrough, RunnableSequence } from "langchain/runnables";
import { StringOutputParser } from "langchain/schema/output_parser";
import {
  RecursiveCharacterTextSplitter,
  RecursiveCharacterTextSplitterParams,
} from "langchain/text_splitter";
import { formatDocumentsAsString } from "langchain/util/document";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import WorkHistoryFormValues from "../components/WorkHistory/types";
import { accomplishmentAttributes } from "./attributeInfo";
import OpenAIClient from "./openAIClient";
import { formatDocument } from "langchain/schema/prompt_template";

/*
This is where we put all the logic behind the chains.

Required methods are:
- fetchRetriever: returns a retriever that can be used to retrieve documents
- fetchGenerator: returns a generator that can be used to generate text
- ask: 
*/
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

class RetrieverClient extends OpenAIClient {
  workHistory: WorkHistoryFormValues[];
  retrieverSettings: RetrieverSettings;
  splitterSettings: SplitterSettings;
  splitter: RecursiveCharacterTextSplitter;
  vectorStore: MemoryVectorStore | null = null;
  private documents: Document[] = [];

  constructor(
    workHistory: WorkHistoryFormValues[],
    retrieverSettings?: RetrieverSettings,
    splitterSettings?: SplitterSettings
  ) {
    super(import.meta.env.VITE_OPENAI_KEY);
    this.workHistory = workHistory;
    this.retrieverSettings = retrieverSettings ?? defaultRetrieverSettings;
    this.splitterSettings = splitterSettings ?? defaultSplitterSettings;
    this.splitter = new RecursiveCharacterTextSplitter(this.splitterSettings);
  }

  private splitDocuments = async () => {
    if (this.documents.length > 0) {
      return this.documents;
    } else {
      const accomplishments = this.workHistory.flatMap((v) =>
        v.accomplishments.map(
          (a) =>
            new Document({
              pageContent: a.context,
              metadata: {
                company: v.company,
                jobTitle: v.jobTitle,
                startDate: v.startDate,
                endDate: v.endDate,
                headline: a.headline,
                skills: a.skills,
                section: "accomplishments",
              },
            })
        )
      );
      const docs = [...accomplishments];
      return await this.splitter.splitDocuments(docs);
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

  public async fetchScoreThresholdRetriever() {
    const vectorStore = await this.fetchVectorStore();
    return ScoreThresholdRetriever.fromVectorStore(
      vectorStore,
      this.retrieverSettings
    );
  }

  public async fetchSelfQueryRetriever(
    metadataFilter?: Record<string, unknown>
  ) {
    const vectorStore = await this.fetchVectorStore();
    const retriever = SelfQueryRetriever.fromLLM({
      llm: this.client,
      vectorStore,
      documentContents: "A detailed work history of the client",
      attributeInfo: accomplishmentAttributes,
      structuredQueryTranslator: new FunctionalTranslator(),
      verbose: true,
      // searchParams: {
      //   // filter(doc) {
      //   //   return Object.entries(metadataFilter).every(([k, v]) => {
      //   //     return doc.metadata[k] === v;
      //   //   });
      //   // },
      //   filter: (doc: Document) =>
      //     doc.metadata && doc.metadata.section === "accomplishments",
      // },
    });

    return retriever;
  }

  public async ask(question: string, metadataFilter?: Record<string, unknown>) {
    // let retriever = <
    //   | ScoreThresholdRetriever<MemoryVectorStore>
    //   | VectorStoreRetriever<MemoryVectorStore>
    //   | SelfQueryRetriever<MemoryVectorStore>
    //   | undefined
    // >undefined;
    // if (metadataFilter) {
    //   retriever = await this.fetchDomainRetriever(metadataFilter);
    // } else {
    //   retriever = await this.fetchScoreThresholdRetriever();
    // }
    const retriever = await this.fetchDomainRetriever();

    const prompt =
      PromptTemplate.fromTemplate(`The name of your persona is: Aaron Genovia. \
Given the context, answer the question in the first person:
{context}.

Question: {question}.

DO NOT MAKE ANYTHING UP THAT ISN'T IN THE CONTEXT. If the context is insufficient, simply reply with "I'm not sure how to answer your question, can you rephrase that?"`);
    const chain = RunnableSequence.from([
      {
        context: retriever.pipe(formatDocumentsAsString),
        question: new RunnablePassthrough(),
      },
      prompt,
      this.client,
      new StringOutputParser(),
    ]);
    const answer = await chain.invoke(question);
    return answer.trim();
  }
}

export default RetrieverClient;
