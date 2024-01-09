import { Flex, Grid, GridItem } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import "./App.css";
import ChatDrawerSection from "./components/Chat/ChatDrawerSection";
import AddWorkHistoryButton from "./components/WorkHistory/AddWorkHistoryButton";
import WorkHistoryForm from "./components/WorkHistory/WorkHistoryForm";
import WorkHistoryFormValues from "./components/WorkHistory/types";
import WorkTimelineItem from "./components/WorkTimeline/WorkTimelineItem";

function App() {
  const [modalOpen, setModalOpen] = useState(false);
  const [workHistory, setWorkHistory] = useState<WorkHistoryFormValues[]>([]);
  const [selectedEditHistory, setSelectedEditHistory] =
    useState<WorkHistoryFormValues>();
  const [selectedChatItem, setSelectedChatItem] =
    useState<WorkHistoryFormValues>();
  const [replaceIndex, setReplaceIndex] = useState<number>();

  const flushReplace = () => {
    setSelectedEditHistory(undefined);
    setReplaceIndex(undefined);
  };

  const saveHistory = (items: WorkHistoryFormValues[]) => {
    localStorage.setItem("resumai-work-history", JSON.stringify(items));
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

  const handleAddNewEntry = () => {
    flushReplace();
    setModalOpen(true);
  };

  const handleDeleteEntry = (entry: WorkHistoryFormValues) => {
    const newWorkHistory = workHistory.filter((item) => item !== entry);
    setWorkHistory(newWorkHistory);
    saveHistory(newWorkHistory);
    flushReplace();
  };

  const handleEditEntry = (entry: WorkHistoryFormValues) => {
    const editHistoryIndex = workHistory.indexOf(entry);
    setSelectedEditHistory(workHistory[editHistoryIndex]);
    setReplaceIndex(editHistoryIndex);
    setModalOpen(true);
  };

  const handleCloseForm = () => {
    flushReplace();
    setModalOpen(false);
  };

  const handleOpenChat = (workHistoryItem: WorkHistoryFormValues) => {
    setSelectedChatItem(workHistoryItem);
  };

  const handleCloseChat = () => {
    setSelectedChatItem(undefined);
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
    window.scrollTo(0, 0);
  }, []);

  return (
    <Grid
      templateAreas={{
        lg: `"aside header aside"
             "aside main aside"
             `,
        md: `"header header header"
             "main main main"
             `,
      }}
      templateRows={`"100px 1fr"`}
      templateColumns={{ lg: `"100px 1fr 100px"`, md: `"0.1fr"` }}
    >
      <WorkHistoryForm
        isOpen={modalOpen}
        onClose={handleCloseForm}
        onSubmit={handleSubmit}
        workHistory={selectedEditHistory}
        replaceIndex={replaceIndex}
      />
      <GridItem area={"header"}>
        <AddWorkHistoryButton onAddWorkHistory={handleAddNewEntry} />
      </GridItem>
      <GridItem area={"main"} pt={["100px", "80px", "50px", 0]}>
        <Flex direction="column">
          {workHistory.map((item, idx) => (
            <WorkTimelineItem
              expanded={false}
              key={idx}
              index={idx}
              workHistoryItem={item}
              onChatClick={handleOpenChat}
              onDelete={handleDeleteEntry}
              onEdit={handleEditEntry}
            />
          ))}
        </Flex>
      </GridItem>
      <ChatDrawerSection
        selectedChatItem={selectedChatItem}
        handleCloseChat={handleCloseChat}
      />
    </Grid>
  );
}

export default App;
