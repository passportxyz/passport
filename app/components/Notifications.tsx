import React, { Fragment, useCallback, useContext, useMemo, useState } from "react";
import { Popover, Transition } from "@headlessui/react";
import {
  useNotifications,
  useDismissNotification,
  Notification,
  useDeleteAllNotifications,
} from "../hooks/useNotifications";
import { StampClaimForPlatform, StampClaimingContext } from "../context/stampClaimingContext";
import { PLATFORM_ID, PROVIDER_ID } from "@gitcoin/passport-types";
import { CeramicContext } from "../context/ceramicContext";

export type NotificationProps = {
  notification: Notification;
} & {
  setShowSidebar: (show: boolean) => void;
};

enum ReverificationStatus {
  INITIAL,
  PENDING,
  SUCCESSFUL,
  REJECTED,
}

const ExpiryAction = ({
  content,
  provider,
  notification_id,
}: {
  content: string;
  provider: PROVIDER_ID;
  notification_id: string;
}) => {
  const [reverificationStatus, setReverificationStatus] = useState(ReverificationStatus.INITIAL);
  const { claimCredentials } = useContext(StampClaimingContext);
  const { expiredPlatforms } = useContext(CeramicContext);
  const deleteMutation = useDismissNotification(notification_id, "delete");

  const platformId = useMemo(() => {
    return Object.values(expiredPlatforms)
      .filter((platform) => {
        const providers =
          platform?.platFormGroupSpec.map((spec) => spec.providers.map((provider) => provider.name)).flat() || [];
        return providers.includes(provider);
      })
      .map((platform) => platform?.platform.platformId)[0];
  }, [expiredPlatforms, provider]);

  const refreshStamp = useCallback(
    async (stamp: StampClaimForPlatform) => {
      setReverificationStatus(ReverificationStatus.PENDING);
      await claimCredentials(
        async () => await Promise.resolve(),
        () => {
          setReverificationStatus(ReverificationStatus.REJECTED);
        },
        [stamp]
      );
      if (reverificationStatus === ReverificationStatus.REJECTED) {
        return;
      }
      setReverificationStatus(ReverificationStatus.SUCCESSFUL);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      deleteMutation.mutate();
    },
    [claimCredentials, deleteMutation, reverificationStatus]
  );

  const message = useMemo(() => {
    if (reverificationStatus === ReverificationStatus.PENDING) {
      return <div>Your stamp is being reverified</div>;
    }
    if (reverificationStatus === ReverificationStatus.REJECTED) {
      return <div>There was an error re-verifying the stamp. Please double check your eligibility.</div>;
    }
    if (reverificationStatus === ReverificationStatus.SUCCESSFUL) {
      return <div>Your expired stamp has been reverified!</div>;
    }

    const claim: StampClaimForPlatform = {
      platformId: platformId as PLATFORM_ID,
      selectedProviders: [provider],
    };

    const parts = content.split(/(reverify)/i);
    return parts.map((part, index) =>
      part.toLowerCase() === "reverify" ? (
        <div className="inline-block underline cursor-pointer" key={index} onClick={() => refreshStamp(claim)}>
          {part}
        </div>
      ) : (
        part
      )
    );
  }, [platformId, provider, reverificationStatus, content, refreshStamp]);

  return <>{message}</>;
};

const Content = ({ notification }: { notification: Notification }) => {
  const { content, link, type, link_text } = notification;
  const linkSpan =
    link && link_text ? (
      <a className="underline" href={link} target="_blank">
        {link_text}.
      </a>
    ) : null;

  switch (type) {
    case "custom":
      return (
        <span>
          {content} {linkSpan}
        </span>
      );
    case "stamp_expiry":
      return (
        <ExpiryAction content={content} provider={link as PROVIDER_ID} notification_id={notification.notification_id} />
      );
    case "on_chain_expiry":
      return (
        <span>
          {content} {linkSpan}
        </span>
      );
    case "deduplication":
      return (
        <span>
          {content} {linkSpan}
        </span>
      );
  }
};

