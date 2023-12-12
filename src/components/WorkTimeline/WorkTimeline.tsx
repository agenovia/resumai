import {
  Drawer,
  DrawerContent,
  DrawerOverlay,
  Flex,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import ChatBox from "../Chat/ChatBox";
import WorkHistoryFormValues, {
  WorkAccomplishment,
} from "../WorkHistory/types";
import WorkTimelineItem from "./WorkTimelineItem";

interface Props {
  workHistory: WorkHistoryFormValues[];
}

const WorkTimeline = ({ workHistory }: Props) => {
  const [selectedAccomplishments, setSelectedAccomplishments] = useState<
    WorkAccomplishment[]
  >([]);
  const [topic, setTopic] = useState("");

  const handleChatClick = (
    accomplishments: WorkAccomplishment[],
    metadata: WorkHistoryFormValues
  ) => {
    setSelectedAccomplishments(accomplishments);
    if (accomplishments.length === 1) {
      setTopic(accomplishments[0].headline);
    } else {
      setTopic(
        `Aaron's accomplishments as a ${metadata.jobTitle} at ${metadata.company}`
      );
    }
  };

  const handleCloseChat = () => {
    setSelectedAccomplishments([]);
  };

  return (
    <Flex direction="column" align="left" m={4} pl={10} pr={10}>
      {workHistory.map((item, idx) => (
        <WorkTimelineItem
          expanded={false}
          key={idx}
          workHistoryItem={item}
          delayMultiplier={Math.max(1 / (idx + 1), 0.1)}
          onChatClick={handleChatClick}
        />
      ))}

      <Drawer
        placement="bottom"
        size="lg"
        onClose={handleCloseChat}
        isOpen={selectedAccomplishments.length > 0}
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
              workAccomplishments={selectedAccomplishments}
              topic={topic}
            />
          </VStack>
        </DrawerContent>
      </Drawer>
    </Flex>
  );
};

export default WorkTimeline;
