import React, { Fragment } from "react";
import { Popover, Transition } from "@headlessui/react";

type NotificationProps = {
  message: string;
  index: number;
  linkText?: string;
  linkUrl?: string;
  isNew?: boolean;
};

const Notification: React.FC<NotificationProps> = ({ message, index, linkText, linkUrl, isNew }) => {
  const messageClasses = `text-sm w-5/6 ${isNew ? "text-foreground-2" : "text-foreground-4"}`;

  return (
    <div className={`flex justify-start items-center p-4 ${index > 0 && "border-t border-foreground-5"}`}>
      <span className={`p-1 mr-2 text-xs rounded-full ${isNew ? "bg-background-5 " : "bg-transparent"}`}></span>
      <span className={messageClasses}>
        {message}
        {linkText && (
          <a href={linkUrl} className="text-blue-400 ml-1">
            {linkText}
          </a>
        )}
      </span>
    </div>
  );
};

export const Notifications: React.FC = () => {
  const hasNotifications = true;
  const notifications = [
    {
      message: "Your stamp will exipre...",
      isNew: true,
    },
    {
      message: "your score changed",
      isNew: false,
    },
  ];
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
                  {notifications.length}
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
              {notifications.map((notification, index) => (
                <Notification key={index} index={index} message={notification.message} isNew={notification.isNew} />
              ))}
            </Popover.Panel>
          </Transition>
        </>
      </Popover>
    </div>
  );
};
