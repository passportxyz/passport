export function Banner({ children }: { children: JSX.Element | string }) {
  return (
    <div className="bg-purple-infoElementBG px-4 py-3">
      <div className="flex w-full flex-row items-center text-center">{children}</div>
    </div>
  );
}
