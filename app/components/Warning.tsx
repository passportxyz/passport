import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

import { CONTENT_MAX_WIDTH } from "./PageWidthGrid";

import { UserWarning } from "../context/userContext";

export default function Warning({
  userWarning,
  onDismiss,
  className,
}: {
  userWarning: UserWarning;
  onDismiss: () => void;
  className?: string;
}) {
  const { content, dismissible, icon } = userWarning;
  return (
    <div
      className={`mx-auto flex w-full items-center justify-center py-2 text-purple-darkpurple ${CONTENT_MAX_WIDTH} ${className}`}
    >
      {icon || <ExclamationCircleIcon height={24} color={"#D44D6E"} className="mr-4" />}
      {content}{" "}
      {dismissible && (
        <button onClick={onDismiss} className="ml-2 underline">
          Dismiss
        </button>
      )}
    </div>
  );
}
