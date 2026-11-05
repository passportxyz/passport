// The app's loading ring (buttons and the header's "Connecting..."). It takes the surrounding text
// colour, so it shows on dark buttons as well as light ones.
export const Spinner = ({ className = "" }: { className?: string }) => (
  <span
    aria-hidden="true"
    data-testid="spinner"
    className={`inline-block h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent ${className}`}
  />
);
