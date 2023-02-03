export default function ProcessingPopup({ children }: { children: JSX.Element }) {
  return (
    <div className="top-unset absolute z-10 my-2 h-10 w-full md:top-10">
      <div className="absolute left-2 right-2 rounded bg-blue-darkblue py-3 px-8 md:right-1/2 md:left-1/3 md:w-5/12 md:py-4 xl:w-1/4">
        <span className="absolute top-0 right-0 flex h-3 w-3 translate-x-1/2 -translate-y-1/2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-green-jade opacity-75"></span>
          <span className="relative inline-flex h-3 w-3 rounded-full bg-green-jade"></span>
        </span>
        <span className="font-bold text-green-jade">{children}</span>
      </div>
    </div>
  );
}
