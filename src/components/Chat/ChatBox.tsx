import {
  Box,
  Center,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  VStack,
} from "@chakra-ui/react";
import { BaseMessage } from "langchain/schema";
import { useEffect, useRef, useState } from "react";
import { LuSend } from "react-icons/lu";
import PuffLoader from "react-spinners/PuffLoader";
import useTimelineItemRetriever from "../../hooks/useTimelineItemRetriever";
import WorkHistoryFormValues from "../WorkHistory/types";
import ChatMessage from "./ChatMessage";

interface Props {
  workHistory: WorkHistoryFormValues;
}

const ChatBox = ({ workHistory }: Props) => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState("");
  const { retriever } = useTimelineItemRetriever({ workHistory });
  const [isLoading, setIsLoading] = useState(false);
  const chatWindowRef = useRef<HTMLDivElement>(null);

  const splashMessage = `Hi, I'm ResumAI. I'm here to help you dive deep into the client's \
  work history. Try asking questions like "Tell me more about your work at ${workHistory.company}"\
  or "Explain some of your accomplishments at ${workHistory.company}?"`;

  useEffect(() => {
    const setChatFromMemory = async () => {
      // const setChatFromMemory = await retriever?.memory.loadMemoryVariables({});
      // return savedMemory
      //   ? savedMemory.chatHistory?.length > 0
      //     ? savedMemory.chatHistory
      //     : null
      //   : null;
      const savedMemory = await retriever?.memory.loadMemoryVariables({});
      const chatHistory = savedMemory?.chatHistory;
      if (chatHistory) {
        // setChatHistory(chatHistory);
        chatHistory.map((chatMessage: BaseMessage, idx: number) => {
          if (chatMessage._getType() === "human") {
            setChatHistory([
              ...chatHistory,
              { from: "user", text: chatMessage.content, seq: idx },
            ]);
          } else if (chatMessage._getType() === "ai") {
            setChatHistory([
              ...chatHistory,
              { from: "system", text: chatMessage.content, seq: idx },
            ]);
          }
        });
      } else {
        handleSystemMessage(splashMessage);
      }
    };
    setChatFromMemory();
    // handleSystemMessage(splashMessage);
  }, []);

  useEffect(() => {
    chatWindowRef.current?.scrollBy(0, chatWindowRef.current?.scrollHeight);
    if (chatHistory.length === 0) return;
    const lastMessage = chatHistory[chatHistory.length - 1];
    if (lastMessage.from === "system") return;
    const query = lastMessage.text;
    const getDocs = async () => {
      await retriever
        ?.ask(query)
        .then((response) => handleSystemMessage(response));
    };
    getDocs();
  }, [chatHistory]);

  const handleSystemMessage = (message: string) => {
    setChatHistory([
      ...chatHistory,
      {
        from: "system",
        text:
          message.length > 0
            ? message
            : "I'm sorry, I don't understand, could you rephrase that?",
        seq: chatHistory.length + 1,
      } as ChatMessage,
    ]);
    setIsLoading(false);
  };

  const handleSend = () => {
    if (query.trim() === "") return;
    const message = {
      from: "user",
      text: query,
      seq: chatHistory.length + 1,
    } as ChatMessage;
    setChatHistory([...chatHistory, message]);
    setQuery("");
    setIsLoading(true);
  };
  return (
    <Center>
      <VStack>
        <Box
          borderRadius={10}
          bgColor="gray.200"
          shadow="lg"
          overflowY="scroll"
          h="80vh"
          w="60vw"
          ref={chatWindowRef}
        >
          {chatHistory.map((message) => (
            <ChatMessage message={message} key={message.seq} />
          ))}
          {isLoading && <ChatMessage isLoading={isLoading} />}
        </Box>
        <InputGroup>
          <Input
            bgColor="gray.300"
            variant="outline"
            shadow="lg"
            title={isLoading ? "🤔" : "Ask a question"}
            placeholder={isLoading ? "Thinking..." : "Ask a question"}
            onKeyUp={(e) => {
              if (e.key === "Enter") {
                handleSend();
              }
            }}
            onChange={(e) => setQuery(e.target.value)}
            value={query}
            isDisabled={isLoading}
          />
          <InputRightElement>
            {isLoading ? (
              <PuffLoader
                cssOverride={{ opacity: 0.5 }}
                color="black"
                size="25px"
              />
            ) : (
              <IconButton
                aria-label="send-query"
                title="Send Query"
                icon={<LuSend />}
                size="25px"
                variant="ghost"
                onClick={() => handleSend()}
              />
            )}
          </InputRightElement>
        </InputGroup>
      </VStack>
    </Center>
  );
};

export default ChatBox;
