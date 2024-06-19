import React, { Fragment } from "react";
import { Popover, Transition } from "@headlessui/react";
import { useNotifications, useDismissNotification, Notification } from "../hooks/useNotifications";
import { OnchainSidebar } from "./OnchainSidebar";

export type NotificationProps = {
  notification_id: string;
  type: "Custom" | "Expiry" | "OnChainExpiry" | "Deduplication";
  content: string;
  dismissed: boolean;
} & {
  setShowSidebar: (show: boolean) => void;
};

const Content = ({ type, content }: NotificationProps) => {
  switch (type) {
    case "Custom":
      return <span>{content}</span>;
    case "Expiry":
      return <span>Your {content} stamp has expired. Please reverify to keep your Passport up to date.</span>;
    case "OnChainExpiry":
      return <span>Your on-chain Passport on {content} has expired. Update now to maintain your active status.</span>;
    case "Deduplication":
      return (
        <span>
          {/* TODO: content might need to be an object/array? */}
          You have claimed the same {content} stamp in two Passports. We only count your stamp once. This duplicate is
          in your wallet {content}. Learn more about deduplication{" "}
          <a href="link-to-deduplication" target="_blank">
            here
          </a>
          .
        </span>
      );
  }
};

const Notification: React.FC<NotificationProps> = ({ notification_id, content, type, dismissed, setShowSidebar }) => {
  const messageClasses = `text-sm w-5/6 ${dismissed ? "text-foreground-4" : "text-foreground-2"}`;

  const dismissMutation = useDismissNotification(notification_id, "read");
  const deleteMutation = useDismissNotification(notification_id, "delete");

  return (
    <>
      {/* ${index > 0 && "border-t border-foreground-5"} */}
      <div
        className={`flex justify-start items-center p-4 relative ${type === "OnChainExpiry" && "cursor-pointer"}`}
        onClick={() => {
          if (type === "OnChainExpiry") {
            setShowSidebar(true);
          }
        }}
      >
        <span className={`p-1 mr-2 text-xs rounded-full ${dismissed ? "bg-transparent" : "bg-background-5 "}`}></span>
        <span className={messageClasses}>{content}</span>
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
                  <button onClick={() => dismissMutation.mutate()} className="w-full text-left">
                    Mark as Read
                  </button>
                  <button className="w-full text-left text-color-7" onClick={() => deleteMutation.mutate()}>
                    Delete
                  </button>
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
  const { notifications: _notifications } = useNotifications();
  const notifications = [
    {
      notification_id: "n1",
      type: "Custom",
      content: "Welcome to our service! Get started by visiting your dashboard.",
      dismissed: false,
    },
    {
      notification_id: "n2",
      type: "Expiry",
      content: "Your subscription is expiring soon. Renew now to keep using all features.",
      dismissed: false,
    },
    {
      notification_id: "n3",
      type: "OnChainExpiry",
      content: "Your on-chain credentials will expire in 3 days. Update your details to stay active.",
      dismissed: true,
    },
    {
      notification_id: "n4",
      type: "Deduplication",
      content: "We have detected duplicate entries in your data. Please review them.",
      dismissed: false,
    },
  ];
  const hasNotifications = notifications.length > 0;

  return (
    <div className="w-full flex justify-end">
      <Popover className="relative">
        <>
          <Popover.Button className="ml-auto p-6">
            <div className="relative">
              {notifications.length > 0 && (
                <div
                  className={`${notifications.length > 10 ? "-right-5" : "-right-2"} absolute -top-3 rounded-full bg-background-5 px-1 border-4 border-background text-[10px] text-background leading-2`}
                >
                  {notifications.filter((not) => !not.dismissed).length}
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
            <Popover.Panel className="absolute w-60 right-1 flex flex-col border-foreground-5 border rounded bg-gradient-to-b from-background via-background to-[#082F2A]">
              <div className="w-full relative">
                <div className="absolute top-[-6px] w-[10px] h-[10px] right-7 border-l bg-background border-b border-foreground-5 transform rotate-[135deg]"></div>
              </div>
              {notifications
                .sort((a, b) => (a.dismissed === b.dismissed ? 0 : a.dismissed ? 1 : -1))
                .map((notification, index) => (
                  <Notification
                    key={notification.notification_id}
                    notification_id={notification.notification_id}
                    content={notification.content}
                    dismissed={notification.dismissed}
                    type={notification.type as Notification["type"]}
                    setShowSidebar={() => setShowSidebar(true)}
                  />
                ))}
            </Popover.Panel>
          </Transition>
        </>
      </Popover>
    </div>
  );
};
