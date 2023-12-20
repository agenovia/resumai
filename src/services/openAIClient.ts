import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";

class OpenAIClient {
  client: OpenAI;
  embeddings: OpenAIEmbeddings;

  constructor(apiKey: string) {
    const settings = { openAIApiKey: apiKey };
    this.client = new OpenAI(settings);
    this.embeddings = new OpenAIEmbeddings(settings);
  }
}

export default OpenAIClient;
