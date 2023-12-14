import { Document } from "langchain/document";
import { ScoreThresholdRetriever } from "langchain/retrievers/score_threshold";
import { RecursiveCharacterTextSplitter } from "langchain/text_splitter";
import { MemoryVectorStore } from "langchain/vectorstores/memory";
import { useQuery } from "react-query";
import WorkHistoryFormValues from "../components/WorkHistory/types";
import ChatClient from "../services/chatClient";
import { RAGHookSettings, SplitterSettings } from "./types";

interface Props {
  client: ChatClient;
  workHistory: WorkHistoryFormValues[];
  ragSettings?: RAGHookSettings;
  splitterSettings?: SplitterSettings;
}

const useRetriever = ({
  client,
  workHistory,
  ragSettings,
  splitterSettings,
}: Props) => {
  const _ragSettings = ragSettings ?? {
    minSimilarityScore: 0.75,
    maxK: 100,
    kIncrement: 2,
  };
  const _splitterSettings = splitterSettings ?? {
    chunkSize: 500,
    chunkOverlap: 100,
  };
  const splitter = new RecursiveCharacterTextSplitter(_splitterSettings);
  const accomplishments = workHistory.flatMap((v) =>
    v.accomplishments.map(
      (a) =>
        new Document({
          pageContent: a.headline,
          metadata: {
            company: v.company,
            jobTitle: v.jobTitle,
            startDate: v.startDate,
            endDate: v.endDate,
            context: a.context,
            skills: a.skills,
            section: "accomplishments",
          },
        })
    )
  );

  const responsibilities = workHistory.flatMap((v) =>
    v.description.map(
      (a) =>
        new Document({
          pageContent: a,
          metadata: {
            company: v.company,
            jobTitle: v.jobTitle,
            startDate: v.startDate,
            endDate: v.endDate,
            section: "responsibilities",
          },
        })
    )
  );

  const docs = [...responsibilities, ...accomplishments];

  const fetchRetriever = async () => {
    const vectorStore = await MemoryVectorStore.fromDocuments(
      await splitter.splitDocuments(docs),
      client.embeddings
    );
    const retriever = ScoreThresholdRetriever.fromVectorStore(
      vectorStore,
      _ragSettings
    );
    return retriever;
  };

  const { data: retriever } = useQuery({
    queryKey: ["rag", docs],
    queryFn: () => fetchRetriever(),
  });

  return { retriever };
};

export default useRetriever;
