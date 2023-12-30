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
  Wrap,
  WrapItem,
} from "@chakra-ui/react";
import { FaBuilding, FaCommentDots, FaIdBadge } from "react-icons/fa6";

import { useEffect, useState } from "react";
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
  const [hasAccomplishments, setHasAccomplishments] = useState(false);
  const [hasSkills, setHasSkills] = useState(false);
  const [topSkills, setTopSkills] = useState<[string, number][]>([]);

  useEffect(() => {
    const _hasAccomplishments = workHistoryItem.accomplishments.length > 0;
    setHasAccomplishments(_hasAccomplishments);
    const skills = workHistoryItem.accomplishments
      ?.flatMap((v) => v.skills)
      .flatMap((v) => v)
      .map((v) => v.trim().toLowerCase())
      .filter((v) => v.length > 0);
    const _hasSkills = skills.length > 0;
    setHasSkills(_hasSkills);
    const _topSkills: { [key: string]: number } = {};
    skills.forEach((v) =>
      v in _topSkills
        ? (_topSkills[v] = _topSkills[v] + 1)
        : (_topSkills[v] = 1)
    );
    const _skillsArray: [string, number][] = [];
    Object.keys(_topSkills).forEach(function (key) {
      _skillsArray.push([key, _topSkills[key]]);
    });
    _skillsArray.sort((a, b) => b[1] - a[1]);
    setTopSkills(
      _skillsArray.slice(0, Math.max(Math.floor(_skillsArray.length / 3), 6))
    );
  }, []);

  return (
    <Box
      w="inherit"
      maxW="inherit"
      maxH="inherit"
      className="main-card"
      overflowY="scroll"
      overflowX="scroll"
    >
      <Card w="inherit">
        {/* <VStack> */}
        <CardHeader>
          <VStack spacing={2}>
            <HStack spacing={2}>
              <Wrap>
                <WrapItem>
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
                </WrapItem>
                <WrapItem>
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
                </WrapItem>
                {onChatClick && (
                  <WrapItem>
                    <IconButton
                      aria-label="Chat about this job"
                      title="Chat about this job"
                      rounded="full"
                      bgColor="transparent"
                      icon={<FaCommentDots />}
                      onClick={() => onChatClick(workHistoryItem)}
                    />
                  </WrapItem>
                )}
              </Wrap>
            </HStack>
          </VStack>
        </CardHeader>
        <CardBody textAlign="left" flexDirection="row">
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
          {hasSkills && (
            <>
              <Heading className="headings" size="sm">
                <Text>Top Skills</Text>
              </Heading>
              <HStack>
                <Box>
                  {topSkills.map((v, idx) => (
                    <Badge key={idx} rounded="full" p={3} m={1}>
                      {v[0]}
                    </Badge>
                  ))}
                </Box>
              </HStack>
            </>
          )}
        </CardBody>
        {/* </VStack> */}
      </Card>
    </Box>
  );
};

export default WorkTimelineCard;
