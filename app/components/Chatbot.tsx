import React, { useEffect, useRef, useState } from "react";
import axios from "axios";
import { CONTENT_MAX_WIDTH, PAGE_PADDING } from "./PageWidthGrid";
import { useWalletStore } from "../context/walletStore";
import { atom, useAtom } from "jotai";

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

const ENABLED = true;

const getRun = async (threadId: string, runId: string) => {
  return (await axios.get(`${PROXY_URL}/thread/${threadId}/${runId}`)).data as Run;
};

const messagesAtom = atom<Message[]>([]);

const useMessageHistory = (initialMessages: Message[]) => {
  const [messages, setMessages] = useAtom(messagesAtom);
  const [userMessageIndex, setUserMessageIndex] = useState<number>(0);
  const [systemMessageIndex, setSystemMessageIndex] = useState<number>(0);

  useEffect(() => {
    if (!messages.length) setMessages(initialMessages);
  });

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

const threadIdAtom = atom<string | undefined>(undefined);

const useChatbot = () => {
  const address = useWalletStore((state) => state.address);
  const [loading, setLoading] = useState(false);
  const [threadId, setThreadId] = useAtom(threadIdAtom);
  const [currentRunStatus, setCurrentRunStatus] = useState<"completed" | "in_progress" | "failed">("completed");
  const [sentAddress, setSentAddress] = useState(false);

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

      let submitResult;
      if (!threadId) {
        submitResult = await createThread(message);
        setThreadId(submitResult.threadId);
      } else {
        submitResult = await addMessageToThread(threadId, message);
      }

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

  const createThread = async (message: string) => {
    const messages = [];
    if (address) {
      messages.push({
        role: "user",
        content: `My address is ${address}.`,
      });
      setSentAddress(true);
    } else {
      setSentAddress(false);
    }

    messages.push({
      role: "user",
      content: message,
    });

    const { threadId, runId } = (
      await axios.post(`${PROXY_URL}/thread`, {
        messages,
      })
    ).data;

    return { threadId, runId };
  };

  const addMessageToThread = async (threadId: string, message: string) => {
    let content = message;

    if (!sentAddress && address) {
      content = `My address is ${address}. ${message}`;
      setSentAddress(true);
    }

    const { runId } = (
      await axios.patch(`${PROXY_URL}/thread/${threadId}`, {
        message: {
          role: "user",
          content,
        },
      })
    ).data;
    return { threadId, runId };
  };

  return {
    messages: messageHistory.messages,
    onSubmit,
    loading,
    status: currentRunStatus,
  };
};

const Logo = ({ variant }: { variant?: "small" | "standard" }) => {
  const [width, height, d] =
    variant === "small"
      ? [
          22,
          23,
          "M20.5535 9.41115C21.0591 7.84398 20.8824 6.12821 20.0751 4.70402C18.8573 2.52007 16.4136 1.39585 14.0269 1.92572C12.6814 0.38097 10.64 -0.303091 8.6692 0.125849C6.70116 0.55479 5.10281 2.03506 4.47761 4.00874C2.90916 4.33956 1.55546 5.35444 0.761718 6.78704C-0.466944 8.96819 -0.189681 11.7185 1.45216 13.5884C0.94656 15.1556 1.11781 16.8685 1.92786 18.2955C3.14565 20.4795 5.5921 21.6037 7.98147 21.0738C9.04431 22.3074 10.572 23.0111 12.1703 22.9999C14.6168 23.0027 16.786 21.3738 17.5335 18.9684C19.102 18.6348 20.4557 17.6227 21.2494 16.1901C22.4645 14.0145 22.1845 11.2783 20.5535 9.41115ZM12.1703 21.4944C11.1945 21.4972 10.2485 21.1439 9.49827 20.4963L9.63146 20.4178L14.0704 17.7741C14.296 17.6367 14.4347 17.39 14.4347 17.1209V10.6643L16.313 11.7829C16.332 11.7941 16.3456 11.811 16.3483 11.8334V17.1825C16.3429 19.5655 14.4754 21.4888 12.1703 21.4944ZM3.19458 17.5414C2.70529 16.6695 2.5286 15.6462 2.69714 14.6538L2.83033 14.7351L7.27472 17.3788C7.49762 17.5134 7.77488 17.5134 8.0005 17.3788L13.4289 14.1519V16.3863C13.4289 16.4088 13.4153 16.4312 13.399 16.4452L8.90297 19.1198C6.90231 20.3057 4.34713 19.5992 3.19458 17.5414ZM2.023 7.56643C2.51501 6.68892 3.29515 6.01887 4.22209 5.67684V11.1185C4.21937 11.3876 4.358 11.6343 4.58362 11.7661L9.98756 14.9818L8.10923 16.1004C8.08748 16.1116 8.06302 16.1116 8.04399 16.1004L3.55611 13.4286C1.56089 12.2371 0.878607 9.60459 2.02572 7.544V7.56643H2.023ZM17.4465 11.2615L12.0263 8.01499L13.8992 6.89918C13.9209 6.88797 13.9454 6.88797 13.9644 6.89918L18.4523 9.57376C19.8522 10.4064 20.6623 12.0016 20.5263 13.6641C20.3904 15.3266 19.3384 16.7592 17.8244 17.3423V11.9007C17.8162 11.6343 17.6721 11.3904 17.4465 11.2615ZM19.314 8.36543L19.1808 8.28413L14.7445 5.61797C14.5189 5.4806 14.239 5.4806 14.0161 5.61797L8.59037 8.84484V6.61042C8.58765 6.58799 8.59852 6.56556 8.61755 6.55154L13.1054 3.87978C14.5108 3.04433 16.2559 3.12283 17.5852 4.07883C18.9144 5.03484 19.5885 6.69733 19.314 8.34581V8.36543ZM7.56829 12.3268L5.68996 11.211C5.67093 11.1998 5.65734 11.1802 5.65462 11.1577V5.81982C5.65734 4.14892 6.59515 2.62941 8.06302 1.92011C9.53089 1.21082 11.2624 1.44071 12.5101 2.50885L12.3769 2.58735L7.93798 5.23108C7.71236 5.36846 7.57372 5.61517 7.57372 5.88431L7.56829 12.3268ZM8.58765 10.0588L11.0069 8.62055L13.4289 10.0588V12.9324L11.0151 14.3706L8.59308 12.9324L8.58765 10.0588Z",
        ]
      : [
          34,
          36,
          "M31.7645 14.4292C32.5459 12.0444 32.2728 9.43345 31.0252 7.2662C29.1431 3.94279 25.3664 2.23203 21.678 3.03835C19.5985 0.687647 16.4436 -0.353315 13.3979 0.29942C10.3563 0.952155 7.88616 3.20474 6.91994 6.20817C4.49597 6.71159 2.40389 8.25597 1.1772 10.436C-0.721641 13.7552 -0.293144 17.9403 2.24425 20.7859C1.46287 23.1708 1.72753 25.7774 2.97942 27.9489C4.86146 31.2724 8.64233 32.9831 12.335 32.1768C13.9776 34.0539 16.3385 35.1248 18.8087 35.1077C22.5896 35.112 25.942 32.6333 27.0972 28.9729C29.5212 28.4652 31.6133 26.9251 32.84 24.745C34.7178 21.4344 34.2851 17.2705 31.7645 14.4292ZM18.8087 32.8167C17.3006 32.821 15.8386 32.2835 14.6791 31.298L14.885 31.1785L21.7452 27.1554C22.0939 26.9464 22.3081 26.571 22.3081 26.1614V16.3362L25.211 18.0385C25.2404 18.0555 25.2614 18.0811 25.2656 18.1153V26.2553C25.2572 29.8816 22.3711 32.8082 18.8087 32.8167ZM4.93708 26.8013C4.1809 25.4745 3.90784 23.9174 4.1683 22.4071L4.37415 22.5308L11.2427 26.5539C11.5872 26.7587 12.0157 26.7587 12.3644 26.5539L20.7538 21.6434V25.0436C20.7538 25.0778 20.7328 25.1119 20.7076 25.1332L13.7591 29.2032C10.6672 31.0078 6.71829 29.9328 4.93708 26.8013ZM3.12646 11.622C3.88683 10.2867 5.09251 9.26707 6.52504 8.74658V17.0274C6.52084 17.4369 6.73509 17.8124 7.08377 18.0129L15.4353 22.9062L12.5324 24.6085C12.4988 24.6255 12.461 24.6255 12.4316 24.6085L5.4958 20.5428C2.41228 18.7296 1.35785 14.7236 3.13066 11.5879V11.622H3.12646ZM26.9628 17.2449L18.5861 12.3046L21.4805 10.6067C21.5141 10.5896 21.5519 10.5896 21.5814 10.6067L28.5172 14.6767C30.6807 15.9437 31.9326 18.3712 31.7225 20.9011C31.5125 23.431 29.8867 25.611 27.5467 26.4984V18.2176C27.5341 17.8124 27.3115 17.4412 26.9628 17.2449ZM29.8489 12.8379L29.643 12.7142L22.787 8.657C22.4383 8.44795 22.0057 8.44795 21.6612 8.657L13.276 13.5674V10.1672C13.2718 10.1331 13.2886 10.099 13.318 10.0777L20.2538 6.01192C22.4257 4.74058 25.1228 4.86004 27.1771 6.31483C29.2313 7.76962 30.2732 10.2995 29.8489 12.8081V12.8379ZM11.6964 18.8661L8.79357 17.1682C8.76416 17.1511 8.74316 17.1212 8.73896 17.0871V8.96416C8.74316 6.42148 10.1925 4.10918 12.461 3.02982C14.7296 1.95046 17.4056 2.30029 19.3338 3.92573L19.128 4.04518L12.2678 8.06825C11.9191 8.2773 11.7048 8.65273 11.7048 9.06229L11.6964 18.8661ZM13.2718 15.4147L17.0107 13.2261L20.7538 15.4147V19.7876L17.0233 21.9762L13.2802 19.7876L13.2718 15.4147Z",
        ];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path fill-rule="evenodd" clip-rule="evenodd" d={d} fill="rgb(var(--color-foreground-2))" />
    </svg>
  );
};

