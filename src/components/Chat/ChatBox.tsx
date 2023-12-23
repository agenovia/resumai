import {
  Box,
  Center,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { LuSend } from "react-icons/lu";
import useTimelineItemRetriever from "../../hooks/useTimelineItemRetriever";
import WorkHistoryFormValues from "../WorkHistory/types";
import ChatMessage from "./ChatMessage";
import { BaseMessage } from "langchain/schema";

interface Props {
  workHistory: WorkHistoryFormValues;
}

const ChatBox = ({ workHistory }: Props) => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState("");
  const { retriever } = useTimelineItemRetriever({ workHistory });
  const splashMessage = `Hi, I'm ResumAI. I can help you answer questions you may \
  have about the client's work history. You can try asking simple questions like "What are \
  the client's top accomplishments in 2022" or deep dive into context not normally addressed \
  in a resume like "Tell me about the time you implemented a new feature at [company]. \
  What were some of the challenges and how did you overcome them?"`;

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
  };

  return (
    <Center>
      <VStack>
        <Box
          borderRadius={10}
          bgColor="gray.200"
          shadow="lg"
          overflowY="auto"
          h="50vh"
        >
          {/* <Heading size="md" textAlign="center" p={2}>
            <Text p={2}>Topic: {topic}</Text>
          </Heading> */}
          {chatHistory.map((message) => (
            <ChatMessage message={message} key={message.seq} />
          ))}
        </Box>
        <InputGroup>
          <Input
            bgColor="gray.300"
            variant="outline"
            shadow="lg"
            placeholder="Ask a question"
            onKeyUp={(e) => {
              if (e.key === "Enter") {
                handleSend();
              }
            }}
            onChange={(e) => setQuery(e.target.value)}
            value={query}
          />
          <InputRightElement>
            <IconButton
              aria-label="send-query"
              title="Send Query"
              icon={<LuSend />}
              size="sm"
              variant="ghost"
              onClick={() => handleSend()}
            />
          </InputRightElement>
        </InputGroup>
      </VStack>
    </Center>
  );
};

export default ChatBox;
