import "dotenv/config";
import fs from "fs";
import OpenAI from "openai";

const main = async (env: Env) => {
  const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });

  const docsFile = await openai.files.create({ file: fs.createReadStream("docs.txt"), purpose: "assistants" });

  const assistant = await openai.beta.assistants.create({
    name: "Gitcoin Passport Assistant",
    instructions: `As an expert in Gitcoin Passport, your role is to provide detailed
      information and insights about the Gitcoin Passport application, its purpose, and
      its use, particularly focusing on the various stamps it offers. Gitcoin Passport is
      a vital identity verification application and Sybil resistance protocol, designed to
      enhance the security and integrity of digital communities and projects. Your
      responses should be informed, precise, and helpful to users seeking to understand
      how Gitcoin Passport works, especially in regards to its verifiable credentials
      or Stamps. Restrict answers to one clear and concise sentence. Restrict answers
      to the knowledge in the attached documentation. The docs.txt file contains several
      documents, each beginning with the marker ==> FILE_NAME <==`.replace(/\s+/gm, " "),
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
    ],
    model: "gpt-3.5-turbo-1106",
    file_ids: [docsFile.id],
  });

  return "Assistant created: " + assistant.id;
};

type Env = {
  OPENAI_API_KEY?: string;
};

const setup = (envVars: (keyof Env)[]) => {
  const env = envVars.reduce((env, key) => {
    env[key] = process.env[key];
    if (!env[key]) {
      throw new Error(`${key} environment variable is required.`);
    }
    return env;
  }, {} as Env) as Env;

  return { env };
};

const { env } = setup(["OPENAI_API_KEY"]);

main(env)
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
