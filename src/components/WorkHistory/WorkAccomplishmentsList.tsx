import {
  Box,
  Button,
  Card,
  CardBody,
  Center,
  Divider,
  Flex,
  FormControl,
  FormHelperText,
  FormLabel,
  HStack,
  Heading,
  Icon,
  IconButton,
  Input,
  Popover,
  PopoverArrow,
  PopoverContent,
  PopoverTrigger,
  Stack,
  StackDivider,
  Tag,
  TagCloseButton,
  Text,
  Textarea,
  VStack,
} from "@chakra-ui/react";
import { useState } from "react";
import { BsFileText, BsPencil, BsPlusCircle } from "react-icons/bs";
import { limits, placeholders } from "./constants";

import { WorkAccomplishment } from "./types";

import "./styles.css";

interface WorkAccomplishmentListProps {
  accomplishments: WorkAccomplishment[];
  onChangeAccomplishments: (entries: WorkAccomplishment[]) => void;
}

interface WorkAccomplishmentTagProps {
  entry: WorkAccomplishment;
  onDelete: () => void;
  onEdit: () => void;
}

const WorkAccomplishmentCard = (entry: WorkAccomplishment) => {
  return (
    <Card>
      <CardBody>
        <Stack divider={<StackDivider />} spacing="4">
          <Box>
            <Heading
              size="xs"
              textTransform="uppercase"
              className="card-heading"
              color="blue"
            >
              Headline
            </Heading>
            <Text ml={2}>{entry.headline}</Text>
          </Box>
          <Box>
            <Heading
              size="xs"
              textTransform="uppercase"
              className="card-heading"
            >
              Context
            </Heading>
            <Text ml={2}>{entry.context}</Text>
          </Box>
          <Box>
            <Heading
              size="xs"
              textTransform="uppercase"
              className="card-heading"
            >
              Skills
            </Heading>
            <Text ml={2}>{entry.skills}</Text>
          </Box>
        </Stack>
      </CardBody>
    </Card>
  );
};

const WorkAccomplishmentTag = ({
  entry,
  onDelete,
  onEdit,
}: WorkAccomplishmentTagProps) => {
  return (
    <Flex w="100%">
      <Popover placement="right">
        <Tag>
          <Text noOfLines={1}>{entry.headline}</Text>
          <PopoverTrigger>
            <Button className="view-button" size="xs" bgColor="teal.300">
              <BsFileText
                aria-label="View Accomplishment"
                title="View Accomplishment"
              />
            </Button>
          </PopoverTrigger>
          <IconButton
            className="edit-button"
            aria-label="Edit Accomplishment"
            title="Edit Accomplishment"
            icon={<BsPencil />}
            size="xs"
            onClick={onEdit}
            bgColor="orange.300"
          />
          <TagCloseButton onClick={onDelete} />
        </Tag>
        <PopoverContent mb={2}>
          <PopoverArrow />
          <Box overflowY="scroll" maxH="500px" borderRadius={10} shadow="lg">
            <WorkAccomplishmentCard {...entry} />
          </Box>
        </PopoverContent>
      </Popover>
    </Flex>
  );
};

const WorkAccomplishmentsList = ({
  accomplishments,
  onChangeAccomplishments,
}: WorkAccomplishmentListProps) => {
  const [headline, setHeadline] = useState<string>("");
  const [context, setContext] = useState<string>("");
  const [skills, setSkills] = useState<string>("");
  const isInvalidHeadline = headline.length > limits.accomplishmentFormHeadline;
  const isInvalidContext = context.length > limits.accomplishmentFormContext;
  const isInvalidSkills = skills.length > limits.accomplishmentFormSkills;

  const handleChangeAccomplishments = (
    mode: "add" | "delete",
    entry?: WorkAccomplishment
  ) => {
    if (mode === "add") {
      const newEntry = { headline, context, skills };
      var newAccomplishments = [...accomplishments, newEntry];
    } else if (mode === "delete" && entry) {
      var newAccomplishments = accomplishments.filter((e) => e !== entry);
    } else {
      return;
    }

    onChangeAccomplishments(newAccomplishments);
    setHeadline("");
    setContext("");
    setSkills("");
  };

  const handleEditAccomplishments = (entry: WorkAccomplishment) => {
    handleChangeAccomplishments("delete", entry);
    setHeadline(entry.headline);
    setContext(entry.context);
    setSkills(entry.skills);
  };

  return (
    <Flex className="work-accomplishment-container">
      <FormControl>
        <VStack>
          <HStack w="100%">
            <VStack w="100%">
              <FormControl isInvalid={isInvalidHeadline}>
                <FormLabel className="form-label-accomplishments">
                  Headline
                </FormLabel>
                <Input
                  placeholder={placeholders.accomplishmentHeadline}
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                />
                {isInvalidHeadline && (
                  <FormHelperText>
                    {limits.accomplishmentFormHeadline} character limit reached.
                    To add more context for this accomplishment, use the field
                    below.
                  </FormHelperText>
                )}
              </FormControl>
              <FormControl isInvalid={isInvalidContext}>
                <FormLabel className="form-label-accomplishments">
                  Context
                </FormLabel>
                <Textarea
                  placeholder={placeholders.accomplishmentContext}
                  value={context}
                  onChange={(e) => setContext(e.target.value)}
                  minH="90px"
                ></Textarea>
                {isInvalidContext && (
                  <FormHelperText>
                    {limits.accomplishmentFormContext} character limit reached.
                  </FormHelperText>
                )}
              </FormControl>
              <FormControl isInvalid={isInvalidSkills}>
                <FormLabel className="form-label-accomplishments">
                  Skills
                </FormLabel>
                <Textarea
                  placeholder={placeholders.accomplishmentSkills}
                  value={skills}
                  onChange={(e) => setSkills(e.target.value)}
                  minH="120px"
                ></Textarea>
                {isInvalidSkills && (
                  <FormHelperText>
                    {limits.accomplishmentFormSkills} character limit reached.
                  </FormHelperText>
                )}
              </FormControl>
            </VStack>
            <Center>
              <IconButton
                className="add-button-accomplishments"
                aria-label="Add This Accomplishment"
                title="Add This Accomplishment"
                isDisabled={
                  !headline ||
                  isInvalidHeadline ||
                  isInvalidContext ||
                  isInvalidSkills
                }
                icon={<Icon as={BsPlusCircle} boxSize="30px" />}
                onClick={() => handleChangeAccomplishments("add")}
                bgColor="green.200"
                h="330px"
              />
            </Center>
          </HStack>
          <Divider p={1} />
          {accomplishments.map((e, idx) => (
            <WorkAccomplishmentTag
              entry={e}
              key={idx}
              onDelete={() => handleChangeAccomplishments("delete", e)}
              onEdit={() => handleEditAccomplishments(e)}
            />
          ))}
        </VStack>
      </FormControl>
    </Flex>
  );
};

export default WorkAccomplishmentsList;
