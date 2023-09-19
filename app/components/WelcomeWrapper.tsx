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
    <div className="my-6 w-full text-center md:my-12">
      <div className="font-heading text-3xl">{content.header}</div>
      <div className="mt-8 w-full border border-foreground-4 md:mt-12">
        <img src={content.imgSrc} alt="welcome" className="aspect-[4/3] h-auto w-full" />
      </div>
      <p className="mt-4 text-2xl text-color-2 md:mt-6">{content.subHeader}</p>
      <p className="mt-2 text-color-1">{content.body}</p>
      <div className="mt-4 flex w-full items-center justify-between">{children}</div>
    </div>
  );
};
