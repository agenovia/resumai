import { AttributeInfo } from "langchain/schema/query_constructor";

export const jobDescriptionAttributes: AttributeInfo[] = [
  {
    name: "company",
    description: "The client's past or current employer, company or workplace",
    type: "string",
  },
  {
    name: "jobTitle",
    description: "The client's job title",
    type: "string",
  },
  {
    name: "startDate",
    description: "The year the client started work at the company",
    type: "string",
  },
  {
    name: "endDate",
    description:
      "The year the client ended work at the company. If empty, then the client is still employed",
    type: "string",
  },
];

export const accomplishmentAttributes: AttributeInfo[] = [
  ...jobDescriptionAttributes,
  {
    name: "headline",
    description: "The title of the accomplishment",
    type: "string",
  },

  // {
  //   name: "skills",
  //   description: "The skills used to accomplish the task",
  //   type: "array of strings",
  // },
  {
    name: "section",
    description: "Whether it's an accomplishment or a description of a job",
    type: "string",
  },
];
/*
                company: v.company,
                jobTitle: v.jobTitle,
                startDate: v.startDate,
                endDate: v.endDate,
                headline: a.headline,
                skills: a.skills,
                section: "accomplishments",
*/
