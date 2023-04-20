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
      <div className="top-[113px] mt-10 text-3xl">{content.header}</div>
      <div className="top-[209px] mt-10 h-[240px] w-[295px] border border-accent-2 bg-background lg:h-[333.56px] lg:w-[410px]">
        <img src={content.imgSrc} alt="welcome" className="h-full w-full" />
      </div>
      <p className="top-[113px] mt-10 text-2xl text-muted">{content.subHeader}</p>
      <p className="mt-2 mb-10 w-[343px] text-gray-300 lg:w-[410px]">{content.body}</p>
      <div className="absolute bottom-10 mb-auto flex w-[295px] items-center justify-between md:relative md:mt-16 lg:w-[410px]">
        {children}
      </div>
    </>
  );
};
