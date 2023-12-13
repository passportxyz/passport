import "dotenv/config";
import fs from "fs";
import OpenAI from "openai";
import { loadEnv } from "./utils";

const { env } = loadEnv(["OPENAI_API_KEY"]);

const main = async () => {
  const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });

  let docsFile;
  if (env.OPENAI_FILE_ID) {
    console.log("Retrieving existing file", env.OPENAI_FILE_ID);
    docsFile = await openai.files.retrieve(env.OPENAI_FILE_ID);
  } else {
    docsFile = await openai.files.create({ file: fs.createReadStream("docs.txt"), purpose: "assistants" });
  }

  let processAssistant;
  if (env.OPENAI_ASSISTANT_ID) {
    console.log("Updating existing assistant", env.OPENAI_ASSISTANT_ID);
    processAssistant = (options: any) => openai.beta.assistants.update(env.OPENAI_ASSISTANT_ID, options);
  } else {
    processAssistant = (options: any) => openai.beta.assistants.create(options);
  }

  const instructions = await fs.promises.readFile("instructions.txt", "utf8");

  const assistant = await processAssistant({
    name: "Gitcoin Passport Assistant",
    instructions,
    tools: [
      { type: "code_interpreter" },
      { type: "retrieval" },
      {
        type: "function",
        function: {
          name: "get_score",
          description: "Returns Gitcoin's Passport score for an address",
          parameters: {
            type: "object",
            properties: {
              address: {
                type: "string",
                description: "The address for which to get the score, e.g. 0x1234...5678",
              },
            },
            required: ["address"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "get_stamps",
          description: "Returns the Stamps for an address",
          parameters: {
            type: "object",
            properties: {
              address: {
                type: "string",
                description: "The address for which to get stamps",
              },
            },
            required: ["address"],
          },
        },
      },
      {
        type: "function",
        function: {
          name: "flag_user",
          description:
            "Call this function to flag users who repeatedly submit off-topic queries or otherwise abuse the system",
          parameters: {
            type: "object",
            properties: {
              address: {
                type: "string",
                description: "The address of the user",
              },
            },
            required: ["address"],
          },
        },
      },
    ],
    model: "gpt-3.5-turbo-1106",
    file_ids: [docsFile.id],
  });

  return "Assistant created: " + assistant.id;
};

main()
  .then(console.log)
  .catch((error: any) => {
    if (error instanceof OpenAI.APIError) {
      console.error("OpenAI API Error:", error.name);
      console.error("Status:", error.status);
      console.error(error.message);
      console.error(error.headers);
    } else {
      console.error(error);
    }
  });
