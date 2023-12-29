import { ChatOpenAI } from "langchain/chat_models/openai";
import { OpenAIEmbeddings } from "langchain/embeddings/openai";
import { OpenAI } from "langchain/llms/openai";

class OpenAIClient {
  baseModel: OpenAI;
  fastModel: ChatOpenAI;
  slowModel: ChatOpenAI;
  embeddings: OpenAIEmbeddings;
  abortController = new AbortController();

  constructor(apiKey: string) {
    const settings = { openAIApiKey: apiKey };
    this.baseModel = new OpenAI(settings);
    this.fastModel = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: "gpt-3.5-turbo",
    });
    this.slowModel = new ChatOpenAI({
      openAIApiKey: apiKey,
      modelName: "gpt-4",
    });
    this.fastModel.bind({ signal: this.abortController.signal });
    this.slowModel.bind({ signal: this.abortController.signal });
    this.baseModel.bind({ signal: this.abortController.signal });
    this.embeddings = new OpenAIEmbeddings(settings);
  }
}

export default OpenAIClient;
