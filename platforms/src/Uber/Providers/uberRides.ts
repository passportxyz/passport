import axios from "axios";
import { ProviderContext, RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { Proof, Reclaim } from "@reclaimprotocol/js-sdk";
import { ProviderExternalVerificationError, type Provider } from "../../types";

type StatusResponse = {
  session: {
    proofs: Proof[];
  };
};
async function verifyUberRides(code: string): Promise<{ hasRide: boolean }> {
  const reclaimClient = new Reclaim.ProofRequest(process.env.NEXT_PUBLIC_RECLAIM_APP_ID, { sessionId: code });
  const res = await axios.get(reclaimClient.getStatusUrl());
  const data = res.data as StatusResponse;
  if (data.session) {
    const proof = data.session.proofs[0];
    if (!Reclaim.verifySignedProof(proof)) {
      throw new Error("Proof signature invalid");
    }

    return {
      hasRide: true,
    };
  } else {
    throw new Error("No session in response");
  }
}

const checkUberRides = (hasRide: boolean): { valid: boolean; errors: string[] } => {
  if (hasRide) {
    return {
      valid: true,
      errors: undefined,
    };
  } else {
    return {
      valid: false,
      errors: [`Uber account doesn't have any rides.`],
    };
  }
};

export class UberRidesProvider implements Provider {
  type = "uberRides";

  async verify(payload: RequestPayload, context: ProviderContext): Promise<VerifiedPayload> {
    try {
      const { hasRide } = await verifyUberRides(payload.proofs.code);

      const { valid, errors } = checkUberRides(hasRide);

      return {
        valid,
        errors,
        record: { address: payload.address },
      };
    } catch (e: unknown) {
      throw new ProviderExternalVerificationError(`Error verifying Reclaim Proof: ${String(e)}`);
    }
  }
}