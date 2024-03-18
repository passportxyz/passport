import axios from "axios";
import { ProviderContext, RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { Proof, Reclaim } from "@reclaimprotocol/js-sdk";
import { ProviderExternalVerificationError, type Provider } from "../../types";

type StatusResponse = {
  session: {
    proofs: Proof[];
  };
};
async function verifyUberRides(code: string): Promise<{ rides: number }> {
  const reclaimClient = new Reclaim.ProofRequest(process.env.NEXT_PUBLIC_RECLAIM_APP_ID, { sessionId: code });
  const res = await axios.get(reclaimClient.getStatusUrl());
  const data = res.data as StatusResponse;
  if (data.session) {
    const proof = data.session.proofs[0];
    if (!Reclaim.verifySignedProof(proof)) {
      throw new Error("Proof signature invalid");
    }
    const { extractedParameterValues }: { extractedParameterValues: { rides_count: number } } = proof;
    return {
      rides: extractedParameterValues.rides_count,
    };
  } else {
    throw new Error("No session in response");
  }
}

export type UberRidesOptions = {
  threshold: string;
};

const checkUberRides = (threshold: number, rides: number): { valid: boolean; errors: string[] } => {
  if (rides >= threshold) {
    return {
      valid: true,
      errors: undefined,
    };
  } else {
    return {
      valid: false,
      errors: [`Uber account rides are less than ${threshold}`],
    };
  }
};

export class UberRidesProvider implements Provider {
  // The type will be determined dynamically, from the options passed in to the constructor
  type = "";

  _options = {
    threshold: "1",
  };

  constructor(options: UberRidesOptions) {
    this._options = { ...this._options, ...options };
    this.type = `uberRidesGte#${this._options.threshold}`;
  }

  async verify(payload: RequestPayload, context: ProviderContext): Promise<VerifiedPayload> {
    try {
      const { rides } = await verifyUberRides(payload.proofs.code);

      const { valid, errors } = checkUberRides(parseInt(this._options.threshold), rides);

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
