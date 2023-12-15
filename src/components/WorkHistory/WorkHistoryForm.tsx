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
import { useEffect, useState } from "react";
import { useFieldArray, useForm } from "react-hook-form";
import WorkAccomplishmentsList from "./WorkAccomplishmentsList";
import { placeholders } from "./constants";
import WorkHistoryFormValues, { WorkAccomplishment } from "./types";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (values: WorkHistoryFormValues, replaceIndex?: number) => void;
  workHistory?: WorkHistoryFormValues;
  replaceIndex?: number;
}

const WorkHistoryForm = ({
  isOpen,
  onClose,
  onSubmit,
  workHistory,
  replaceIndex,
}: Props) => {
  const [isCurrentJob, setCurrentJob] = useState(false);
  const [currentEndDate, setEndDate] = useState<string>("");

  const {
    handleSubmit,
    register,
    reset,
    control,
    getValues,
    setValue,
    formState: { isSubmitting },
  } = useForm<WorkHistoryFormValues>();
  const { replace: replaceAccomplishment, remove: removeAccomplishments } =
    useFieldArray({
      control,
      name: "accomplishments",
    });

  useEffect(() => {
    if (!workHistory) return;

    const existingHistory = {
      ...workHistory,
      description: workHistory.description
        .map((x) => "• " + x.trim())
        .join("\n"),
    };
    Object.entries(existingHistory).map(([key, value]) =>
      setValue(key as keyof WorkHistoryFormValues, value)
    );
    if (workHistory.endDate.length === 0) {
      setCurrentJob(true);
      setEndDate("");
    } else {
      setCurrentJob(false);
      setEndDate(workHistory.endDate);
    }
  }, [workHistory]);

  const handleReset = () => {
    reset();
    removeAccomplishments();
    setCurrentJob(false);
    setEndDate("");
  };

  const handleReplaceAccomplishments = (entries: WorkAccomplishment[]) => {
    replaceAccomplishment(entries);
  };

  const handleClose = () => {
    if (replaceIndex !== undefined) {
      handleReset();
    }
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
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
                onSubmit(_data, replaceIndex);
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
                <Textarea
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
                    mb={2}
                    onChange={(event) => setEndDate(event.target.value)}
                    value={currentEndDate}
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
                <FormLabel>Responsibilities</FormLabel>
                <Textarea
                  id="description"
                  {...register("description", { required: true })}
                  mb={2}
                  placeholder={placeholders.workResponsibilities}
                  height="200px"
                />
              </FormControl>
              <FormControl mb={4}>
                <FormLabel>Personal Note</FormLabel>
                <Textarea
                  id="personalNote"
                  {...register("personalNote", { required: false })}
                  mb={4}
                  placeholder={placeholders.personalNote}
                  minH="160px"
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
                  {replaceIndex !== undefined ? (
                    <Button
                      colorScheme="orange"
                      isLoading={isSubmitting}
                      type="submit"
                    >
                      Replace Existing Entry
                    </Button>
                  ) : (
                    <Button
                      colorScheme="green"
                      isLoading={isSubmitting}
                      type="submit"
                    >
                      Submit New Entry
                    </Button>
                  )}
                  <HStack spacing="14px">
                    {replaceIndex !== undefined ? (
                      <Button colorScheme="red" onClick={handleClose}>
                        Discard Changes
                      </Button>
                    ) : (
                      <>
                        <Button colorScheme="red" onClick={handleReset}>
                          Reset
                        </Button>
                        <Button colorScheme="gray" onClick={handleClose}>
                          Close
                        </Button>
                      </>
                    )}
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
