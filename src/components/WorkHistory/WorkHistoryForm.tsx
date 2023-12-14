import {
  Box,
  Button,
  Checkbox,
  FormControl,
  FormLabel,
  HStack,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  Textarea,
} from "@chakra-ui/react";
import { useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import WorkAccomplishmentsList from "./WorkAccomplishmentsList";
import { placeholders } from "./constants";
import WorkHistoryFormValues, { WorkAccomplishment } from "./types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: WorkHistoryFormValues) => void;
}

const WorkHistoryForm = ({ isOpen, onClose, onSubmit }: Props) => {
  const [isCurrentJob, setCurrentJob] = useState(false);
  const [endDate, setEndDate] = useState<string>("");

  const {
    handleSubmit,
    register,
    reset,
    control,
    getValues,
    formState: { isSubmitting },
  } = useForm<WorkHistoryFormValues>();
  const { replace: replaceAccomplishment, remove: removeAccomplishments } =
    useFieldArray({
      control,
      name: "accomplishments",
    });

  const handleReset = () => {
    reset();
    removeAccomplishments();
    setCurrentJob(false);
    setEndDate("");
  };

  const handleReplaceAccomplishments = (entries: WorkAccomplishment[]) => {
    replaceAccomplishment(entries);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      closeOnOverlayClick={false}
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent minW="85vw">
        <ModalHeader>
          <ModalCloseButton />
        </ModalHeader>
        <ModalBody>
          <Box p={4}>
            <form
              onSubmit={handleSubmit((data, event) => {
                event?.preventDefault();
                setCurrentJob(false);
                handleReset();
                const _data = {
                  ...data,
                  description: (data.description as unknown as string)
                    .split(/(?:(?:(?<!=\w)-(?!\w))|\n|•|○|⦿|⦾|‣|⁃)/)
                    .filter((x) => x.trim().length > 0),
                };
                onSubmit(_data);
              })}
            >
              <FormControl isRequired={true} mb={4}>
                <FormLabel>Company</FormLabel>
                <Input
                  id="company"
                  {...register("company", { required: true })}
                  mb={4}
                />
                <FormLabel>Job Title</FormLabel>
                <Input
                  id="jobTitle"
                  {...register("jobTitle", { required: true })}
                  mb={4}
                />
              </FormControl>
              <HStack mb={4}>
                <FormControl isRequired={true}>
                  <FormLabel>Start Date</FormLabel>
                  <Input
                    id="startDate"
                    {...register("startDate", { required: true })}
                    type="date"
                    mb={2}
                  />
                </FormControl>
                <FormControl isRequired={!isCurrentJob}>
                  <FormLabel>End Date</FormLabel>
                  <Input
                    id="endDate"
                    {...register("endDate", { required: !isCurrentJob })}
                    type="date"
                    isDisabled={isCurrentJob}
                    value={endDate}
                    onChange={(event) => setEndDate(event.target.value)}
                    mb={2}
                  />
                </FormControl>
                <FormControl>
                  <Checkbox
                    mt={5}
                    isChecked={isCurrentJob}
                    onChange={() => {
                      setCurrentJob(!isCurrentJob);
                      setEndDate("");
                    }}
                  >
                    <Text fontSize="14px">I currently work here</Text>
                  </Checkbox>
                </FormControl>
              </HStack>
              <FormControl isRequired={true} mb={4}>
                <FormLabel>Description</FormLabel>
                <Textarea
                  id="description"
                  {...register("description", { required: true })}
                  mb={2}
                  placeholder={placeholders.workDescription}
                  height="200px"
                />
              </FormControl>
              <FormControl mb={4}>
                <FormLabel>Accomplishments</FormLabel>
                <WorkAccomplishmentsList
                  accomplishments={getValues("accomplishments")}
                  onChangeAccomplishments={(entries: WorkAccomplishment[]) =>
                    handleReplaceAccomplishments(entries)
                  }
                />
              </FormControl>
              <FormControl mb={4}>
                <HStack justifyContent="space-between">
                  <Button
                    colorScheme="green"
                    isLoading={isSubmitting}
                    type="submit"
                  >
                    Submit
                  </Button>
                  <HStack spacing="14px">
                    <Button colorScheme="red" onClick={handleReset}>
                      Reset
                    </Button>
                    <Button colorScheme="gray" onClick={onClose}>
                      Close
                    </Button>
                  </HStack>
                </HStack>
              </FormControl>
            </form>
          </Box>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default WorkHistoryForm;
