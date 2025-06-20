// --- React Methods
import React from "react";

export type CustomToastProps = {
  title: string;
  icon: string;
  result: any;
  message: React.ReactNode;
  testId?: string;
};

// This content overrides Chakra UI Toast style in render function
export const DoneToastContent = ({ title, icon, result, testId, message = false }: CustomToastProps): JSX.Element => {
  return (
    <div className="rounded-md bg-color-6 text-background-2 shadow-md" data-testid={`toast-done-${testId}`}>
      <div className="flex p-4">
        <div className="mr-2">
          <div className="mt-1 cursor-not-allowed rounded-full">
            <img alt="information circle" className="sticky top-0 h-6" src={icon} />
          </div>
        </div>
        <div className="flex max-w-[200px] flex-col md:max-w-[390px]">
          <h2 className="mb-2 text-lg font-bold">{title}</h2>
          {message}
        </div>
        <div className="flex flex-grow items-start justify-end">
          <button className="sticky top-0" onClick={result.onClose}>
            <img alt="close button" className="rounded-lg hover:bg-gray-500" src="./assets/x-icon-black.svg" />
          </button>
        </div>
      </div>
    </div>
  );
};
