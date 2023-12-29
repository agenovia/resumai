import {
  Drawer,
  DrawerCloseButton,
  DrawerContent,
  DrawerOverlay,
  HStack,
} from "@chakra-ui/react";
import WorkHistoryFormValues from "../WorkHistory/types";
import WorkTimelineCard from "../WorkTimeline/WorkTimelineCard";
import ChatBox from "./ChatBox";

interface Props {
  selectedChatItem: WorkHistoryFormValues | undefined;
  handleCloseChat: () => void;
}

const ChatDrawerSection = ({ selectedChatItem, handleCloseChat }: Props) => {
  return (
    <Drawer
      placement="right"
      size="full"
      onClose={handleCloseChat}
      isOpen={selectedChatItem !== undefined}
    >
      <DrawerOverlay />
      <DrawerContent
        bgColor="whiteAlpha.900"
        motionProps={{
          variants: {
            enter: {
              x: "0%",
              transition: { duration: 1.5 },
            },
            exit: {
              x: "0%",
              transition: { duration: 1 },
            },
          },
        }}
      >
        {selectedChatItem && (
          <>
            <DrawerCloseButton
              title="Close Chat"
              position="relative"
              ml="30px"
              boxShadow="dark-lg"
              rounded="full"
            />
            <HStack m={4} justifyContent="space-between">
              <WorkTimelineCard workHistoryItem={selectedChatItem} />
              <ChatBox workHistory={selectedChatItem} />
            </HStack>
          </>
        )}
      </DrawerContent>
    </Drawer>
  );
};

export default ChatDrawerSection;
