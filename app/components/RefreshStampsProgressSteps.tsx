import { CheckIcon } from "@heroicons/react/20/solid";

import { Status, Step } from "../components/Progress";

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(" ");
}

type RefreshStampsProgressStepsProps = {
  steps: Step[];
};

export default function RefreshStampsProgressSteps({ steps }: RefreshStampsProgressStepsProps) {
  return (
    <nav aria-label="Progress">
      <ol role="list" className="overflow-hidden text-color-4">
        {steps.map((step, stepIdx) => (
          <li
            key={step.name}
            className={classNames(stepIdx !== steps.length - 1 ? "pb-0" : "", "relative text-color-4")}
          >
            {step.status === Status.SUCCESS ? (
              <>
                {stepIdx !== steps.length - 1 ? (
                  <div
                    className="absolute left-4 top-8 -ml-px mt-0.5 h-full w-0.5 bg-background-3"
                    aria-hidden="true"
                  />
                ) : null}
                ;
                <span className="flex h-0 items-center">
                  <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background-2 group-hover:bg-background-3">
                    <CheckIcon className="h-5 w-5 text-color-1" aria-hidden="true" />
                  </span>
                </span>
                <span className="-mt-2 ml-12 flex min-w-0 flex-col">
                  <span className="text-sm font-medium text-color-1">{step.name}</span>
                </span>
              </>
            ) : step.status === Status.IN_PROGRESS ? (
              <>
                {stepIdx !== steps.length - 1 ? (
                  <div
                    className="absolute left-4 top-8 -ml-px mt-0.5 h-full w-0.5 bg-foreground-6 text-color-4"
                    aria-hidden="true"
                  />
                ) : null}
                ;
                <span className="flex h-0 items-center" aria-hidden="true">
                  <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-background-3 bg-foreground">
                    <span className="h-2.5 w-2.5 rounded-full bg-background-3" />
                  </span>
                </span>
                <span className="-mt-2 ml-12 flex min-w-0 flex-col">
                  <span className="text-sm font-medium text-color-2">{step.name}</span>
                </span>
              </>
            ) : (
              <>
                {stepIdx !== steps.length - 1 ? (
                  <div
                    className="absolute left-4 top-8 -ml-px mt-0.5 h-full w-0.5 bg-foreground-6 text-color-4"
                    aria-hidden="true"
                  />
                ) : null}
                ;
                <span className="flex h-0 items-center text-color-4" aria-hidden="true">
                  <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-foreground-6 bg-background text-color-4 group-hover:border-foreground-3">
                    <span className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-foreground-3" />
                  </span>
                </span>
                <span className="-mt-2 ml-12 flex min-w-0 flex-col">
                  <span className="text-sm font-medium text-color-1">{step.name}</span>
                </span>
              </>
            )}
            ;
          </li>
        ))}
        ;
      </ol>
    </nav>
  );
}
