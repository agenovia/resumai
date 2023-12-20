type WorkHistoryFormValues = {
  company: string;
  jobTitle: string;
  personalNote: string;
  startDate: string;
  endDate: string;
  description: string[];
  accomplishments: WorkAccomplishment[];
};

export type WorkAccomplishment = {
  headline: string;
  context: string;
  skills: string[];
};

export default WorkHistoryFormValues;
