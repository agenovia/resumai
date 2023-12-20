import {
  Box,
  Flex,
  HStack,
  Icon,
  IconButton,
  SlideFade,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { GoDot, GoDotFill, GoPencil, GoTrash } from "react-icons/go";

import WorkHistoryFormValues from "../WorkHistory/types";
import "./styles.css";
import WorkTimelineCard from "./WorkTimelineCard";

interface Props {
  workHistoryItem: WorkHistoryFormValues;
  expanded: boolean;
  index: number;
  onDelete: (entry: WorkHistoryFormValues) => void;
  onEdit: (entry: WorkHistoryFormValues) => void;
  onChatClick: (
    workHistory: WorkHistoryFormValues,
    metadataFilter?: Record<string, unknown>
  ) => void;
}

const WorkTimelineItem = ({
  workHistoryItem,
  expanded,
  index,
  onDelete,
  onEdit,
  onChatClick,
}: Props) => {
  const [isExpanded, setExpanded] = useState(expanded);
  const isCurrent = workHistoryItem.endDate.length === 0;
  const delayMultiplier = Math.max(+(0.75 / (index + 1)).toFixed(2), 0.05);

  const getDuration = (startDate: string, endDate: string) => {
    const start = new Date(startDate + "T00:00:00");
    const end = new Date(endDate + "T00:00:00");
    const totalMonths =
      end.getMonth() -
      start.getMonth() +
      12 * (end.getFullYear() - start.getFullYear());
    const months = totalMonths % 12;
    const years = Math.floor(totalMonths / 12);
    const arr = [];
    if (years === 1) {
      arr.push(`${years} year`);
    } else if (years > 1) {
      arr.push(`${years} years`);
    }

    if (months === 1) {
      arr.push(`${months} month`);
    } else if (months > 1) {
      arr.push(`${months} months`);
    }

    if (arr.length > 0) {
      return arr.join(", ");
    } else {
      return "Less than 1 month";
    }
  };

  useEffect(() => {
    setTimeout(() => {
      setExpanded(true);
    }, 500);
  }, []);

  return (
    <SlideFade
      in={isExpanded}
      transition={{
        exit: { duration: 0.5 },
        enter: {
          duration: 1.2,
          delay: delayMultiplier ? delayMultiplier * 1 : 0,
        },
      }}
      offsetX="-80px"
      offsetY="0px"
      unmountOnExit
    >
      <Box pt={2} pb={2}>
        <Flex direction="row">
          <HStack spacing={4} pb={1}>
            <Icon as={isCurrent ? GoDotFill : GoDot} position="absolute" />
            <HStack align="baseline">
              {isCurrent ? (
                <Text as="b" pl="20px">
                  Present
                </Text>
              ) : (
                <Text pl="20px">{workHistoryItem.endDate}</Text>
              )}
              <Text fontSize="12px" as="em">
                {getDuration(
                  workHistoryItem.startDate,
                  workHistoryItem.endDate
                )}
              </Text>
            </HStack>
          </HStack>
        </Flex>
        <HStack spacing={2}>
          <Flex m={2} w="100%">
            <Box bgColor="tomato" w="2px" h="inherit" rounded="full" />
            <Flex
              className="main-content"
              bg="papayawhip"
              w="100%"
              direction="row"
              shadow="md"
            >
              <VStack spacing={2}>
                <WorkTimelineCard
                  workHistoryItem={workHistoryItem}
                  onChatClick={onChatClick}
                />
                <HStack spacing={2}>
                  <IconButton
                    aria-label="Delete this entry"
                    title="Delete this entry"
                    icon={<GoTrash />}
                    onClick={() => onDelete(workHistoryItem)}
                    rounded="full"
                    colorScheme="red"
                    size="xs"
                  />
                  <IconButton
                    aria-label="Edit this entry"
                    title="Edit this entry"
                    icon={<GoPencil />}
                    onClick={() => onEdit(workHistoryItem)}
                    rounded="full"
                    size="xs"
                    colorScheme="orange"
                  />
                </HStack>
              </VStack>
            </Flex>
          </Flex>
        </HStack>
        <Flex direction="row">
          <HStack spacing={4} pb={1}>
            <Icon as={GoDot} position="absolute" />
            <Text pl="20px">{workHistoryItem.startDate}</Text>
          </HStack>
        </Flex>
      </Box>
    </SlideFade>
  );
};

export default WorkTimelineItem;
