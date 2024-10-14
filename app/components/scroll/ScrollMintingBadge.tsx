import { useWeb3ModalAccount } from "@web3modal/ethers/react";
import { ProviderWithTitle } from "../ScrollCampaign";
import PageRoot from "../PageRoot";
import { AccountCenter } from "../AccountCenter";
import { ScrollFooter, ScrollHeader } from "./ScrollLayout";

export const ScrollMintingBadge = ({ earnedBadges }: { earnedBadges: ProviderWithTitle[] }) => {
  const { isConnected } = useWeb3ModalAccount();
  return (
    <PageRoot className="text-color-1">
      {isConnected && <AccountCenter />}
      <ScrollHeader className="fixed top-0 left-0 right-0" />
      <div className="flex grow">
        <div className="flex flex-col min-h-screen justify-center items-center shrink-0 grow w-1/2 text-center">
          <div className="text-5xl text-[#FFEEDA]">Minting badges!</div>
          <div className="flex flex-wrap justify-center items-end gap-8">
            {earnedBadges.map((badge, index) => (
              <div key={index} className={`flex flex-col items-center even:mb-10`}>
                <img
                  src={badge.image}
                  alt={`Badge Level ${badge.level}`}
                  className="badge-image w-32 h-32 object-contain"
                />
                <div className="mt-2 text-lg font-semibold">{badge.title}</div>
                <div className="text-sm">Level: {badge.level}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <ScrollFooter className="absolute bottom-0 left-0 right-0 z-10" />
    </PageRoot>
  );
};
