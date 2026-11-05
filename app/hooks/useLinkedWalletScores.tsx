import axios from "axios";
import { useQueries } from "@tanstack/react-query";
import { CERAMIC_CACHE_ENDPOINT } from "../config/stamp_config";
import { useDatastoreConnectionContext } from "../context/datastoreConnectionContext";

/** A stamp that adds to this wallet's score. */
export type CountingStamp = { provider: string; points: string; expires: string | null };
export type LinkedWalletScore = { score: string; points: string; creds: string; stamps: CountingStamp[] };

// The fields of the scorer's /ceramic-cache/score response read here.
type ScoreResponse = {
  score: string | null;
  stamps?: Record<string, { score: string; dedup: boolean; expiration_date?: string | null }> | null;
  points_data?: { total_points: number } | null;
};

const oneDecimal = (value: string | number | null | undefined) => String(Number(Number(value ?? 0).toFixed(1)));

// One wallet's own score, as on its own Passport.
const toLinkedWalletScore = ({ score, stamps, points_data }: ScoreResponse): LinkedWalletScore => {
  // Stamps that add to the score: a stamp counted on another wallet comes back deduplicated at 0.
  const counting = Object.entries(stamps ?? {})
    .filter(([, stamp]) => !stamp.dedup && Number(stamp.score) > 0)
    .map(([provider, stamp]) => ({
      provider,
      points: oneDecimal(stamp.score),
      expires: stamp.expiration_date ?? null,
    }));
  return {
    score: oneDecimal(score),
    points: String(points_data?.total_points ?? 0),
    creds: String(counting.length),
    stamps: counting,
  };
};

const STALE_MS = 5 * 60 * 1000;

// Each linked wallet's score, one request per wallet (as the WaaP app does) until the scorer's group
// scoring is on (holonym-foundation/internal-docs#3587); then one call for the WaaP address returns
// every wallet's share. This endpoint scores each address on its own, so it keeps working then too.
// Returns a score per lowercased address once it has loaded; nothing while loading or on failure.
export const useLinkedWalletScores = (addresses: string[]) => {
  const { dbAccessToken } = useDatastoreConnectionContext();

  const results = useQueries({
    queries: addresses.map((address) => ({
      queryKey: ["linked-wallet-score", address.toLowerCase()],
      enabled: !!dbAccessToken,
      staleTime: STALE_MS,
      retry: 1,
      queryFn: async () => {
        const { data } = await axios.get<ScoreResponse>(`${CERAMIC_CACHE_ENDPOINT}/score/${address}`, {
          headers: { Authorization: `Bearer ${dbAccessToken}` },
        });
        return toLinkedWalletScore(data);
      },
    })),
  });

  return addresses.map((address, i) => ({
    address,
    data: results[i]?.data as LinkedWalletScore | undefined,
    isLoading: !!results[i]?.isLoading,
    isError: !!results[i]?.isError,
  }));
};
