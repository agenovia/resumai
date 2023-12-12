import { Document } from "langchain/document";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";
import {
  FunctionalTranslator,
  SelfQueryRetriever,
} from "langchain/retrievers/self_query";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import WorkHistoryFormValues, {
  WorkAccomplishment,
} from "../components/WorkHistory/types";
import {
  accomplishmentAttributes,
  jobDescriptionAttributes,
} from "./attributeInfo";

class AIClient {
  apiKey: string;
  private descriptions: Document[];
  private accomplishments: Document[];
  private embeddings: OpenAIEmbeddings;
  private model: OpenAI;
  private splitter: RecursiveCharacterTextSplitter;
  private workHistory: WorkHistoryFormValues[];

  constructor(apiKey: string, workHistory: WorkHistoryFormValues[]) {
    this.apiKey = apiKey;
    this.workHistory = workHistory;
    this.embeddings = new OpenAIEmbeddings({ openAIApiKey: this.apiKey });
    this.model = new OpenAI({ openAIApiKey: this.apiKey });
    this.descriptions = [];
    this.accomplishments = [];
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 100,
    });
    this.setDescriptions();
    this.setAccomplishments();
  }

  // metadata should include company, title, date, ranking of accomplishments and skills split into an array
  private setDescriptions = async () => {
    const docs = this.workHistory.map(
      (w: WorkHistoryFormValues) =>
        new Document({
          pageContent: w.description,
          metadata: {
            company: w.company,
            jobTitle: w.jobTitle,
            startDate: w.startDate,
            endDate: w.endDate,
          },
        })
    );

    this.descriptions = await this.splitter.splitDocuments(docs);
  };

  private setAccomplishments = async () => {
    const docs = this.workHistory.flatMap(
      (w: WorkHistoryFormValues) =>
        w.accomplishments.flatMap(
          (a: WorkAccomplishment) =>
            new Document({
              pageContent: a.headline,
              metadata: {
                company: w.company,
                jobTitle: w.jobTitle,
                startDate: w.startDate,
                endDate: w.endDate,
                context: a.context,
                skills: a.skills?.split(/(?:,|;)+/),
              },
            })
        ) ?? []
    );
    this.accomplishments = await this.splitter.splitDocuments(docs);
  };

  fromDescriptions = async (query: string) => {
    const documentContents = "A client's detailed work history";
    const vectorStore = await MemoryVectorStore.fromDocuments(
      this.descriptions,
      this.embeddings
    );
    const selfQueryRetriever = SelfQueryRetriever.fromLLM({
      llm: this.model,
      vectorStore,
      documentContents,
      attributeInfo: jobDescriptionAttributes,
      structuredQueryTranslator: new FunctionalTranslator(),
      verbose: true,
    });
    console.log(this.descriptions);
    return await selfQueryRetriever.getRelevantDocuments(query);
  };

  fromAccomplishments = async (query: string) => {
    // console.log(this.accomplishments);
    const documentContents = "A client's detailed accomplishment history";
    const vectorStore = await MemoryVectorStore.fromDocuments(
      this.accomplishments,
      this.embeddings
    );
    const selfQueryRetriever = SelfQueryRetriever.fromLLM({
      llm: this.model,
      vectorStore,
      documentContents,
      attributeInfo: accomplishmentAttributes,
      structuredQueryTranslator: new FunctionalTranslator(),
      verbose: true,
    });

    return await selfQueryRetriever.getRelevantDocuments(query);
  };

  ask = async (query: string) => {
    // here is where we put our discriminator
    return await this.fromDescriptions(query);
    // return await this.fromAccomplishments(query);
  };
}

export default AIClient;
