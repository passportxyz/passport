// --- React Methods
import React, { useEffect, useState } from "react";

// --- Components
import PageRoot from "../components/PageRoot";
import SIWEButton from "../components/SIWEButton";
import { isServerOnMaintenance } from "../utils/helpers";
import { WebmVideo } from "../components/WebmVideo";
import Header from "../components/Header";
import BodyWrapper from "../components/BodyWrapper";

import { DEFAULT_CUSTOMIZATION_KEY, useCustomization } from "../hooks/useCustomization";
import WelcomeFooter from "../components/WelcomeFooter";
import HeaderContentFooterGrid from "../components/HeaderContentFooterGrid";

import { useLoginFlow } from "../hooks/useLoginFlow";
import { AccountCenter } from "../components/AccountCenter";
import { useAccount } from "wagmi";

export default function Home() {
  const { isLoggingIn, signIn, loginStep } = useLoginFlow();
  const { isConnected } = useAccount();
  const [enableEthBranding, setEnableEthBranding] = useState(false);
  const customization = useCustomization();

  useEffect(() => {
    const usingCustomization = customization.key !== DEFAULT_CUSTOMIZATION_KEY;
    setEnableEthBranding(!usingCustomization);
  }, [customization.key]);

  return (
    <PageRoot className="text-gray-900 flex flex-col min-h-screen overflow-auto pb-32 md:pb-0">
      <Header />
      <div className="mt-4 md:mt-0 pt-16 flex-1 m-auto overflow-visible grid grid-cols-1 grid-rows-1 content-center ">
        <div className="grid grid-cols-2 grid-rows-1 gap-12 overflow-visible m-8">
          <div className="flex flex-row justify-end">
            <img src="/assets/hmnWelcomeImage.svg" alt="Welcome"></img>
          </div>
          <div className="flex flex-col justify-center gap-6 relative z-10 overflow-visible">
            <div
              style={{
                background: "radial-gradient(closest-side, #EBFFF7, rgb(255,255,255,0))",
              }}
              className="w-[200%] h-full absolute -z-10 -left-[50%]"
            />
            <div className="mb-4 text-2xl leading-none md:text-6xl">Unlock the best of web3</div>
            <div className="max-w-md text-lg lg:max-w-sm">
              Access a world of Web3 opportunities securely with a single sign-in.
            </div>

            <div className="flex justify-start items-center">
              <SIWEButton
                subtext={(() => {
                  if (loginStep === "PENDING_WALLET_CONNECTION") {
                    return "Connect your wallet";
                  } else if (loginStep === "PENDING_DATABASE_CONNECTION") {
                    return "Sign message in wallet";
                  }
                })()}
                loadIconPosition="right"
                disabled={isLoggingIn || isServerOnMaintenance()}
                isLoading={isLoggingIn}
                enableEthBranding={enableEthBranding}
                data-testid="connectWalletButton"
                onClick={signIn}
                className="px-10"
              />
            </div>
            <div className="flex flex-row  bg-emerald-100 items-center rounded-3xl">
              <div className="p-4">
                <svg width="89" height="88" viewBox="0 0 89 88" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="0.5" width="88" height="88" rx="44" fill="#00B88A" />
                  <path
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                    d="M44.9998 66.9609C47.0391 66.9609 48.8077 66.0229 50.2203 64.679C51.6211 63.3459 52.7787 61.5256 53.6987 59.4555C54.3984 57.8812 54.9846 56.1016 55.4467 54.1708C57.3788 53.7086 59.1591 53.1199 60.7343 52.4199C62.8043 51.4999 64.6247 50.3421 65.9578 48.9415C67.3016 47.529 68.2396 45.76 68.2398 43.7209C68.2396 41.6817 67.3018 39.9129 65.9578 38.5004C64.6248 37.0997 62.8043 35.9449 60.7343 35.0249C59.1592 34.3249 57.3787 33.7367 55.4467 33.274C54.9845 31.3421 54.3987 29.5614 53.6987 27.9864C52.7787 25.9162 51.6211 24.096 50.2203 22.7629C48.8077 21.419 47.0391 20.4809 44.9998 20.4809C42.9604 20.4811 41.1918 21.4187 39.7792 22.7629C38.3785 24.0959 37.2238 25.9163 36.3037 27.9864C35.6036 29.5617 35.0127 31.3417 34.5499 33.274C32.619 33.7366 30.8396 34.3252 29.2652 35.0249C27.1953 35.9449 25.3747 37.0997 24.0417 38.5004C22.6977 39.9129 21.76 41.6817 21.7598 43.7209C21.76 45.76 22.6979 47.529 24.0417 48.9415C25.3748 50.3421 27.1952 51.4999 29.2652 52.4199C30.8396 53.1196 32.6189 53.7087 34.5499 54.1708C35.0126 56.102 35.6039 57.8809 36.3037 59.4555C37.2238 61.5255 38.3785 63.3459 39.7792 64.679C41.1918 66.0231 42.9604 66.9607 44.9998 66.9609ZM50.3866 32.3986C48.6526 32.2043 46.8479 32.1009 44.9998 32.1009C43.1506 32.1009 41.3449 32.204 39.61 32.3986C39.8939 31.4895 40.2074 30.6444 40.5496 29.8744C41.3119 28.1593 42.1597 26.9143 42.9833 26.1304C43.7947 25.3583 44.4725 25.1268 44.9998 25.1266C45.527 25.1266 46.2048 25.3585 47.0162 26.1304C47.8398 26.9143 48.6876 28.1593 49.4499 29.8744C49.792 30.6442 50.1025 31.4898 50.3866 32.3986ZM44.9998 50.6953C42.7092 50.6953 40.5289 50.5148 38.5157 50.205C38.2065 48.1918 38.0283 46.0114 38.0283 43.7209C38.0283 41.4316 38.2068 39.2522 38.5157 37.2398C40.529 36.9305 42.7091 36.7495 44.9998 36.7495C47.2893 36.7495 49.4684 36.9308 51.4809 37.2398C51.7905 39.2523 51.9741 41.4312 51.9741 43.7209C51.9741 46.0117 51.7907 48.1917 51.4809 50.205C49.4685 50.5145 47.2893 50.6953 44.9998 50.6953ZM33.6745 49.1107C32.7665 48.8268 31.9225 48.513 31.1532 48.1711C29.4383 47.4089 28.1931 46.5609 27.4093 45.7374C26.6376 44.9263 26.4056 44.2481 26.4054 43.7209C26.4056 43.1938 26.6374 42.5157 27.4093 41.7045C28.1931 40.8809 29.4382 40.033 31.1532 39.2708C31.9224 38.9289 32.7665 38.6149 33.6745 38.3311C33.48 40.066 33.3798 41.8719 33.3798 43.7209C33.3798 45.5699 33.48 47.3759 33.6745 49.1107ZM56.3221 49.1107C56.5163 47.3758 56.6198 45.57 56.6198 43.7209C56.6198 41.8718 56.5163 40.0661 56.3221 38.3311C57.2312 38.6151 58.0763 38.9286 58.8463 39.2708C60.5613 40.033 61.8065 40.8809 62.5903 41.7045C63.3621 42.5157 63.5939 43.1938 63.5941 43.7209C63.5939 44.2481 63.3619 44.9263 62.5903 45.7374C61.8064 46.5609 60.5612 47.4089 58.8463 48.1711C58.0763 48.5133 57.2312 48.8266 56.3221 49.1107ZM44.9998 62.3153C44.4725 62.3151 43.7947 62.0836 42.9833 61.3114C42.1597 60.5276 41.3119 59.2826 40.5496 57.5675C40.2077 56.7982 39.8937 55.9543 39.61 55.0462C41.3448 55.2404 43.1508 55.3409 44.9998 55.3409C46.8477 55.3409 48.6527 55.2401 50.3866 55.0462C50.1027 55.9539 49.7917 56.7985 49.4499 57.5675C48.6876 59.2826 47.8398 60.5276 47.0162 61.3114C46.2048 62.0834 45.527 62.3153 44.9998 62.3153Z"
                    fill="#EBFFF7"
                  />
                </svg>
              </div>
              <div className="py-4 pt-4">
                <div className="pr-8">
                  We are launching HUMN Points rewards program. Earn Points and unlock exclusive rewards.
                </div>
                <a href="https://human.tech/">
                  <p className="font-bold">
                    Learn more
                    <svg
                      className="inline"
                      width="25"
                      height="24"
                      viewBox="0 0 25 24"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        d="M7.5 7H17.5M17.5 7V17M17.5 7L7.5 17"
                        stroke="black"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                      />
                    </svg>
                  </p>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
      <WelcomeFooter displayPrivacyPolicy={true} />
    </PageRoot>
  );
}
