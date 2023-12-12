import "dotenv/config";
import OpenAI from "openai";
import { loadEnv, Env } from "./setup";
import { get_score } from "./functions";
import { RunSubmitToolOutputsParams } from "openai/resources/beta/threads/runs/runs.mjs";

const main = async (env: Env) => {
  const openai = new OpenAI({
    apiKey: env.OPENAI_API_KEY,
  });

  const thread = await openai.beta.threads.create({
    messages: [
      {
        role: "user",
        content: `My address is ${env.USER_ADDRESS}.`,
      },
      {
        role: "user",
        content: `What is my score?`,
      },
    ],
  });

  let run = await openai.beta.threads.runs.create(thread.id, { assistant_id: env.OPENAI_ASSISTANT_ID });

  while (run.status !== "completed") {
    await new Promise((resolve) => setTimeout(resolve, 5000));
    console.log("debug - status:", run.status);
    if (run.status === "requires_action" && run.required_action?.submit_tool_outputs?.tool_calls) {
      const tool_outputs: Array<RunSubmitToolOutputsParams.ToolOutput> = await Promise.all(
        run.required_action.submit_tool_outputs.tool_calls.map(async (toolCall) => {
          console.log("debug - toolCall:", JSON.stringify(toolCall.function));
          let output = "null";

          if (toolCall.function.name === "get_score") {
            const response = await get_score(JSON.parse(toolCall.function.arguments).address);
            console.log("debug - response:", response);
            output = JSON.stringify(response);
          }

          return {
            tool_call_id: toolCall.id,
            output,
          };
        })
      );

      console.log("debug - tool_outputs:", tool_outputs);

      run = await openai.beta.threads.runs.submitToolOutputs(thread.id, run.id, {
        tool_outputs,
      });
    } else {
      run = await openai.beta.threads.runs.retrieve(thread.id, run.id);
    }
  }

  const messageList = await openai.beta.threads.messages.list(thread.id);

  messageList.data.forEach((message) => {
    if (message.role === "assistant") {
      message.content.forEach((content) => {
        if (content.type === "text") {
          console.log("assistant:", content.text.value);
        }
      });
    }
  });
};

const { env } = loadEnv(["OPENAI_API_KEY", "PASSPORT_SCORER_API_KEY", "OPENAI_ASSISTANT_ID", "USER_ADDRESS"]);

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
