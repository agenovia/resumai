import {
  Badge,
  Box,
  Card,
  CardBody,
  CardHeader,
  Flex,
  HStack,
  Heading,
  Icon,
  IconButton,
  SlideFade,
  Text,
  VStack,
} from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { FaBuilding, FaCommentDots, FaIdBadge } from "react-icons/fa6";
import { GoDot, GoDotFill, GoTrash } from "react-icons/go";

import WorkHistoryFormValues from "../WorkHistory/types";
import "./styles.css";

interface WorkTimelineItemProps extends WorkTimelineCardProps {
  workHistoryItem: WorkHistoryFormValues;
  expanded: boolean;
  delayMultiplier: number;
  onDelete: (entry: WorkHistoryFormValues) => void;
}

interface WorkTimelineCardProps {
  workHistoryItem: WorkHistoryFormValues;
  onChatClick: (workHistory: WorkHistoryFormValues[]) => void;
}

const WorkTimelineCard = ({
  workHistoryItem,
  onChatClick,
}: WorkTimelineCardProps) => {
  const hasAccomplishments = workHistoryItem.accomplishments.length > 0;
  return (
    <Box className="main-card" overflow="hidden">
      <Card>
        <VStack>
          <CardHeader>
            <VStack spacing={2}>
              <HStack spacing={2}>
                <Badge
                  fontSize="xs"
                  variant="outline"
                  bgColor="papayawhip"
                  rounded="full"
                  p={3}
                >
                  <HStack>
                    <Icon as={FaBuilding} />
                    <Text>{workHistoryItem.company}</Text>
                  </HStack>
                </Badge>
                <Badge
                  fontSize="xs"
                  variant="solid"
                  bgColor="tomato"
                  rounded="full"
                  p={3}
                >
                  <HStack>
                    <Icon as={FaIdBadge} />
                    <Text>{workHistoryItem.jobTitle}</Text>
                  </HStack>
                </Badge>

                <IconButton
                  aria-label="Chat about this job"
                  title="Chat about this job"
                  rounded="full"
                  bgColor="transparent"
                  icon={<FaCommentDots />}
                  onClick={() => onChatClick([workHistoryItem])}
                />
              </HStack>
            </VStack>
          </CardHeader>
          <CardBody textAlign="left" flexDirection="row" w="100%">
            <Heading className="headings" size="sm">
              <Text>Responsibilities</Text>
            </Heading>
            <VStack className="vertical-stack" spacing={2} align="left">
              {workHistoryItem.description.map((v, idx) => (
                <Text key={idx}>• {v.trim()}</Text>
              ))}
            </VStack>
            {hasAccomplishments && (
              <>
                <Heading className="headings" size="sm">
                  <Text>Accomplishments</Text>
                </Heading>
                <VStack className="vertical-stack" spacing={2} align="left">
                  {workHistoryItem.accomplishments.map((v, idx) => (
                    <Box key={idx} outlineColor="black" outline={2}>
                      <Text>• {v.headline.trim()}</Text>
                    </Box>
                  ))}
                </VStack>
              </>
            )}
          </CardBody>
        </VStack>
      </Card>
    </Box>
  );
};

const WorkTimelineItem = ({
  expanded,
  delayMultiplier,
  workHistoryItem,
  onChatClick,
  onDelete,
}: WorkTimelineItemProps) => {
  const [isExpanded, setExpanded] = useState(expanded);
  const isCurrent = workHistoryItem.endDate.length === 0;

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
                <IconButton
                  aria-label="Delete this item"
                  title="Delete this item"
                  icon={<GoTrash />}
                  onClick={() => onDelete(workHistoryItem)}
                />
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
