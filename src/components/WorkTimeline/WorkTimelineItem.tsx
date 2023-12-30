import {
  AlertDialog,
  AlertDialogBody,
  AlertDialogContent,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogOverlay,
  Box,
  Button,
  Flex,
  HStack,
  Icon,
  IconButton,
  SlideFade,
  Text,
  useDisclosure,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useRef, useState } from "react";
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
  const {
    isOpen: alertIsOpen,
    onOpen: alertOnOpen,
    onClose: alertOnClose,
  } = useDisclosure();
  const cancelRef = useRef(null);
  const isCurrent = workHistoryItem.endDate.length === 0;
  const delayMultiplier = Math.max(+(0.75 / (index + 1)).toFixed(2), 0.05);

  useEffect(() => {
    setTimeout(() => {
      setExpanded(true);
    }, 500);
  }, []);

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

  const handleDelete = () => {
    alertOnClose();
    onDelete(workHistoryItem);
  };

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
          <Flex m={2}>
            <Box bgColor="tomato" w="2px" h="inherit" rounded="full" />
            <Flex
              className="main-content"
              bg="papayawhip"
              // w="100%"
              direction="row"
              shadow="md"
              w="1000px"
              minW="400px"
              maxW="1000px"
              h="100%"
            >
              <VStack w="980px" minW="380px" maxW="980px" spacing={2}>
                <WorkTimelineCard
                  workHistoryItem={workHistoryItem}
                  onChatClick={onChatClick}
                />
                <HStack spacing={2}>
                  <IconButton
                    aria-label="Delete this entry"
                    title="Delete this entry"
                    icon={<GoTrash />}
                    onClick={alertOnOpen}
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
          <AlertDialog
            isOpen={alertIsOpen}
            leastDestructiveRef={cancelRef}
            onClose={alertOnClose}
          >
            <AlertDialogOverlay>
              <AlertDialogContent>
                <AlertDialogHeader fontSize="lg" fontWeight="bold">
                  Delete entry{" "}
                  <Text as="i" color="tomato">
                    {workHistoryItem.jobTitle}
                  </Text>{" "}
                  at{" "}
                  <Text as="i" color="tomato">
                    {workHistoryItem.company}
                  </Text>
                </AlertDialogHeader>
                <AlertDialogBody>
                  Deletion cannot be undone. Press Delete to confirm.
                </AlertDialogBody>
                <AlertDialogFooter>
                  <Button ref={cancelRef} onClick={alertOnClose}>
                    Cancel
                  </Button>
                  <Button colorScheme="red" onClick={handleDelete} ml={3}>
                    Delete
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialogOverlay>
          </AlertDialog>
        </Flex>
      </Box>
    </SlideFade>
  );
};

export default WorkTimelineItem;
