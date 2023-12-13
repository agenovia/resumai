import { Document } from "langchain/document";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";
import { ScoreThresholdRetriever } from "langchain/retrievers/score_threshold";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import WorkHistoryFormValues, {
  WorkAccomplishment,
} from "../components/WorkHistory/types";

class ChatClient {
  apiKey: string;
  workHistory: WorkHistoryFormValues[];
  private client: OpenAI;
  private embeddings: OpenAIEmbeddings;
  private splitter: RecursiveCharacterTextSplitter;
  private retriever: ScoreThresholdRetriever<MemoryVectorStore> | null;

  constructor(apiKey: string, workHistory: WorkHistoryFormValues[]) {
    this.retriever = null;
    this.apiKey = apiKey;
    const settings = { openAIApiKey: apiKey };
    this.client = new OpenAI(settings);
    this.embeddings = new OpenAIEmbeddings(settings);
    this.workHistory = workHistory;
    this.splitter = new RecursiveCharacterTextSplitter({
      chunkSize: 500,
      chunkOverlap: 100,
    });
    // this.store = new MemoryVectorStore(this.embeddings);
    this.setRetriever();
  }

  private async setRetriever() {
    const docs = [
      ...(await this.getAccomplishments()),
      ...(await this.getResponsibilities()),
    ];
    const store = await MemoryVectorStore.fromDocuments(docs, this.embeddings);
    this.retriever = ScoreThresholdRetriever.fromVectorStore(store, {
      minSimilarityScore: 0.8,
      maxK: 100,
      kIncrement: 2,
    });
  }

  private async getResponsibilities() {
    const docs =
      this.workHistory.map(
        (v) =>
          new Document({
            pageContent: v.description,
            metadata: {
              company: v.company,
              jobTitle: v.jobTitle,
              startDate: v.startDate,
              endDate: v.endDate,
            },
          })
      ) ?? [];

    const ret = this.splitter.splitDocuments(docs).then((x) => x);
    return ret;
  }

  private async getAccomplishments() {
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
                skills: a.skills
                  .split(/(?:,|;)+/)
                  .filter((x) => x.trim().length > 0),
              },
            })
        ) ?? []
    );
    return await this.splitter.splitDocuments(docs);
  }

  async getRelevantDocuments(query: string) {
    await this.retriever?.getRelevantDocuments(query);
  }
}

export default ChatClient;
