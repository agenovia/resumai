import { useQuery } from "react-query";
import WorkHistoryFormValues from "../components/WorkHistory/types";
import RetrieverClient from "../services/retrieverClient";

interface Props {
  workHistory: WorkHistoryFormValues;
}

const useRetriever = ({ workHistory }: Props) => {
  const fetchRetriever = () => {
    const retriever = new RetrieverClient(workHistory);
    return retriever;
  };

  const { data: retriever } = useQuery({
    queryKey: ["RAG", workHistory],
    queryFn: () => fetchRetriever(),
  });

  return { retriever };
};

export default useRetriever;