export const Chatbot = () => {
  const { loading, messages, onSubmit, status } = useChatbot();

  const [isExpanded, setIsExpanded] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "m" || e.key === "M") {
        console.log("m pressed");
        setIsExpanded(true);
      } else if (e.key === "Escape") {
        setIsExpanded(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  useEffect(() => {
    if (isExpanded) {
      setTimeout(() => {
        console.log("focus");
        inputRef.current?.focus();
      }, 500);
    }
  }, [isExpanded]);

  return (
    <div
      className={`pointer-events-none fixed bottom-0 left-0 z-30 flex h-fit w-full items-end justify-center bg-gradient-to-b from-transparent to-background text-foreground-2 ${PAGE_PADDING} transition-all ${
        isExpanded ? "pt-96" : "pt-24"
      }`}
    >
      <div
        className={`pointer-events-auto z-40 mb-10 mt-8 flex w-full flex-col rounded border border-foreground-2 bg-background px-4 py-2 ${CONTENT_MAX_WIDTH}`}
      >
        <div className="flex items-center justify-between gap-6">
          <div className={`flex items-center gap-2 ${isExpanded && "mb-6 mt-4 grow"}`}>
            <Logo variant={isExpanded ? "standard" : "small"} />
            <span className={isExpanded ? "text-2xl" : "text-base"}>PassportGPT</span>
          </div>
          <span className={`ml-4 hidden grow text-xl ${isExpanded ? "md:hidden" : "md:block"}`}>
            Hello, how can we help?
          </span>
          <div className="hidden flex-col items-center lg:flex">
            {isExpanded ? "Press Escape to close" : "Press M anytime to access me"}
          </div>

          <button onClick={() => setIsExpanded((isExpanded) => !isExpanded)} className="">
            <div className="p-2">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                strokeWidth={1.5}
                stroke="currentColor"
                className={`h-6 w-6 ${isExpanded ? "rotate-180" : ""}`}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l7.5-7.5 7.5 7.5m-15 6l7.5-7.5 7.5 7.5"
                />
              </svg>
            </div>
          </button>
        </div>
        <div className={`flex-col transition-all ${isExpanded ? "h-[75vh] md:h-96 lg:h-80" : "h-0"} flex`}>
          <div className="flex flex-col-reverse overflow-y-auto">
            <ul>
              {messages
                .map(({ text, role, id }) => (
                  <li className="my-3" key={id}>
                    <div className="grid grid-cols-[32px_auto] gap-2">
                      <svg className="h-8">
                        <circle
                          width="32"
                          height="32"
                          cx="16"
                          cy="16"
                          r="16"
                          fill={`rgb(var(--color-${role === "user" ? "foreground-2" : "text-2"}))`}
                        />
                      </svg>
                      <div>
                        <div className="font-bold leading-loose">{roleToName(role)}</div>
                        <div className="text-color-1">{text}</div>
                      </div>
                    </div>
                  </li>
                ))
                .flat()}

              {loading ? (
                <li className="bold ml-10 animate-pulse">Loading...</li>
              ) : status !== "completed" ? (
                <li className="bold ml-10">Error: {status}</li>
              ) : null}
            </ul>
          </div>

          <div className="grow" />

          <div className={`${isExpanded ? "visible" : "invisible"} m-4 grid items-center transition-all`}>
            <input
              ref={inputRef}
              className={`col-start-1 row-start-1 h-12 w-full appearance-none rounded-sm border border-foreground-2 bg-transparent pl-4 pr-12 text-foreground-2 placeholder-foreground-2 shadow-foreground-2 focus:shadow-even-sm focus:outline-none`}
              type="text"
              placeholder="Ask PassportGPT a Passport related question"
              disabled={loading}
              onKeyDown={async (e) => {
                if (e.key === "Enter") {
                  const message = e.currentTarget.value;
                  e.currentTarget.value = "";
                  onSubmit(message);
                }
              }}
            />
            <button
              className="col-start-1 row-start-1 justify-self-end px-4"
              onClick={() => {
                if (inputRef.current?.value) {
                  onSubmit(inputRef.current.value || "");
                  inputRef.current.value = "";
                }
              }}
            >
              <svg width="15" height="18" viewBox="0 0 15 18" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M14.5086 8.10288C15.1729 8.48822 15.1729 9.44761 14.5086 9.83294L1.83296 17.1848C0.979193 17.68 0.000359717 16.7702 0.431887 15.8825L3.58087 9.40513C3.71507 9.1291 3.71507 8.80673 3.58087 8.53069L0.431887 2.05328C0.000361353 1.16564 0.979193 0.255841 1.83296 0.751026L14.5086 8.10288Z"
                  fill="#C1F6FF"
                />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
