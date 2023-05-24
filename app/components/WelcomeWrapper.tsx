export type Content = {
  header: string;
  subHeader: string;
  body: string;
  imgSrc: string;
};

export type WelcomeWrapperProps = {
  content: Content;
  children: React.ReactNode;
};

export const WelcomeWrapper = ({ content, children }: WelcomeWrapperProps) => {
  return (
    <>
      <div className="mt-10 font-heading text-3xl">{content.header}</div>
      <div className="mt-10 h-[240px] w-[295px] border border-accent-2 bg-background lg:h-[333.56px] lg:w-[410px]">
        <img src={content.imgSrc} alt="welcome" className="h-full w-full" />
      </div>
      <p className="mt-10 text-2xl text-muted">{content.subHeader}</p>
      <p className="mt-2 mb-10 w-[343px] text-gray-300 lg:w-[410px]">{content.body}</p>
      <div className="absolute bottom-10 mb-auto flex w-full items-center justify-between px-4 md:relative md:mt-16 md:px-0 lg:w-[410px]">
        {children}
      </div>
    </>
  );
};
