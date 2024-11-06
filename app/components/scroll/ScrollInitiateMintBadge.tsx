import { useEffect, useState } from "react";
import { useMessage } from "../../hooks/useMessage";
import { useIssueAttestation } from "../../hooks/useIssueAttestation";
import { Stamp, VerifiableCredential } from "@gitcoin/passport-types";
import { scrollCampaignChain, scrollCanvasProfileRegistryAddress } from "../../config/scroll_campaign";
import { ProviderWithTitle } from "../ScrollCampaign";
import { ScrollCampaignPage } from "./ScrollCampaignPage";
import { LoadingBarSection, LoadingBarSectionProps } from "../LoadingBar";
import { LoadButton } from "../LoadButton";
import ScrollCanvasProfileRegistryAbi from "../../abi/ScrollCanvasProfileRegistry.json";
import { RenderedBadges } from "./ScrollMintedBadge";
import { useBreakpoint } from "../../hooks/useBreakpoint";
import { useAccount, usePublicClient } from "wagmi";

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
  const publicClient = usePublicClient({
    chainId: parseInt(scrollCampaignChain?.id || ""),
  });
  const { needToSwitchChain } = useIssueAttestation({ chain: scrollCampaignChain });
  const [hasCanvas, setHasCanvas] = useState<Boolean | undefined>(undefined);
  const [canvasCheckPaused, setCanvasCheckPaused] = useState(false);
  const { failure } = useMessage();
  const { address } = useAccount();
  const isLg = useBreakpoint("lg");

  const loading = credentialsLoading || hasCanvas === undefined;

  useEffect(() => {
    if (!scrollCampaignChain || hasCanvas !== undefined || !publicClient) return;

    (async () => {
      try {
        // Skip Canvas check if contract address is not provided
        if (!scrollCanvasProfileRegistryAddress) {
          setHasCanvas(true);
          return;
        }

        // Deterministic profile "address" for a given user address
        const profile = (await publicClient.readContract({
          address: scrollCanvasProfileRegistryAddress as `0x${string}`,
          abi: ScrollCanvasProfileRegistryAbi.abi,
          functionName: "getProfile",
          args: [address],
        })) as string | undefined;

        const hasCanvas =
          Boolean(profile) &&
          ((await publicClient.readContract({
            address: scrollCanvasProfileRegistryAddress as `0x${string}`,
            abi: ScrollCanvasProfileRegistryAbi.abi,
            functionName: "isProfileMinted",
            args: [profile],
          })) as boolean | undefined);

        setHasCanvas(Boolean(hasCanvas));
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
  }, [address, hasCanvas, failure, publicClient]);

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
            You had enough commits and contributions to a qualifying project. To finish claiming your badge, and
            increase your developer reputation, mint your badges now. The badges prove that you are qualified without
            revealing any personal details from your GitHub account.
            {hasDeduplicatedCredentials
              ? " (Some badge credentials could not be validated because they have already been claimed on another address.)"
              : ""}
          </div>
        ) : hasDeduplicatedCredentials ? (
          "Your badge credentials have already been claimed with another address."
        ) : (
          <div>
            Your GitHub profile doesn&apos;t meet the badge qualifications. Eligibility is limited to specific projects,
            and contributions had to be made by October 1st. Check out the project list{" "}
            <a
              href="https://support.passport.xyz/passport-knowledge-base/partner-campaigns/scroll-developer-badges"
              className="underline text-[#93FBED]"
              target="_blank"
              rel="noopener noreferrer"
            >
              here
            </a>{" "}
            for more details.
          </div>
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
