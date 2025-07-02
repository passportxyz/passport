import React from "react";
import PageRoot from "../components/PageRoot";
import Header from "../components/Header";
import WelcomeFooter from "../components/WelcomeFooter";

export const InitialScreenWelcome: React.FC<{ imgUrl: string; children: React.ReactNode }> = ({ imgUrl, children }) => {
  return (
    <PageRoot className="text-gray-900 flex flex-col min-h-screen overflow-auto pb-32 md:pb-0">
      <Header skipCustomisation={true} />
      <div className="mt-4 md:mt-0 pt-16 flex-1 m-auto overflow-visible grid grid-cols-1 grid-rows-1 content-center ">
        <div className="grid grid-cols-1 grid-rows-1 md:flex md:justify-start gap-12 overflow-visible m-8 md:max-h-[calc(100vh-16rem)]">
          <div className="flex flex-row justify-end md:max-w-[740px]">
            <img src={imgUrl} alt="Welcome"></img>
          </div>
          <div className="md:col-span-5 flex flex-col justify-center items-center md:items-start gap-6 relative z-10 overflow-visible md:max-w-[740px]">
            <div
              style={{
                background: "radial-gradient(closest-side, #EBFFF7, #EBFFF7, rgb(255,255,255,0), rgb(255,255,255,0))",
              }}
              className="w-[200%] h-full absolute -z-10 -left-[50%]"
            />
            {children}
          </div>
        </div>
      </div>
      <WelcomeFooter displayPrivacyPolicy={true} />
    </PageRoot>
  );
};
