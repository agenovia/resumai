// import { useQuery } from "react-query";
import { useQuery } from "@tanstack/react-query";
import WorkHistoryFormValues from "../components/WorkHistory/types";
import TimelineItemRetriever from "../services/timelineItemRetriever";

interface Props {
  workHistory: WorkHistoryFormValues;
}

const useTimelineItemRetriever = ({ workHistory }: Props) => {
  const fetchRetriever = () => {
    const retriever = new TimelineItemRetriever(workHistory);
    return retriever;
  };

  const { data: retriever } = useQuery({
    queryKey: ["RAG", workHistory],
    queryFn: () => fetchRetriever(),
  });

  return { retriever };
};

export default useTimelineItemRetriever;
