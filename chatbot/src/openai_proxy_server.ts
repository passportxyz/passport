import "dotenv/config";
import OpenAI from "openai";
import { Run, RunSubmitToolOutputsParams } from "openai/resources/beta/threads/runs/runs.mjs";
import { loadEnv } from "./utils";
import { runFunction } from "./functions";
import cors from "cors";
import express from "express";

const { env } = loadEnv(["OPENAI_API_KEY", "OPENAI_ASSISTANT_ID"]);

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

const app = express();
app.use(express.json());

app.use(cors());

app.post("/thread", async (req, res) => {
  try {
    const { messages } = req.body;
    const thread = await openai.beta.threads.create({
      messages,
    });

    let run = await openai.beta.threads.runs.create(thread.id, { assistant_id: env.OPENAI_ASSISTANT_ID });

    res.send({ threadId: thread.id, runId: run.id });
  } catch (error) {
    handleError(error, res);
  }
});

app.patch("/thread/:threadId", async (req, res) => {
  try {
    const { threadId } = req.params;
    const { message } = req.body;

    await openai.beta.threads.messages.create(threadId, message);
    let run = await openai.beta.threads.runs.create(threadId, { assistant_id: env.OPENAI_ASSISTANT_ID });

    res.send({ runId: run.id });
  } catch (error) {
    handleError(error, res);
  }
});

app.get("/thread/:threadId/:runId", async (req, res) => {
  try {
    const { threadId, runId } = req.params;
    const run = await getRun(threadId, runId);

    const { status, last_error } = run;
    let messageList;

    if (status === "completed") {
      messageList = await openai.beta.threads.messages.list(threadId);
    }

    if (status === "failed") {
      console.error("run error:", last_error);
    }

    res.send({ status, messageList, last_error });
  } catch (error) {
    handleError(error, res);
  }
});

const runRequiredAction = async (run: Run) => {
  if (run.status === "requires_action" && run.required_action?.submit_tool_outputs?.tool_calls) {
    const tool_outputs: Array<RunSubmitToolOutputsParams.ToolOutput> = await Promise.all(
      run.required_action.submit_tool_outputs.tool_calls.map(async (toolCall) => {
        console.log("debug - toolCall:", JSON.stringify(toolCall.function));

        const output = await runFunction(toolCall.function.name, toolCall.function.arguments);
        console.log("debug - output:", output);

        return {
          tool_call_id: toolCall.id,
          output,
        };
      })
    );

    console.log("debug - tool_outputs:", tool_outputs);

    return await openai.beta.threads.runs.submitToolOutputs(run.thread_id, run.id, {
      tool_outputs,
    });
  }

  return run;
};

const getRun = async (threadId: string, runId: string) => {
  const run = await openai.beta.threads.runs.retrieve(threadId, runId);
  return await runRequiredAction(run);
};

const handleError = (error: any, res: express.Response) => {
  if (error instanceof OpenAI.APIError) {
    console.error("OpenAI API Error:", error.name);
    console.error("Status:", error.status);
    console.error(error.message);
    console.error(error.headers);
  } else {
    console.error("Unexpected Error:", error);
  }
  res.status(500).send(error.message);
};

app.listen(3030, () => {
  console.log("Server listening on port 3030");
});
