import React from "react";
import { useAccount } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { PassportScoreWidget } from "@passportxyz/passport-embed";
import { Button } from "./Button";
import BodyWrapper from "./BodyWrapper";
import PageRoot from "./PageRoot";
import HeaderContentFooterGrid from "./HeaderContentFooterGrid";
import WelcomeFooter from "./WelcomeFooter";
import MinimalHeader from "./MinimalHeader";
import { PAGE_PADDING } from "./PageWidthGrid";

const passportEmbedParams = {
  apiKey: process.env.NEXT_PUBLIC_EMBED_CAMPAIGN_API_KEY as string,
  scorerId: process.env.NEXT_PUBLIC_EMBED_CAMPAIGN_SCORER_ID as string,
  // TODO
  overrideIamUrl: "http://localhost:8004",
};

const Heading = ({ className, children }: { className?: string; children: React.ReactNode }) => (
  <div className={`font-heading text-4xl md:text-5xl text-foreground-2 ${className}`}>{children}</div>
);

export const EmbedCampaign = () => {
  const { open: openWeb3Modal } = useAppKit();
  const { address } = useAccount();

  return (
    <PageRoot className="text-color-1">
      <HeaderContentFooterGrid>
        <div className={`${PAGE_PADDING} bg-background`}>
          <MinimalHeader className={`border-b border-foreground-6`} />
        </div>
        <BodyWrapper className="text-color-1 grid grid-cols-1 lg:grid-cols-2 items-center justify-items-center gap-6 pb-6 mt-0 lg:mt-6 grid-flow-dense w-full h-full">
          <div className="grid grid-cols-1 w-full max-w-md lg:max-w-full h-auto place-items-center lg:col-start-2 -my-16 lg:my-0">
            <img
              className="w-full h-auto col-start-1 row-start-1"
              src="./assets/passportBackgroundLogo.svg"
              alt="Background Icon"
            />
            <img
              className="h-[50%] w-auto col-start-1 row-start-1"
              src="./assets/isometricEmbed.png"
              alt="Embed Widget"
            />
          </div>
          <div className="flex flex-col gap-8">
            <Heading>Install Component</Heading>
            <div>
              Verify your identity with just one click. Our system will check your ETH account for activities that match
              our Stamp criteria. This quick verification is your first step into TODO
            </div>
            <Button variant="primary" className="w-full md:max-w-64">
              Go to documentation
            </Button>
          </div>
          <Heading className="col-span-1 lg:col-span-2">Component Showcase</Heading>
          <img
            className="hidden lg:block col-start-1 col-end-3 row-start-3"
            src="./assets/macbookOutline.svg"
            aria-hidden="true"
          />
          <PassportScoreWidget
            className="lg:col-start-2 lg:col-end-3 lg:row-start-3 lg:justify-self-start lg:self-start lg:mt-[20%] lg:ml-[10%]"
            address={address}
            connectWalletCallback={openWeb3Modal}
            {...passportEmbedParams}
          />
        </BodyWrapper>
        <WelcomeFooter displayPrivacyPolicy={true} />
      </HeaderContentFooterGrid>
    </PageRoot>
  );
};
