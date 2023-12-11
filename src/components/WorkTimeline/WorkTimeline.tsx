import { Grid, GridItem } from "@chakra-ui/react";
import WorkHistoryFormValues from "../WorkHistory/types";
import WorkTimelineItem from "./WorkTimelineItem";

interface Props {
  workHistory: WorkHistoryFormValues[];
}

const WorkTimeline = ({ workHistory }: Props) => {
  const sortedWorkHistory = workHistory.sort((a, b) => {
    if (Date.parse(a.startDate) === Date.parse(b.startDate)) {
      return 0;
    }
    return a.startDate > b.startDate ? -1 : 1;
  });
  return (
    <Grid h="100%" templateColumns="1fr" m={4} pl={10} pr={10}>
      <GridItem />
      <GridItem>
        {sortedWorkHistory.map((item, idx) => (
          <WorkTimelineItem
            expanded={false}
            key={idx}
            workHistoryItem={item}
            delayMultiplier={1 / (idx + 1)}
          />
        ))}
      </GridItem>
    </Grid>
  );
};

export default WorkTimeline;
