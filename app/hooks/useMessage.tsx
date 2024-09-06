import { useToast } from "@chakra-ui/react";
import { useBreakpoint } from "./useBreakpoint";
import { useCallback } from "react";
import { DoneToastContent } from "../components/DoneToastContent";

const successIcon = "../../assets/check-icon2.svg";
const failureIcon = "../assets/verification-failed-bright.svg";

type Message = {
  title: string;
  message: React.ReactNode;
  duration?: number;
  testId?: string;
};

export const useMessage = () => {
  const toast = useToast();
  const isMd = useBreakpoint("md");

  const showMessage = useCallback(
    ({ title, message, icon, testId, duration = 9000 }: Message & { icon: string }) => {
      toast({
        position: isMd ? "bottom" : "top",
        duration,
        isClosable: true,
        render: (result: any) => (
          <DoneToastContent title={title} message={message} icon={icon} result={result} testId={testId} />
        ),
      });
    },
    [toast]
  );

  const success = useCallback((props: Message) => showMessage({ ...props, icon: successIcon }), [showMessage]);

  const failure = useCallback((props: Message) => showMessage({ ...props, icon: failureIcon }), [showMessage]);

  // This is to support circumstances where the message type is chosen dynamically
  const message = useCallback(
    ({ status, ...props }: Message & { status: "success" | "failure" }) =>
      status === "success" ? success(props) : failure(props),
    [showMessage]
  );

  return { success, failure, message };
};
