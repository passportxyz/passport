import "dotenv/config";
import { loadEnv, Env } from "./utils";
import axios from "axios";

const { env } = loadEnv(["USER_ADDRESS"]);

const PROXY_URL = "http://localhost:3030";

const main = async (env: Env) => {
  const { threadId, runId } = (
    await axios.post(`${PROXY_URL}/thread`, {
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
    })
  ).data;

  let status, messageList;

  ({ status, messageList } = (await axios.get(`${PROXY_URL}/thread/${threadId}/${runId}`)).data);

  while (status !== "completed") {
    console.log("debug - ui status:", status);
    await new Promise((resolve) => setTimeout(resolve, 5000));
    ({ status, messageList } = (await axios.get(`${PROXY_URL}/thread/${threadId}/${runId}`)).data);
  }

  messageList.data.forEach((message: any) => {
    if (message.role === "assistant") {
      message.content.forEach((content: any) => {
        if (content.type === "text") {
          console.log("assistant:", content.text.value);
        }
      });
    }
  });

  return "Done";
};

main(env).then(console.log).catch(console.error);
