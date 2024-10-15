import { useWeb3ModalAccount } from "@web3modal/ethers/react";
import { ProviderWithTitle } from "../ScrollCampaign";
import PageRoot from "../PageRoot";
import { AccountCenter } from "../AccountCenter";
import { ScrollFooter, ScrollHeader } from "./ScrollLayout";
import { RenderedBadges } from "./ScrollMintedBadge";

export const ScrollMintingBadge = ({ earnedBadges }: { earnedBadges: ProviderWithTitle[] }) => {
  const { isConnected } = useWeb3ModalAccount();
  return (
    <PageRoot className="text-color-1">
      {isConnected && <AccountCenter />}
      <ScrollHeader className="fixed top-0 left-0 right-0" />
      <div className="flex grow">
        <div className="flex flex-col min-h-screen justify-center items-center shrink-0 grow w-1/2 text-center">
          <div className="text-5xl text-[#FFEEDA] mb-10">Minting badges...</div>
          <div className="flex flex-wrap justify-center items-end gap-8">
            <RenderedBadges badges={earnedBadges} />
          </div>
        </div>
      </div>
      <ScrollFooter className="absolute bottom-0 left-0 right-0 z-10" />
    </PageRoot>
  );
};
