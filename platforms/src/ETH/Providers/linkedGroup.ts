import axios from "axios";

// Linked wallets of a WaaP account, from the WaaP auth-server
// (holonym-foundation/internal-docs#3587). Same endpoint and settings as the
// scorer's linkage source (passport-scorer#946).

export type LinkedGroup = {
  /** Every address in the group, lowercased, the WaaP address included. */
  addresses: string[];
  /** The account's own WaaP address: the only holder of group credentials. */
  waapAddress: string;
  /** How long an unlinked wallet stays out of every group, when WaaP says. */
  cooldownSeconds?: number;
};

type LookupResponse = {
  addresses?: unknown;
  waapAddress?: unknown;
  cooldownSeconds?: unknown;
};

// Scoring is latency-sensitive; a slow lookup falls back to the wallet alone.
const LOOKUP_TIMEOUT_MS = 2_000;

/**
 * The group to score `address` with, or null to score it alone.
 *
 * Null whenever the group can't be trusted to include it as the holder: no
 * configuration, a failed or malformed lookup, an address that isn't the
 * group's WaaP address (a linked wallet never holds credentials earned from
 * another wallet's activity), or a group of one.
 */
export async function getLinkedGroup(address: string): Promise<LinkedGroup | null> {
  const baseUrl = (process.env.SILK_AUTH_SERVER_URL ?? "").trim().replace(/\/+$/, "");
  const serviceKey = (process.env.SILK_SERVICE_API_KEY ?? "").trim();
  if (!baseUrl || !serviceKey) return null;

  const lower = address.toLowerCase();
  let body: LookupResponse;
  try {
    const response = await axios.get<LookupResponse>(
      `${baseUrl}/api/public/linked-wallets/by-address/${encodeURIComponent(lower)}`,
      { headers: { "X-Service-Key": serviceKey }, timeout: LOOKUP_TIMEOUT_MS }
    );
    body = response?.data;
  } catch {
    return null;
  }
  if (!body || !Array.isArray(body.addresses) || typeof body.waapAddress !== "string") {
    return null;
  }

  const addresses = Array.from(
    new Set(body.addresses.filter((a): a is string => typeof a === "string").map((a) => a.toLowerCase()))
  );
  const waapAddress = body.waapAddress.toLowerCase();
  if (waapAddress !== lower || !addresses.includes(lower) || addresses.length < 2) {
    return null;
  }

  const cooldownSeconds =
    typeof body.cooldownSeconds === "number" && Number.isFinite(body.cooldownSeconds) && body.cooldownSeconds >= 0
      ? body.cooldownSeconds
      : undefined;
  return { addresses, waapAddress, cooldownSeconds };
}
