import {
  ChatPromptTemplate,
  FewShotChatMessagePromptTemplate,
  PromptTemplate,
} from "langchain/prompts";

export const slowChainPrompt = ChatPromptTemplate.fromTemplate(
  `The context provided below is from your accomplishments; use it to answer the question at the end. If you don't know the answer, just say that you don't know, don't try to make up an answer.
    ----------
    CONTEXT: {context}
    ----------
    CHAT HISTORY: {chatHistory}
    ----------
    QUESTION: {question}
    ----------
    Helpful Answer:`
);
export const fastChainPrompt = ChatPromptTemplate.fromTemplate(
  `Given the following conversation and a follow up question, rephrase the follow up question to be a standalone question. If the context is inadequate, simply return the original question.
    ----------
    CHAT HISTORY: {chatHistory}
    ----------
    FOLLOWUP QUESTION: {question}
    ----------
    Standalone question:`
);
export const refineChainPrompt = ChatPromptTemplate.fromTemplate(
  `Given a previously generated AI response and human context, refine the response to be more contextually accurate, gramatically correct, and professional. Emphasize readability by breaking a large paragraph into smaller paragraphs wherever appropriate. Avoid flowery language.
    ----------
    CONTEXT: {context}
    ----------
    RESPONSE: {response}
    ----------
    Refined answer:`
);

export const questionClassificationExamples = [
  {
    input: "Tell me about your role in this company",
    output: "general",
  },
  {
    input: "Tell me about the database migration project your were involved in",
    output: "specific",
  },
  {
    input: "What did you do in this role?",
    output: "general",
  },
  {
    input: "Tell me about a time you had to lead a team",
    output: "general",
  },
  {
    input: "What challenges did you face when you implemented this feature?",
    output: "specific",
  },
  {
    input: "What experience do you have with project management?",
    output: "general",
  },
  {
    input: "What are your top skills?",
    output: "general",
  },
];

export const questionClassificationPrompt =
  new FewShotChatMessagePromptTemplate({
    prefix: `Classify the user's query into "general" or "specific". The broader the scope of the \
    user's query, the more "general" it is; likewise, the more targetted the search terms, the \
    more "specific" it is.`,
    suffix: "Human: {input}",
    examplePrompt: ChatPromptTemplate.fromTemplate(`{output}`),
    examples: questionClassificationExamples,
    inputVariables: ["input"],
  });
