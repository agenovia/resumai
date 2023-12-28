import { Box, Flex, Spacer, Text, VStack } from "@chakra-ui/react";
import { Document } from "langchain/document";
import BeatLoader from "react-spinners/BeatLoader";

interface ChatMessage {
  from: "system" | "user";
  text: string;
  seq: number;
  sourceDocuments?: Array<Document>;
}

interface ContextCard {
  sourceDocuments: Array<Document> | undefined;
}

interface Props {
  message?: ChatMessage;
  isLoading?: boolean;
}

const ContextCards = ({ sourceDocuments }: ContextCard) => {
  if (!sourceDocuments || sourceDocuments.length === 0) return;
  return (
    <Box bgColor="blackAlpha.200" borderRadius={10} mt={4} p={4}>
      <VStack align="left">
        <Text as="b" opacity={0.6}>
          Context sources:
        </Text>
        {sourceDocuments.length > 0 &&
          sourceDocuments.map((x, idx) => (
            <Text size="4px" key={idx} opacity={0.6}>
              - {x.metadata.headline}
            </Text>
          ))}
      </VStack>
    </Box>
  );
};

const ChatMessage = ({ message, isLoading }: Props) => {
  const isUser = message?.from === "user";
  return (
    <>
      <Flex ms={isUser ? 10 : 0} me={isUser ? 0 : 10}>
        {!isLoading && isUser && <Spacer />}
        <VStack>
          <Text
            bgColor={isLoading ? "orange" : isUser ? "dodgerblue" : "orange"}
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
            {!isLoading && (
              <ContextCards sourceDocuments={message?.sourceDocuments} />
            )}
          </Text>
        </VStack>
      </Flex>
    </>
  );
};

export default ChatMessage;
