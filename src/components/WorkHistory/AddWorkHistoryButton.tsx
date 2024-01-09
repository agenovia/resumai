import { IconButton } from "@chakra-ui/react";
import { MdOutlineAdd } from "react-icons/md";

interface Props {
  onAddWorkHistory: () => void;
}

const AddWorkHistoryButton = ({ onAddWorkHistory }: Props) => {
  return (
    <IconButton
      aria-label="Add Work History"
      title="Add Work History"
      icon={<MdOutlineAdd />}
      onClick={onAddWorkHistory}
      p={6}
      bgColor="palegreen"
      color="black"
      shadow="lg"
      rounded="full"
    />
  );
};

export default AddWorkHistoryButton;
