import { useEffect, useState } from "react";
import { useMessage } from "../../hooks/useMessage";
import { useAttestation } from "../../hooks/useAttestation";
import { Stamp, VerifiableCredential } from "@gitcoin/passport-types";
import { scrollCampaignChain, scrollCanvasProfileRegistryAddress } from "../../config/scroll_campaign";
import { ProviderWithTitle } from "../ScrollCampaign";
import { ScrollCampaignPage } from "./ScrollCampaignPage";
import { LoadingBarSection, LoadingBarSectionProps } from "../LoadingBar";
import { LoadButton } from "../LoadButton";
import { useWalletStore } from "../../context/walletStore";
import { ethers } from "ethers";
import { Hyperlink } from "@gitcoin/passport-platforms";
import ScrollCanvasProfileRegistryAbi from "../../abi/ScrollCanvasProfileRegistry.json";
import { RenderedBadges } from "./ScrollMintedBadge";
import { useBreakpoint } from "../../hooks/useBreakpoint";

export const ScrollInitiateMintBadge = ({
  onMint,
  credentialsLoading,
  hasDeduplicatedCredentials,
  deduplicatedBadgeStamps,
  highestLevelBadgeStamps,
  earnedBadges,
}: {
  onMint: (args: { credentials: VerifiableCredential[] }) => Promise<void>;
  credentialsLoading: boolean;
  hasDeduplicatedCredentials: boolean;
  highestLevelBadgeStamps: Stamp[];
  deduplicatedBadgeStamps: Stamp[];
  earnedBadges: ProviderWithTitle[];
}) => {
  const { needToSwitchChain } = useAttestation({ chain: scrollCampaignChain });
  const [hasCanvas, setHasCanvas] = useState<Boolean | undefined>(undefined);
  const [canvasCheckPaused, setCanvasCheckPaused] = useState(false);
  const { failure } = useMessage();
  const address = useWalletStore((state) => state.address);
  const isLg = useBreakpoint("lg");

  const loading = credentialsLoading || hasCanvas === undefined;

  useEffect(() => {
    if (!scrollCampaignChain || hasCanvas !== undefined) return;

    (async () => {
      try {
        // Skip Canvas check if contract address is not provided
        if (!scrollCanvasProfileRegistryAddress) {
          setHasCanvas(true);
          return;
        }

        const scrollRpcProvider = new ethers.JsonRpcProvider(scrollCampaignChain.rpcUrl);
        const badgeContract = new ethers.Contract(
          scrollCanvasProfileRegistryAddress,
          ScrollCanvasProfileRegistryAbi.abi,
          scrollRpcProvider
        );

        const profileAddress = await badgeContract.getProfile(address);
        const hasCanvas = await badgeContract.isProfileMinted(profileAddress);

        setHasCanvas(hasCanvas);
        setCanvasCheckPaused(true);
        setTimeout(() => setCanvasCheckPaused(false), 10000);
      } catch (error) {
        console.error("Error checking for canvas profile", error);
        failure({
          title: "Error",
          message: "An unexpected error occurred while checking for your Scroll Canvas profile.",
        });
      }
    })();
  }, [address, hasCanvas, failure]);

  const hasBadge = highestLevelBadgeStamps.length > 0;
  const hasMultipleBadges = highestLevelBadgeStamps.length > 1;

  const ScrollLoadingBarSection = (props: LoadingBarSectionProps) => (
    <LoadingBarSection loadingBarClassName="h-10 via-[#FFEEDA] brightness-50" {...props} />
  );

  return (
    <ScrollCampaignPage fadeBackgroundImage={loading || hasBadge} earnedBadges={earnedBadges}>
      <ScrollLoadingBarSection
        isLoading={loading}
        className={`text-3xl lg:text-5xl ${hasBadge ? "text-[#FFEEDA]" : "text-[#FF684B]"}`}
      >
        {hasBadge ? "Congratulations!" : "We're sorry!"}
      </ScrollLoadingBarSection>
      <ScrollLoadingBarSection isLoading={loading} className="text-lg lg:text-xl mt-2">
        {hasBadge ? (
          <div>
            You qualify for {highestLevelBadgeStamps.length} badge{hasMultipleBadges ? "s" : ""}.
            {hasCanvas ? (
              <> Mint your badge{hasMultipleBadges ? "s" : ""} and get a chance to work with us.</>
            ) : (
              <>
                <br />
                <br />
                It looks like you don&apos;t have a Canvas yet. Get yours{" "}
                <Hyperlink href="https://scroll.io/canvas">here</Hyperlink>!
              </>
            )}
            {hasDeduplicatedCredentials
              ? " (Some badge credentials could not be validated because they have already been claimed on another address.)"
              : ""}
          </div>
        ) : hasDeduplicatedCredentials ? (
          "Your badge credentials have already been claimed with another address."
        ) : (
          "You don't qualify for any badges."
        )}
      </ScrollLoadingBarSection>

      {hasBadge && (
        <div className="mt-8 w-full lg:w-aut">
          {hasCanvas === true ? (
            <>
              <LoadButton
                variant="custom"
                onClick={() =>
                  onMint({
                    credentials: deduplicatedBadgeStamps.map(({ credential }) => credential),
                  })
                }
                isLoading={loading}
                className="text-color-1 text-lg font-bold bg-[#FF684B] hover:brightness-150 py-3 transition-all duration-200 w-full lg:w-auto"
              >
                <div className="flex flex-col items-center justify-center">
                  Mint Badge{hasMultipleBadges ? "s" : ""}
                </div>
              </LoadButton>
              {!isLg && (
                <div className="flex flex-wrap justify-center items-end gap-8 text-center mt-6">
                  <RenderedBadges badges={earnedBadges} />
                </div>
              )}
              {needToSwitchChain && (
                <div className="text-[#FF684B] mt-4">
                  You will be prompted to switch to the Scroll chain, and then to submit a transaction.
                </div>
              )}
            </>
          ) : (
            <LoadButton
              variant="custom"
              onClick={() => setHasCanvas(undefined)}
              isLoading={hasCanvas === undefined || canvasCheckPaused}
              className="text-color-1 text-lg font-bold bg-[#FF684B] hover:brightness-150 py-3 transition-all duration-200 w-full lg:w-auto"
            >
              {hasCanvas === undefined ? "Checking..." : "Check Again"}
            </LoadButton>
          )}
        </div>
      )}
    </ScrollCampaignPage>
  );
};
