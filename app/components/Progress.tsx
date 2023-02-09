export enum Status {
  SUCCESS,
  IN_PROGRESS,
  NOT_STARTED,
  ERROR,
}

export type Step = {
  name: string;
  description: string;
  status: Status;
};

type ProgressProps = {
  steps: Step[];
  error?: boolean;
};

type StepComponentProps = {
  step: Step;
  isLastStep: boolean;
  error?: boolean;
};

export const completedIcon = (src: string) => (
  <span className="step-icon step-icon-completed flex h-9 items-center">
    <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-teal-600">
      <img alt="completed icon" className="sticky top-0 h-6" src={src} />
    </span>
  </span>
);

const currentIcon = (
  <span className="step-icon step-icon-current Status flex h-9 items-center" aria-hidden="true">
    <span className="step-icon-outer relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-indigo-600 bg-white">
      <span className="step-icon-inner rounded-full bg-indigo-600" />
    </span>
  </span>
);

const waitingIcon = (
  <span className="step-icon step-icon-waiting flex h-9 items-center" aria-hidden="true">
    <span
      // eslint-disable-next-line max-len
      className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full border-2 border-gray-300 bg-white"
    >
      <span className="h-2.5 w-2.5 rounded-full bg-transparent" />
    </span>
  </span>
);

const errorIcon = (
  <span className="step-icon step-icon-error flex h-9 items-center">
    <span className="relative z-10 flex h-8 w-8 items-center justify-center rounded-full bg-red-600">
      <img alt="error icon" className="sticky top-0 h-6" src="./assets/x-icon.svg" />
    </span>
  </span>
);

function StepComponent({ step, isLastStep, error }: StepComponentProps) {
  let icon = waitingIcon;

  switch (step.status) {
    case Status.SUCCESS:
      icon = completedIcon("./assets/white-check-icon.svg");
      break;
    case Status.NOT_STARTED:
      icon = waitingIcon;
      break;
    case Status.IN_PROGRESS:
      icon = currentIcon;
      break;
    case Status.ERROR:
      icon = errorIcon;
      break;
  }

  return (
    <li className="relative m-2" data-testid={`step-${step.name}`}>
      {!isLastStep && (
        <div className={`absolute top-4 left-4 -ml-px mt-0.5 h-full w-0.5 bg-indigo-600`} aria-hidden="true" />
      )}

      <div className="group relative flex items-start">
        {icon}
        <span className="ml-4 flex min-w-0 flex-col">
          <span className="text-sm font-medium">{step.name}</span>
          <span className="text-sm text-gray-500">{step.description}</span>
        </span>
      </div>
    </li>
  );
}

export function Progress({ steps, error }: ProgressProps) {
  return (
    <>
      {/* <div>
          <div>
            <h5 className="font-semibold mb-2">Processing...</h5>
            {error === undefined && <p className="mb-4">{title}</p>}
          </div>
        </div> */}
      <div>
        <nav aria-label="Progress">
          <ol className="overflow-hidden">
            {steps.map((step) => (
              <StepComponent key={step.name} step={step} isLastStep={step.name === steps[steps.length - 1].name} />
            ))}
          </ol>
        </nav>
      </div>
    </>
  );
}
