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
    name: "context",
    description: "The context of the accomplishment",
    type: "string",
  },
  //   {
  //     name: "headline",
  //     description: "The client's accomplishment",
  //     type: "string",
  //   },
  {
    name: "skills",
    description: "The skills used to accomplish the task",
    type: "array of strings",
  },
];
