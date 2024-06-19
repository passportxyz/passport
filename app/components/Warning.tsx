import { ExclamationCircleIcon } from "@heroicons/react/24/solid";

import { CONTENT_MAX_WIDTH } from "./PageWidthGrid";

import { UserWarning } from "../context/userState";
import { Hyperlink } from "@gitcoin/passport-platforms";

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
      className={`mx-auto flex w-full items-center justify-center py-2 text-background ${CONTENT_MAX_WIDTH} ${className}`}
    >
      {icon || (
        <div className="mr-4 w-4">
          <ExclamationCircleIcon height={24} color={"rgb(var(--color-background))"} />
        </div>
      )}
      {content}{" "}
      {link && (
        <Hyperlink href={link} className="ml-2">
          More information.
        </Hyperlink>
      )}
      {dismissible && (
        <button onClick={onDismiss} className="ml-2 underline">
          Dismiss
        </button>
      )}
    </div>
  );
}
