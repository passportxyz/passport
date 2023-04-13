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
      <ol role="list" className="overflow-hidden">
        {steps.map((step, stepIdx) => (
          <li key={step.name} className={classNames(stepIdx !== steps.length - 1 ? "pb-0" : "", "relative")}>
            {step.status === Status.SUCCESS ? (
              <>
                {stepIdx !== steps.length - 1 ? (
                  <div className="absolute left-4 top-8 -ml-px mt-0.5 h-full w-0.5 bg-indigo-600" aria-hidden="true" />
                ) : null}
                ;
                <span className="flex h-0 items-center">
                  <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 group-hover:bg-indigo-800">
                    <CheckIcon className="h-5 w-5 text-white" aria-hidden="true" />
                  </span>
                </span>
                <span className="ml-12 -mt-2 flex min-w-0 flex-col">
                  <span className="text-sm font-medium text-white">{step.name}</span>
                </span>
              </>
            ) : step.status === Status.IN_PROGRESS ? (
              <>
                {stepIdx !== steps.length - 1 ? (
                  <div className="absolute left-4 top-8 -ml-px mt-0.5 h-full w-0.5 bg-accent-2" aria-hidden="true" />
                ) : null}
                ;
                <span className="flex h-0 items-center" aria-hidden="true">
                  <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-indigo-600 bg-white">
                    <span className="h-2.5 w-2.5 rounded-full bg-indigo-600" />
                  </span>
                </span>
                <span className="ml-12 -mt-2 flex min-w-0 flex-col">
                  <span className="text-sm font-medium text-white">{step.name}</span>
                </span>
              </>
            ) : (
              <>
                {stepIdx !== steps.length - 1 ? (
                  <div className="absolute left-4 top-8 -ml-px mt-0.5 h-full w-0.5 bg-accent-2" aria-hidden="true" />
                ) : null}
                ;
                <span className="flex h-0 items-center" aria-hidden="true">
                  <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-accent-2 bg-black group-hover:border-gray-400">
                    <span className="h-2.5 w-2.5 rounded-full bg-transparent group-hover:bg-gray-300" />
                  </span>
                </span>
                <span className="ml-12 -mt-2 flex min-w-0 flex-col">
                  <span className="text-sm font-medium text-white">{step.name}</span>
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
