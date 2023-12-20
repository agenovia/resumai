import {
  Drawer,
  DrawerContent,
  DrawerOverlay,
  Flex,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import ChatBox from "../Chat/ChatBox";
import WorkHistoryFormValues from "../WorkHistory/types";
import WorkTimelineItem from "./WorkTimelineItem";

interface Props {
  workHistory: WorkHistoryFormValues[];
  onDelete: (entry: WorkHistoryFormValues) => void;
  onEdit: (entry: WorkHistoryFormValues) => void;
}

const WorkTimeline = ({ workHistory, onDelete, onEdit }: Props) => {
  const [selectedHistory, setSelectedHistory] = useState<
    WorkHistoryFormValues[]
  >([]);
  const [metadataFilter, setMetadataFilter] =
    useState<Record<string, unknown>>();

  const handleChatClick = (
    workHistory: WorkHistoryFormValues[],
    metadataFilter?: Record<string, unknown>
  ) => {
    setSelectedHistory(workHistory);
    setMetadataFilter(metadataFilter);
  };

  const handleCloseChat = () => {
    setSelectedHistory([]);
  };

  return (
    <Flex direction="column" align="left" m={4} pl={10} pr={10}>
      {workHistory.map((item, idx) => (
        <WorkTimelineItem
          expanded={false}
          key={idx}
          workHistoryItem={item}
          delayMultiplier={Math.max(+(0.75 / (idx + 1)).toFixed(2), 0.05)}
          onChatClick={handleChatClick}
          onDelete={onDelete}
          onEdit={onEdit}
        />
      ))}

      <Drawer
        placement="bottom"
        size="lg"
        onClose={handleCloseChat}
        isOpen={selectedHistory.length > 0}
        closeOnOverlayClick
      >
        <DrawerOverlay />
        <DrawerContent
          pb={10}
          pt={10}
          pl={4}
          pr={4}
          borderRadius={10}
          bgColor="transparent"
        >
          <VStack>
            <ChatBox
              workHistory={selectedHistory}
              metadataFilter={metadataFilter}
            />
          </VStack>
        </DrawerContent>
      </Drawer>
    </Flex>
  );
};

export default WorkTimeline;
