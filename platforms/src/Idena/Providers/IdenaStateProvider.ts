// ----- Types
import { Provider, ProviderOptions } from "../../types";
import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Idena SignIn library
import { IdenaContext, requestIdentityState } from "../procedures/idenaSignIn";

// Class used as a base for verifying Idena state
abstract class IdenaStateProvider implements Provider {
  name: string;
  acceptableStates: string[];

  // The type will be determined dynamically, from the state parameter passed in to the constructor
  type = "";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options and minAge
  constructor(options: ProviderOptions = {}, name: string, acceptableStates: string[]) {
    this._options = { ...this._options, ...options };
    this.type = `IdenaState#${name}`;
    this.name = name;
    this.acceptableStates = acceptableStates;
  }

  async verify(payload: RequestPayload, context: IdenaContext): Promise<VerifiedPayload> {
    const token = payload.proofs.sessionKey;
    const { valid, address, expiresInSeconds, errors } = await this.checkState(token, context);
    return {
      valid,
      record: {
        address,
        state: this.name,
      },
      errors,
      expiresInSeconds,
    };
  }

  async checkState(
    token: string,
    context: IdenaContext
  ): Promise<{ valid: boolean; address?: string; expiresInSeconds?: number; errors?: string[] }> {
    const result = await requestIdentityState(token, context);
    const expiresInSeconds = Math.max((new Date(result.expirationDate).getTime() - new Date().getTime()) / 1000, 0);
    if (this.acceptableStates.includes(result.state)) {
      return { valid: true, address: result.address, expiresInSeconds };
    }
    return {
      valid: false,
      errors: [`State "${result.state}" does not match acceptable state(s) ${this.acceptableStates.join(", ")}`],
    };
  }
}

// Export an Idena provider that verifies that an identity state is Newbie
export class IdenaStateNewbieProvider extends IdenaStateProvider {
  constructor(options: ProviderOptions = {}) {
    super(options, "Newbie", ["Newbie", "Verified", "Human"]);
  }
}

// Export an Idena provider that verifies that an identity state is Verified
export class IdenaStateVerifiedProvider extends IdenaStateProvider {
  constructor(options: ProviderOptions = {}) {
    super(options, "Verified", ["Verified", "Human"]);
  }
}

// Export an Idena provider that verifies that an identity state is Human
export class IdenaStateHumanProvider extends IdenaStateProvider {
  constructor(options: ProviderOptions = {}) {
    super(options, "Human", ["Human"]);
  }
}
