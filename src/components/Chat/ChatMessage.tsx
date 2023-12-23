import { Flex, Spacer, Text } from "@chakra-ui/react";
import BeatLoader from "react-spinners/BeatLoader";

interface ChatMessage {
  from: "system" | "user";
  text: string;
  seq: number;
}

interface Props {
  message?: ChatMessage;
  isLoading?: boolean;
}

const ChatMessage = ({ message, isLoading }: Props) => {
  const isUser = message?.from === "user";
  return (
    <Flex ms={isUser ? 10 : 0} me={isUser ? 0 : 10}>
      {!isLoading && isUser && <Spacer />}
      <Text
        bgColor={!isLoading ? (isUser ? "green.300" : "teal.300") : "teal.300"}
        m={2}
        p={4}
        pr={5}
        shadow="sm"
        borderRadius={10}
        align="left"
        whiteSpace="pre-line"
      >
        {!isLoading ? (
          message?.text ?? ""
        ) : (
          <BeatLoader
            size="8px"
            speedMultiplier={0.7}
            cssOverride={{ opacity: 0.5 }}
          />
        )}
      </Text>
    </Flex>
  );
};

export default ChatMessage;
