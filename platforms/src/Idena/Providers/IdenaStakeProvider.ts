// ----- Types
import { Provider, ProviderOptions } from "../../types";
import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Idena SignIn library
import { requestIdentityStake } from "../procedures/idenaSignIn";

// Class used as a base for verifying Idena stake
abstract class IdenaStakeProvider implements Provider {
  minStake: number;

  // The type will be determined dynamically, from the minStake parameter passed in to the constructor
  type = "";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options and minStake
  constructor(options: ProviderOptions = {}, minStake: number) {
    this._options = { ...this._options, ...options };
    this.type = `IdenaStake#${minStake / 1000}k`;
    this.minStake = minStake;
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    const token = payload.proofs.sessionKey;
    const { valid, address, expiresInSeconds } = await checkStake(token, this.minStake);
    if (!valid) {
      return { valid: false };
    }
    return {
      valid: true,
      record: {
        address: address,
        stake: `gt${this.minStake / 1000}`,
      },
      expiresInSeconds: expiresInSeconds,
    };
  }
}

// Export an Idena provider that verifies that an identity stake >= 1000 iDna
export class IdenaStake1kProvider extends IdenaStakeProvider {
  constructor(options: ProviderOptions = {}) {
    super(options, 1000);
  }
}

// Export an Idena provider that verifies that an identity stake >= 10000 iDna
export class IdenaStake10kProvider extends IdenaStakeProvider {
  constructor(options: ProviderOptions = {}) {
    super(options, 10000);
  }
}

// Export an Idena provider that verifies that an identity stake >= 100000 iDna
export class IdenaStake100kProvider extends IdenaStakeProvider {
  constructor(options: ProviderOptions = {}) {
    super(options, 100000);
  }
}

const checkStake = async (
  token: string,
  min: number
): Promise<{ valid: boolean; address?: string; expiresInSeconds?: number }> => {
  try {
    const result = await requestIdentityStake(token);
    const expiresInSeconds = (new Date(result.expirationDate).getTime() - new Date().getTime()) / 1000;
    return { valid: result.stake > min, address: result.address, expiresInSeconds };
  } catch (e) {
    return { valid: false };
  }
};
