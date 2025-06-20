import React from "react";

export const LoadingCard = ({ className }: { className?: string }): JSX.Element => {
  return (
    <div className={className} data-testid="loading-card">
      <div className="relative flex animate-pulse flex-col rounded-lg bg-gray-200 p-0 xl:p-2">
        <div className="flex flex-row p-6">
          <div className="flex h-10 w-10 flex-grow justify-center md:justify-start">
            <div className="h-12 w-12 rounded-full bg-background"></div>
          </div>
        </div>
        <div className="mt-2 flex p-2 px-4">
          <div className="mx-auto mb-4 h-4 w-1/3 rounded-lg bg-background md:mx-0 md:mb-0 xl:mb-2"></div>
        </div>
        <div className="mb-4 hidden grid-cols-12 gap-4 p-2 px-4 md:grid xl:mb-6">
          <div className="col-span-3 h-3 rounded-md bg-background"></div>
          <div className="col-span-2 h-3 rounded-md bg-background"></div>
        </div>

        <div className="ml-4 mt-auto flex h-12 w-full flex-row items-center justify-start">
          <div className="mr-2 h-3 w-1/4 rounded-md bg-background"></div>
        </div>
      </div>
    </div>
  );
};
