import {
  Box,
  Center,
  Heading,
  IconButton,
  Input,
  InputGroup,
  InputRightElement,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { LuSend } from "react-icons/lu";
import AIClient from "../../services/aiClient";
import { WorkAccomplishment } from "../WorkHistory/types";
import ChatMessage from "./ChatMessage";

interface Props {
  workAccomplishments: WorkAccomplishment[];
  topic: string;
}

const ChatBox = ({ workAccomplishments, topic }: Props) => {
  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([]);
  const [query, setQuery] = useState("");
  const [client, setClient] = useState<AIClient>(
    new AIClient(import.meta.env.VITE_OPENAI_KEY, workAccomplishments)
  );
  const splashMessage = `Hi, I'm ResumAI. I can help you answer questions you may \
  have about the client's work history. You can try asking simple questions like "What are \
  the client's top accomplishments in 2022" or deep dive into context not normally addressed \
  in a resume like "Tell me about the time you implemented a new feature at [company]. \
  What were some of the challenges and how did you overcome them?"`;

  useEffect(() => {
    handleSystemMessage(splashMessage);
  }, []);

  useEffect(() => {
    setClient(
      new AIClient(import.meta.env.VITE_OPENAI_KEY, workAccomplishments)
    );
  }, [workAccomplishments]);

  useEffect(() => {
    if (chatHistory.length === 0) return;
    if (chatHistory[chatHistory.length - 1].from === "system") return;
    const query = chatHistory[chatHistory.length - 1].text;
    const getDocs = async () => {
      const response = await client.ask(query);
      const result = response.reduce((acc, v) => acc + v.pageContent, "");
      handleSystemMessage(result);
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
          <Heading size="md" textAlign="center" p={2}>
            <Text p={2}>Topic: {topic}</Text>
          </Heading>
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
