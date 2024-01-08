import { Button } from "./Button";
import { TEST_MODE, toggleTestMode } from "../context/testModeState";

const TestingLogo = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
    stroke-width="1.5"
    stroke="currentColor"
    className="h-16 w-16"
  >
    <path
      stroke-linecap="round"
      stroke-linejoin="round"
      d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l6.837-5.63m5.108-.233c.55-.164 1.163-.188 1.743-.14a4.5 4.5 0 0 0 4.486-6.336l-3.276 3.277a3.004 3.004 0 0 1-2.25-2.25l3.276-3.276a4.5 4.5 0 0 0-6.336 4.486c.091 1.076-.071 2.264-.904 2.95l-.102.085m-1.745 1.437L5.909 7.5H4.5L2.25 3.75l1.5-1.5L7.5 4.5v1.409l4.26 4.26m-1.745 1.437 1.745-1.437m6.615 8.206L15.75 15.75M4.867 19.125h.008v.008h-.008v-.008Z"
    />
  </svg>
);

export const TestingPanel = ({ className }: { className: string }) => {
  return (
    <div
      className={`${className} flex rounded border border-focus ${
        TEST_MODE ? "" : "shadow-[0_0_15px_rgb(var(--color-focus)/.75)]"
      }`}
    >
      <div className="flex shrink flex-col items-center justify-center border-r border-focus bg-gradient-to-b from-transparent to-focus/[.4] p-6">
        <TestingLogo />
        <span className="mt-1 text-3xl leading-none">Testing</span>
      </div>
      <div className="relative flex w-full flex-col justify-center gap-2 bg-gradient-to-b from-transparent to-focus/[.26] p-6">
        <div className="text-center text-xl">
          Test Mode:{" "}
          <span className={`font-extrabold ${TEST_MODE ? "text-foreground-5" : "text-background-3"}`}>
            {TEST_MODE ? "ENABLED" : "DISABLED"}
          </span>
        </div>
        <div className="text-center text-lg">
          {TEST_MODE ? (
            <div>
              You are in test mode. You can push your credentials to testnets. You may now use other dashboards if
              desired. To switch back to mainnet chains return here and click below, or simply close this tab.
            </div>
          ) : (
            <div>Click below to enable test mode, you will need to sign in again.</div>
          )}
        </div>
        <div className="grow" />
        <Button
          variant="custom"
          className={`rounded-s mr-2 mt-2 w-fit self-end bg-focus hover:bg-focus/75 enabled:hover:text-color-1 disabled:bg-focus disabled:brightness-100`}
          onClick={toggleTestMode}
        >
          {TEST_MODE ? "Disable" : "Enable"} Test Mode
        </Button>
      </div>
    </div>
  );
};
