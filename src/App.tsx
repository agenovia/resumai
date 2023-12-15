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
  const [selectedEditHistory, setSelectedEditHistory] =
    useState<WorkHistoryFormValues>();
  const [replaceIndex, setReplaceIndex] = useState<number>();

  const flushReplace = () => {
    setSelectedEditHistory(undefined);
    setReplaceIndex(undefined);
  };

  const handleSubmit = (
    values: WorkHistoryFormValues,
    replaceIndex?: number
  ) => {
    var newWorkHistory = workHistory;
    setModalOpen(false);
    if (replaceIndex !== undefined) {
      newWorkHistory[replaceIndex] = values;
    } else {
      newWorkHistory = [...workHistory, values];
    }
    const sortedWorkHistory = newWorkHistory.sort((a, b) => {
      if (Date.parse(a.startDate) === Date.parse(b.startDate)) {
        return 0;
      }
      return a.startDate > b.startDate ? -1 : 1;
    });
    setWorkHistory(sortedWorkHistory);
    flushReplace();
  };

  const saveHistory = (items: WorkHistoryFormValues[]) => {
    localStorage.setItem("resumai-work-history", JSON.stringify(items));
  };

  useEffect(() => {
    if (workHistory.length > 0) {
      saveHistory(workHistory);
    }
  }, [workHistory, selectedEditHistory]);

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
    flushReplace();
  };

  const handleEdit = (entry: WorkHistoryFormValues) => {
    const editHistoryIndex = workHistory.indexOf(entry);
    setSelectedEditHistory(workHistory[editHistoryIndex]);
    setReplaceIndex(editHistoryIndex);
    setModalOpen(true);
  };

  const handleAddNewEntry = () => {
    flushReplace();
    setModalOpen(true);
  };

  const handleClose = () => {
    flushReplace();
    setModalOpen(false);
  };

  return (
    <VStack spacing="24px">
      <WorkHistoryForm
        isOpen={modalOpen}
        onClose={handleClose}
        onSubmit={handleSubmit}
        workHistory={selectedEditHistory}
        replaceIndex={replaceIndex}
      />
      <AddWorkHistoryButton onAddWorkHistory={handleAddNewEntry} />
      <WorkTimeline
        workHistory={workHistory}
        onDelete={handleDelete}
        onEdit={handleEdit}
      />
    </VStack>
  );
}

export default App;
