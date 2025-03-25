export type ProviderError = {
  name?: string;
  message?: string;
  response?: {
    status?: number;
    statusText?: string;
    data: unknown;
  };
};

export function getErrorString(error: ProviderError): string {
  return `${error.name} - ${error.message}|\
response: Status ${error.response?.status} - ${error.response?.statusText}|\
response data: ${JSON.stringify(error?.response?.data)}`;
}

export const formatExceptionMessages = (
  e: unknown,
  baseUserMessage: string,
): { systemMessage: string; userMessage: string } => {
  // Shared ID between system and user messages
  const randomID = Math.random().toString(36).substring(2, 15);

  const systemMessage =
    e instanceof Error
      ? // Drop the message (and first line of stack, which is just the message) as it may contain PII
        `${e.name} ${e.stack.replace(/^.*\n *(?=at)/m, "")} (ID: ${randomID})`
      : "Unknown error (unable to parse error message)";

  // TODO do we want to include the error message in the user message?
  // Otherwise, it's not logged anywhere (unless it's passed in as
  // part of the baseUserMessage)
  const userMessage = baseUserMessage + ` (ID: ${randomID})`;

  return {
    systemMessage,
    userMessage,
  };
};
