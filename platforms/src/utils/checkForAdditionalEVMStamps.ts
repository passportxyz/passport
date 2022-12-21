import * as Ens from "../Ens";
import * as Gitcoin from "../Gitcoin";
import * as Lens from "../Lens";
import * as Poh from "../Poh";
import * as Snapshot from "../Snapshot";
import * as GnosisSafe from "../GnosisSafe";
import * as NFT from "../NFT";
import * as GitPOAP from "../GitPOAP";
import * as POAP from "../POAP";
import * as ETH from "../ETH";
import * as ZkSync from "../ZkSync";
import * as GTC from "../GTC";
import * as GtcStaking from "../GtcStaking";

import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

export const checkAllEVMProviders = async (requestPayload: RequestPayload): Promise<VerifiedPayload[]> => {
  const gtcStaking = new GtcStaking.CommunityStakingBronzeProvider();
  const verifiedGtcStaking = await gtcStaking.verify(requestPayload);
  console.log({ verifiedGtcStaking });
  return [verifiedGtcStaking];
};
