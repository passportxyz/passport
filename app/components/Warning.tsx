import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

import { CONTENT_MAX_WIDTH } from "./PageWidthGrid";

import { UserWarning } from "../context/userState";

export default function Warning({
  userWarning,
  onDismiss,
  className,
}: {
  userWarning: UserWarning;
  onDismiss: () => void;
  className?: string;
}) {
  const { content, dismissible, icon, link } = userWarning;
  return (
    <div
      className={`mx-auto flex w-full items-center justify-center py-2 text-background-2 ${CONTENT_MAX_WIDTH} ${className}`}
    >
      {icon || (
        <div className="mr-4 w-4">
          <ExclamationCircleIcon height={24} color={"#D44D6E"} />
        </div>
      )}
      {content}{" "}
      {link && (
        <a href={link} target="_blank" rel="noreferrer" className="ml-2 underline">
          More information.
        </a>
      )}
      {dismissible && (
        <button onClick={onDismiss} className="ml-2 underline">
          Dismiss
        </button>
      )}
    </div>
  );
}
