import React, { useCallback, useMemo } from "react";
import type { BenefitCredential, WalletContribution, StampCarouselStamp } from "@human.tech/ui/passport";
import type { PLATFORM_ID } from "@gitcoin/passport-types";
import { usePlatforms } from "../../hooks/usePlatforms";
import type { CountingStamp } from "../../hooks/useLinkedWalletScores";

const NO_CONTRIBUTION: WalletContribution = { stamps: [], credentials: [] };

const formatExpiry = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }) : null;

// What a linked wallet contributes, for the wallet details ("View details") screen: the stamps that
// count on that wallet, from its score response (useLinkedWalletScores), with Passport's names and
// icons. "Stamps from this wallet" shows their points; "Credentials" shows when each expires.
export const useWalletContribution = () => {
  const { platformProviders, getPlatformSpec } = usePlatforms();

  // provider id -> its platform and readable title
  const providers = useMemo(() => {
    const map = new Map<string, { platformId: PLATFORM_ID; title: string }>();
    for (const [platformId, specs] of Object.entries(platformProviders)) {
      for (const { name, title } of specs) map.set(name, { platformId: platformId as PLATFORM_ID, title });
    }
    return map;
  }, [platformProviders]);

  return useCallback(
    (stamps: CountingStamp[] | undefined): WalletContribution => {
      if (!stamps?.length) return NO_CONTRIBUTION;
      const described = stamps.map((stamp) => {
        const provider = providers.get(stamp.provider);
        const platform = provider ? getPlatformSpec(provider.platformId) : undefined;
        const icon = platform?.icon ? <img src={platform.icon} alt="" width={20} height={20} /> : undefined;
        return {
          stamp,
          platformName: platform?.name ?? stamp.provider,
          title: provider?.title ?? stamp.provider,
          icon,
        };
      });
      return {
        stamps: described.map(
          ({ stamp, platformName, icon }): StampCarouselStamp => ({
            id: stamp.provider,
            name: platformName,
            points: stamp.points,
            icon,
          })
        ),
        credentials: described.map(({ stamp, platformName, title, icon }): BenefitCredential => {
          const expires = formatExpiry(stamp.expires);
          return {
            id: stamp.provider,
            name: title,
            detail: expires ? `${platformName} · Expires ${expires}` : platformName,
            icon,
          };
        }),
      };
    },
    [providers, getPlatformSpec]
  );
};