const NotificationComponent: React.FC<NotificationProps> = ({ notification, setShowSidebar }) => {
  const { notification_id, is_read, type } = notification;
  const messageClasses = `text-sm w-5/6 ${is_read ? "text-foreground-4" : "text-foreground-2"}`;

  const dismissMutation = useDismissNotification(notification_id, "read");
  const deleteMutation = useDismissNotification(notification_id, "delete");

  return (
    <>
      <div className={`flex justify-start items-center p-4 relative ${type === "on_chain_expiry" && "cursor-pointer"}`}>
        <span
          data-testid="read-indicator"
          className={`p-1 mr-2 text-xs rounded-full ${is_read ? "bg-transparent" : "bg-background-5 "}`}
        ></span>
        <span
          className={messageClasses}
          onClick={() => {
            if (type === "on_chain_expiry") {
              setShowSidebar(true);
            }
          }}
        >
          <Content notification={notification} />
        </span>
        <div className="absolute top-1 right-3 z-10">
          <Popover className="relative">
            <>
              <Popover.Button className="ml-auto p-2">
                <svg width="4" height="16" viewBox="0 0 4 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <ellipse cx="2" cy="2" rx="2" ry="2" fill="#6CB6AD" />
                  <ellipse cx="2" cy="8" rx="2" ry="2" fill="#6CB6AD" />
                  <ellipse cx="2" cy="13.7998" rx="2" ry="2" fill="#6CB6AD" />
                </svg>
              </Popover.Button>
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-150"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
              >
                <Popover.Panel className="absolute w-48 right-1 bg-background flex flex-col justify-start text-left p-4 rounded">
                  {({ close }) => (
                    <>
                      <button
                        onClick={() => {
                          dismissMutation.mutate();
                          close();
                        }}
                        className="w-full text-left"
                      >
                        Mark as Read
                      </button>
                      <button
                        className="w-full text-left text-color-7"
                        onClick={() => {
                          deleteMutation.mutate();
                          close();
                        }}
                      >
                        Delete
                      </button>
                    </>
                  )}
                </Popover.Panel>
              </Transition>
            </>
          </Popover>
        </div>
      </div>
    </>
  );
};

export type NotificationsProps = {
  setShowSidebar: (show: boolean) => void;
};

export const Notifications: React.FC<NotificationsProps> = ({ setShowSidebar }) => {
  const { notifications } = useNotifications();
  const deleteMutation = useDeleteAllNotifications();
  const hasNotifications = notifications.length > 0;
  return (
    <div className="flex justify-end z-20">
      <Popover className="relative">
        <>
          <Popover.Button className="ml-auto p-6" data-testid="notification-bell">
            <div className="relative">
              {notifications.length > 0 && (
                <div
                  className={`${notifications.length > 10 ? "-right-5" : "-right-2"} absolute -top-3 rounded-full bg-background-5 px-1 border-4 border-background text-[10px] text-background leading-2`}
                >
                  {notifications.filter((not) => !not.is_read).length}
                </div>
              )}
              <img
                className="h-6 w-6"
                alt={`Notifications indicator. User currently ${hasNotifications ? "has" : "doesn't have"} notifications`}
                src={hasNotifications ? "./assets/full-bell.svg" : "./assets/empty-bell.svg"}
              />
            </div>
          </Popover.Button>
          <Transition
            as={Fragment}
            enter="transition ease-out duration-100"
            enterFrom="opacity-0 translate-y-1"
            enterTo="opacity-100 translate-y-0"
            leave="transition ease-in duration-150"
            leaveFrom="opacity-100 translate-y-0"
            leaveTo="opacity-0 translate-y-1"
          >
            <Popover.Panel className="absolute w-96 md:w-72 right-1 flex flex-col border-foreground-5 border rounded bg-gradient-to-b from-background via-background to-[#082F2A]">
              <div className="w-full relative">
                <div className="absolute top-[-6px] w-[10px] h-[10px] right-7 border-l bg-background border-b border-foreground-5 transform rotate-[135deg]"></div>
              </div>
              <div className="absolute w-full pl-8 py-3 text-foreground-2 bg-background z-20 rounded-t">
                Notifications
              </div>
              <div
                className={`overflow-y-auto min-h-[120px] max-h-[40vh] ${notifications.length > 0 ? "pt-10 pb-10" : "pt-6"}`}
              >
                {notifications.length > 0 ? (
                  <>
                    {notifications
                      .sort((a, b) => (a.is_read === b.is_read ? 0 : a.is_read ? 1 : -1))
                      .map((notification) => (
                        <NotificationComponent
                          key={notification.notification_id}
                          notification={notification}
                          setShowSidebar={() => setShowSidebar(true)}
                        />
                      ))}
                    <div
                      onClick={() => {
                        deleteMutation.mutate();
                      }}
                      className="cursor-pointer absolute bottom-0 w-full pl-8 py-3 text-foreground-2 bg-background z-20 rounded-b bg-gradient-to-b from-background via-background to-[#082F2A]"
                    >
                      Delete All
                    </div>
                  </>
                ) : (
                  <p className="p-8 text-foreground-2">
                    You have no notifications. We’ll let you know when there’s something.
                  </p>
                )}
              </div>
            </Popover.Panel>
          </Transition>
        </>
      </Popover>
    </div>
  );
};
