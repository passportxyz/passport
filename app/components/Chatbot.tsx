import React from "react";
import axios from "axios";
import { Disclosure } from "@headlessui/react";
import { CONTENT_MAX_WIDTH, CONTENT_MAX_WIDTH_INCLUDING_PADDING, PAGE_PADDING } from "./PageWidthGrid";

const PROXY_URL = "http://localhost:3030";

type OpenAIMessageRole = "assistant" | "user";

type MessageRole = OpenAIMessageRole | "system";

type Message = {
  role: MessageRole;
  text: string;
  id: string;
};

type Run = {
  id: string;
  status: "completed" | "in_progress" | "failed";
  messageList: {
    data: {
      id: string;
      role: OpenAIMessageRole;
      content: {
        type: "text";
        text: {
          value: string;
        };
      }[];
    }[];
  };
};

const roleToName = (role: MessageRole) => {
  switch (role) {
    case "assistant":
      return "PassportGPT";
    case "user":
      return "Me";
    case "system":
      return "System";
  }
};

const FINISHED_STATUSES = ["completed", "failed", "cancelled", "expired"];

const ENABLED = false;

const getRun = async (threadId: string, runId: string) => {
  return (await axios.get(`${PROXY_URL}/thread/${threadId}/${runId}`)).data as Run;
};

const useMessageHistory = (initialMessages: Message[]) => {
  const [messages, setMessages] = React.useState<Message[]>(initialMessages);
  const [userMessageIndex, setUserMessageIndex] = React.useState<number>(0);
  const [systemMessageIndex, setSystemMessageIndex] = React.useState<number>(0);

  const addNewAssistantMessagesFromRun = (run: Run) => {
    if (run.status !== "completed") {
      return;
    }
    const newAssistantMessages = run.messageList.data
      .filter(
        (message) =>
          message.role === "assistant" && !messages.find((m) => m.role === "assistant" && m.id === message.id)
      )
      .reverse()
      .map((message) =>
        message.content.map((content) => ({
          id: message.id,
          role: message.role,
          text: content.text.value,
        }))
      )
      .flat();
    setMessages((messages) => [...messages, ...newAssistantMessages]);
  };

  const addUserMessage = (message: string) => {
    setMessages((messages) => [...messages, { role: "user", text: message, id: `user-${userMessageIndex}` }]);
    setUserMessageIndex((userMessageIndex) => userMessageIndex + 1);
  };

  const addSystemMessage = (message: string) => {
    setMessages((messages) => [...messages, { role: "system", text: message, id: `system-${systemMessageIndex}` }]);
    setSystemMessageIndex((systemMessageIndex) => systemMessageIndex + 1);
  };

  return { messages, addNewAssistantMessagesFromRun, addUserMessage, addSystemMessage };
};

const useChatbot = ({ address }: { address: string }) => {
  const [loading, setLoading] = React.useState(false);
  const [threadId, setThreadId] = React.useState<string>();
  const [currentRunStatus, setCurrentRunStatus] = React.useState<"completed" | "in_progress" | "failed">("completed");

  const messageHistory = useMessageHistory([
    {
      id: "placeholder",
      role: "assistant",
      text: `Welcome to Gitcoin Passport! Claim your Stamps above to prove your humanity.
      Let me know if you have any questions about using or integrating with Gitcoin
      Passport!`.replace(/\s+/gm, " "),
    },
  ]);

  const onSubmit = async (message: string) => {
    if (loading) {
      return;
    }
    try {
      setLoading(true);
      messageHistory.addUserMessage(message);

      if (!ENABLED) {
        messageHistory.addSystemMessage("Sorry, I'm not enabled right now.");
        return;
      }

      const submitResult = await submitMessage(message);
      setThreadId(submitResult.threadId);

      let run = await getRun(submitResult.threadId, submitResult.runId);
      setCurrentRunStatus(run.status);
      while (!FINISHED_STATUSES.includes(run.status)) {
        console.log(run);
        await new Promise((resolve) => setTimeout(resolve, 3000));
        run = await getRun(submitResult.threadId, submitResult.runId);
      }

      messageHistory.addNewAssistantMessagesFromRun(run);

      setCurrentRunStatus(run.status);
    } catch (e) {
      handleError(e);
    } finally {
      setLoading(false);
    }
  };

  const handleError = (e: any) => {
    console.error("chatbot submit error:", e);
    try {
      messageHistory.addSystemMessage("Sorry, I'm having trouble understanding you right now. Please try again later.");
    } catch (e2) {
      console.error("chatbot submit error while adding system message:", e2);
    }
  };

  const submitMessage = async (message: string) => {
    if (threadId) {
      const { runId } = (
        await axios.patch(`${PROXY_URL}/thread/${threadId}`, {
          message: {
            role: "user",
            content: message,
          },
        })
      ).data;
      return { threadId, runId };
    } else {
      const { threadId, runId } = (
        await axios.post(`${PROXY_URL}/thread`, {
          messages: [
            {
              role: "user",
              content: `My address is ${address}.`,
            },
            {
              role: "user",
              content: message,
            },
          ],
        })
      ).data;
      return { threadId, runId };
    }
  };

  return {
    messages: messageHistory.messages,
    onSubmit,
    loading,
    status: currentRunStatus,
  };
};

export const Chatbot = ({ address }: { address: string }) => {
  const { loading, messages, onSubmit, status } = useChatbot({ address });

  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <div
      className={`fixed bottom-0 left-0 flex h-fit w-full items-end justify-center bg-gradient-to-b from-transparent to-background ${PAGE_PADDING} transition-all ${
        isOpen ? "pt-96" : "pt-24"
      }`}
    >
      <div
        className={`mb-10 mt-8 flex w-full flex-col rounded border border-foreground-2 bg-background p-4 md:p-8 ${CONTENT_MAX_WIDTH}`}
      >
        <button onClick={() => setIsOpen((isOpen) => !isOpen)} className="self-end">
          <div className="p-2">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
              strokeWidth={1.5}
              stroke="currentColor"
              className={`h-6 w-6 ${isOpen ? "rotate-180" : ""}`}
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l7.5-7.5 7.5 7.5m-15 6l7.5-7.5 7.5 7.5" />
            </svg>
          </div>
        </button>
        <div className="flex flex-col-reverse overflow-y-auto">
          <div className={`transition-all ${isOpen ? "h-[75vh] md:h-96 lg:h-80" : "h-0"}`}>
            <ul>
              {messages
                .map(({ text, role, id }) => (
                  <li className="my-3" key={id}>
                    <b>{roleToName(role)}</b>: {text}
                  </li>
                ))
                .flat()}

              {loading ? (
                <li className="bold animate-pulse">Loading...</li>
              ) : status !== "completed" ? (
                <li className="bold">Error: {status}</li>
              ) : null}
            </ul>
          </div>
        </div>
        <div className="grow" />

        <div>
          <input
            className="mt-4 w-full rounded-sm px-2 py-1 text-color-3"
            type="text"
            placeholder="Message"
            disabled={loading}
            onKeyDown={async (e) => {
              if (e.key === "Enter") {
                const message = e.currentTarget.value;
                e.currentTarget.value = "";
                setIsOpen(true);
                onSubmit(message);
              }
            }}
          />
        </div>
      </div>
    </div>
  );
};
