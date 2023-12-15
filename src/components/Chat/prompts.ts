// client: Aaron Genovia
// query: {query}
// supporting_documents: {documents}
import {
  ChatPromptTemplate,
  HumanMessagePromptTemplate,
  PromptTemplate,
  SystemMessagePromptTemplate,
} from "langchain/prompts";

interface Query {
  query: string;
  documents: Document[];
}

const promptTexts = {
  constitution: `You are a helpful AI assistant for {client}. \
    You will answer questions regarding their resume and \
    provide context, summaries and answer any other questions \
    as necessary. You will not lie, if you do not know, then \
    simply say so.`,
  classification: `Classify the user's query into the following \
  request types: summary, context, general question, or other.`,
  // TODO(agenovia): implement an 'other' chain that requests for more information from the user
  summary: `Provide a summary in line with the user's \
  query using the supporting documents below:\n\
  ----------\n\
  {documents} 
  `,
  context: `Provide context for the user's query using \
  the supporting documents below: \n\
  ----------\n\
  {documents}
  `,
  question: `Provide an answer to the user's query using the \
  supporting documents below. Do not lie. If there is \
  insufficient information, simply say so.\n\
  ----------\n\
  {documents}
  `,
  user: `{query}`,
};

export const promptTemplates = {
  constitution: new PromptTemplate({
    inputVariables: ["client"],
    template: promptTexts.constitution,
  }),
  classification: new PromptTemplate({
    inputVariables: [],
    template: promptTexts.classification,
  }),
  summary: new PromptTemplate({
    inputVariables: ["documents"],
    template: promptTexts.summary,
  }),
  context: new PromptTemplate({
    inputVariables: ["documents"],
    template: promptTexts.context,
  }),
  question: new PromptTemplate({
    inputVariables: ["documents"],
    template: promptTexts.question,
  }),
  user: new PromptTemplate({
    inputVariables: ["query"],
    template: promptTexts.user,
  }),
};

export const systemMessagePromptTemplates = {
  constitution: new SystemMessagePromptTemplate(promptTemplates.constitution),
  classification: new SystemMessagePromptTemplate(
    promptTemplates.classification
  ),
  summary: new SystemMessagePromptTemplate(promptTemplates.summary),
  context: new SystemMessagePromptTemplate(promptTemplates.context),
  question: new SystemMessagePromptTemplate(promptTemplates.question),
};

export const humanMessagePromptTemplates = {
  user: new HumanMessagePromptTemplate(promptTemplates.user),
};

const chatPromptTemplates = {
  constitution: ChatPromptTemplate.fromMessages<{ client: string }>([
    systemMessagePromptTemplates.constitution,
  ]),
  classification: ChatPromptTemplate.fromMessages<Query>([
    systemMessagePromptTemplates.classification,
    humanMessagePromptTemplates.user,
  ]),
  summary: ChatPromptTemplate.fromMessages<Query>([
    systemMessagePromptTemplates.summary,
    humanMessagePromptTemplates.user,
  ]),
  context: ChatPromptTemplate.fromMessages<Query>([
    systemMessagePromptTemplates.context,
    humanMessagePromptTemplates.user,
  ]),
  question: ChatPromptTemplate.fromMessages<Query>([
    systemMessagePromptTemplates.question,
    humanMessagePromptTemplates.user,
  ]),
};

export default chatPromptTemplates;
