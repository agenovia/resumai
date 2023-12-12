import { VStack } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import "./App.css";
import AddWorkHistoryButton from "./components/WorkHistory/AddWorkHistoryButton";
import WorkHistoryForm from "./components/WorkHistory/WorkHistoryForm";
import WorkHistoryFormValues from "./components/WorkHistory/types";
import WorkTimeline from "./components/WorkTimeline/WorkTimeline";

function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [workHistory, setWorkHistory] = useState<WorkHistoryFormValues[]>([]);

  const handleSubmit = (values: WorkHistoryFormValues) => {
    setModalOpen(false);
    const sortedWorkHistory = [...workHistory, values].sort((a, b) => {
      if (Date.parse(a.startDate) === Date.parse(b.startDate)) {
        return 0;
      }
      return a.startDate > b.startDate ? -1 : 1;
    });
    setWorkHistory(sortedWorkHistory);
  };

  const saveHistory = (items: WorkHistoryFormValues[]) => {
    localStorage.setItem("resumai-work-history", JSON.stringify(items));
  };

  useEffect(() => {
    if (workHistory.length > 0) {
      saveHistory(workHistory);
    }
  }, [workHistory]);

  useEffect(() => {
    const storedHistory = localStorage.getItem("resumai-work-history");
    if (storedHistory) {
      setWorkHistory([...JSON.parse(storedHistory)]);
    }
  }, []);

  const handleDelete = (entry: WorkHistoryFormValues) => {
    const newWorkHistory = workHistory.filter((item) => item !== entry);
    setWorkHistory(newWorkHistory);
    saveHistory(newWorkHistory);
  };

  return (
    <VStack spacing="24px">
      <WorkHistoryForm
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />
      <AddWorkHistoryButton onAddWorkHistory={() => setModalOpen(true)} />
      <WorkTimeline workHistory={workHistory} />
    </VStack>
  );
}

export default App;
