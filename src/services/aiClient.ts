import { Document } from "langchain/document";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";
import {
  FunctionalTranslator,
  SelfQueryRetriever,
} from "langchain/retrievers/self_query";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { WorkAccomplishment } from "../components/WorkHistory/types";
import { accomplishmentAttributes } from "./attributeInfo";

class AIClient {
  apiKey: string;
  private accomplishments: Document[];
  private embeddings: OpenAIEmbeddings;
  private model: OpenAI;
  private splitter: RecursiveCharacterTextSplitter;
  private workAccomplishments: WorkAccomplishment[];

  constructor(apiKey: string, workHistory: WorkAccomplishment[]) {
    this.apiKey = apiKey;
    this.workAccomplishments = workHistory;
    this.embeddings = new OpenAIEmbeddings({ openAIApiKey: this.apiKey });
    this.model = new OpenAI({ openAIApiKey: this.apiKey });
    this.accomplishments = [];
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 100,
    });
    this.setAccomplishments();
  }

  private setAccomplishments = async () => {
    const docs = this.workAccomplishments.map((a) => {
      return new Document({
        pageContent: a.headline,
        metadata: {
          context: a.context,
          skills: a.skills,
        },
      });
    });
    this.accomplishments = await this.splitter.splitDocuments(docs);
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
    //return await this.fromDescriptions(query);
    return await this.fromAccomplishments(query);
  };
}

export default AIClient;
