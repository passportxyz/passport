interface WelcomeBackProps {
  setSkipForNow: (skipForNow: boolean) => void;
  onOpen: () => void;
}

export const WelcomeBack = ({ setSkipForNow, onOpen }: WelcomeBackProps) => {
  return (
    <>
      <div className="top-[113px] mt-10 text-3xl">Welcome Back!</div>
      <div className="top-[209px] mt-10 h-[240px] w-[295px] border border-accent-2 bg-background lg:h-[333.56px] lg:w-[410px]"></div>
      <p className="top-[113px] mt-10 text-2xl text-muted">One-Click Verification</p>
      <p className="mt-2 w-[343px] text-gray-300 lg:w-[410px]">
        You can now verify most web3 stamps and return to your destination faster with one-click verification!
      </p>
      <div className="mt-16 flex w-[295px] content-center items-center justify-between lg:w-[410px]">
        <button className="secondary-btn rounded-sm py-2 px-6" onClick={() => setSkipForNow(true)}>
          Skip For Now
        </button>
        <button className="rounded-sm bg-accent py-2 px-6" onClick={onOpen}>
          Refresh My Stamps
        </button>
      </div>
    </>
  );
};
