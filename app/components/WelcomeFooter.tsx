import React from "react";
import { Chain, chains } from "../utils/chains";

const GitHubIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" className="w-6 h-6 mx-2">
    <path
      fill="white"
      d="M16 0a16 16 0 00-5.06 31.16c.8.14 1.09-.34 1.09-.76v-2.69c-4.45.96-5.39-2.15-5.39-2.15-.73-1.84-1.79-2.34-1.79-2.34-1.46-.99.11-.97.11-.97 1.62.12 2.47 1.67 2.47 1.67 1.43 2.45 3.75 1.74 4.66 1.33.14-1.03.56-1.74 1.01-2.14-3.55-.4-7.29-1.77-7.29-7.89 0-1.74.62-3.17 1.63-4.29-.16-.4-.71-2.03.15-4.22 0 0 1.34-.43 4.4 1.64a15.3 15.3 0 014.01-.54c1.36.01 2.73.18 4.01.54 3.05-2.08 4.39-1.64 4.39-1.64.87 2.19.32 3.82.16 4.22 1.01 1.12 1.63 2.54 1.63 4.29 0 6.14-3.75 7.48-7.32 7.88.57.49 1.08 1.48 1.08 2.98v4.42c0 .42.29.91 1.1.76A16 16 0 0016 0z"
    />
  </svg>
);

const SyncIcon = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_9912_994)">
      <path
        d="M10.8001 17.7749C11.1751 17.7749 11.5126 18.0749 11.5126 18.4874C11.5126 18.8624 11.2126 19.1999 10.8001 19.1999C10.4251 19.1999 10.0876 18.8999 10.0876 18.4874C10.0876 18.0749 10.4251 17.7749 10.8001 17.7749ZM21.8251 13.4249C21.4501 13.4249 21.1126 13.1249 21.1126 12.7124C21.1126 12.3374 21.4126 11.9999 21.8251 11.9999C22.2001 11.9999 22.5376 12.2999 22.5376 12.7124C22.5376 13.0874 22.2001 13.4249 21.8251 13.4249ZM21.8251 10.5374C20.6251 10.5374 19.6501 11.5124 19.6501 12.7124C19.6501 12.9374 19.6876 13.1624 19.7626 13.3874L12.6001 17.2124C12.1876 16.6124 11.5126 16.2749 10.8001 16.2749C9.97505 16.2749 9.22505 16.7624 8.85005 17.4749L2.40005 14.0999C1.72505 13.7249 1.20005 12.6374 1.27505 11.5874C1.31255 11.0624 1.50005 10.6499 1.76255 10.4999C1.95005 10.3874 2.13755 10.4249 2.40005 10.5374L2.43755 10.5749C4.16255 11.4749 9.75005 14.3999 9.97505 14.5124C10.3501 14.6624 10.5376 14.7374 11.1751 14.4374L22.7251 8.43744C22.9126 8.36244 23.1001 8.21244 23.1001 7.94994C23.1001 7.61244 22.7626 7.46244 22.7626 7.46244C22.0876 7.16244 21.0751 6.67494 20.1001 6.22494C18.0001 5.24994 15.6001 4.12494 14.5501 3.56244C13.6501 3.07494 12.9001 3.48744 12.7876 3.56244L12.5251 3.67494C7.76255 6.07494 1.46255 9.18744 1.08755 9.41244C0.450053 9.78744 0.0375525 10.5749 5.2521e-05 11.5499C-0.0749475 13.0874 0.712552 14.6999 1.83755 15.2624L8.66255 18.7874C8.81255 19.8374 9.75005 20.6624 10.8001 20.6624C12.0001 20.6624 12.9376 19.7249 12.9751 18.5249L20.4751 14.4749C20.8501 14.7749 21.3376 14.9249 21.8251 14.9249C23.0251 14.9249 24.0001 13.9499 24.0001 12.7499C24.0001 11.5124 23.0251 10.5374 21.8251 10.5374Z"
        fill="white"
      />
    </g>
    <defs>
      <clipPath id="clip0_9912_994">
        <rect width="24" height="24" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const chainsForFooter = (
  [
    {
      icon: "/assets/ceramic-icon.svg",
      chainLink: "https://support.passport.xyz/passport-knowledge-base/faq/common-questions/what-is-ceramic",
      id: "-",
      token: "-",
      label: "Ceramic",
      rpcUrl: "-",
    },
  ] as Chain[]
).concat(chains.filter((chain) => !!chain.attestationProvider));

const WelcomeFooter = ({ displayPrivacyPolicy }: { displayPrivacyPolicy: boolean; }) => {
  return (
    <footer
      className={`flex flex-col md:flex-row gap-y-1 bottom-0 items-center justify-between p-4 bg-black text-white text-sm w-full max-w-full overflow-auto relative md:fixed`}
    >
      <div className="flex items-start justify-start lg:justify-between flex-wrap">
        <span className="lg:ml-10 self-center">Available on</span>
        {chainsForFooter.map(({ chainLink, icon }, idx) => {
          return (
            <div key={idx} className="flex m-1 md:m-2 lg:m-3">
              <a className="self-start" target="_blank" href={chainLink}>
                <img src={icon} className="w-[20px] md:w-[35px] h-[20px] md:h-[35px]" />
              </a>
            </div>
          );
        })}
      </div>
      <div className="flex flex-col md:flex-row gap-y-1 items-center md:items-end justify-center md:justify-end flex-wrap">
        {displayPrivacyPolicy ? (
          <a href="https://www.gitcoin.co/privacy" className="hover:underline px-2  ">
            Privacy Policy
          </a>
        ) : null}
        <a href="https://support.passport.xyz/passport-knowledge-base" className="hover:underline px-2">
          Learn More
        </a>
        <a href="https://scorer.gitcoin.co/" className="hover:underline px-2">
          Passport XYZ Scorer
        </a>
        <div className="flex flex-col md:flex-row gap-y-1 items-end justify-end flex-wrap">
          <div className="md:px-2">
            <a href="https://passport.gitcoin.co/">
              <GitHubIcon />
            </a>
          </div>
          <div className="pr-2 md:px-2 md:mr-20">
            <a href="https://docs.passport.xyz/">
              <SyncIcon />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default WelcomeFooter;
