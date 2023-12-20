import { ChatOpenAI } from "langchain/chat_models/openai";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";

class OpenAIClient {
  baseClient: OpenAI;
  fastModel: ChatOpenAI;
  slowModel: ChatOpenAI;
  embeddings: OpenAIEmbeddings;

  constructor(apiKey: string) {
    const settings = { openAIApiKey: apiKey };
    this.baseClient = new OpenAI(settings);
    this.fastModel = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: "gpt-3.5-turbo",
    });
    this.slowModel = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: "gpt-4",
    });
    this.embeddings = new OpenAIEmbeddings(settings);
  }
}

export default OpenAIClient;
