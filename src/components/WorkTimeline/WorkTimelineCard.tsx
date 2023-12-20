import {
  Badge,
  Box,
  Card,
  CardBody,
  CardHeader,
  HStack,
  Heading,
  Icon,
  IconButton,
  Text,
  VStack,
} from "@chakra-ui/react";
import { FaBuilding, FaCommentDots, FaIdBadge } from "react-icons/fa6";

import WorkHistoryFormValues from "../WorkHistory/types";
import "./styles.css";

interface Props {
  workHistoryItem: WorkHistoryFormValues;
  onChatClick?: (
    workHistory: WorkHistoryFormValues,
    metadataFilter?: Record<string, unknown>
  ) => void;
}

const WorkTimelineCard = ({ workHistoryItem, onChatClick }: Props) => {
  const hasAccomplishments = workHistoryItem.accomplishments.length > 0;
  const metadataFilter = {
    company: workHistoryItem.company,
    jobTitle: workHistoryItem.jobTitle,
    startDate: workHistoryItem.startDate,
    endDate: workHistoryItem.endDate,
  };
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
                {onChatClick && (
                  <IconButton
                    aria-label="Chat about this job"
                    title="Chat about this job"
                    rounded="full"
                    bgColor="transparent"
                    icon={<FaCommentDots />}
                    onClick={() => onChatClick(workHistoryItem, metadataFilter)}
                  />
                )}
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

export default WorkTimelineCard;
