// ----- Types
import { Provider, ProviderOptions } from "../../types";
import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Idena SignIn library
import { IdenaContext, requestIdentityStake } from "../procedures/idenaSignIn";

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

  async verify(payload: RequestPayload, context: IdenaContext): Promise<VerifiedPayload> {
    const token = payload.proofs.sessionKey;
    const { valid, address, expiresInSeconds, errors } = await checkStake(token, context, this.minStake);
    return {
      valid,
      record: {
        address,
        stake: `gt${this.minStake / 1000}`,
      },
      errors,
      expiresInSeconds,
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
  context: IdenaContext,
  min: number
): Promise<{ valid: boolean; address?: string; expiresInSeconds?: number; errors?: string[] }> => {
  const result = await requestIdentityStake(token, context);
  const expiresInSeconds = Math.max((new Date(result.expirationDate).getTime() - new Date().getTime()) / 1000, 0);

  if (result.stake > min) {
    return { valid: true, address: result.address, expiresInSeconds };
  }
  return { valid: false, errors: [`Stake "${result.stake}" is not greater than minimum "${min}" iDna`] };
};
