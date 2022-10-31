// ----- Types
import { Provider, ProviderOptions } from "../../types";
import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";

// ----- Idena SignIn library
import { requestIdentityState } from "../procedures/idenaSignIn";

// Class used as a base for verifying Idena state
abstract class IdenaStateProvider implements Provider {
  state: string;

  // The type will be determined dynamically, from the state parameter passed in to the constructor
  type = "";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options and minAge
  constructor(options: ProviderOptions = {}, state: string) {
    this._options = { ...this._options, ...options };
    this.type = `IdenaState#${state}`;
    this.state = state;
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    const { valid, address, expiresInSeconds } = await checkState(payload.proofs.token, this.state);
    if (!valid) {
      return { valid: false };
    }
    return {
      valid: true,
      record: {
        address: address,
        state: this.state,
      },
      expiresInSeconds: expiresInSeconds,
    };
  }
}

// Export an Idena provider that verifies that an identity state is Newbie
export class IdenaStateNewbieProvider extends IdenaStateProvider {
  constructor(options: ProviderOptions = {}) {
    super(options, "Newbie");
  }
}

// Export an Idena provider that verifies that an identity state is Verified
export class IdenaStateVerifiedProvider extends IdenaStateProvider {
  constructor(options: ProviderOptions = {}) {
    super(options, "Verified");
  }
}

// Export an Idena provider that verifies that an identity state is Human
export class IdenaStateHumanProvider extends IdenaStateProvider {
  constructor(options: ProviderOptions = {}) {
    super(options, "Human");
  }
}

const checkState = async (
  token: string,
  expectedState: string
): Promise<{ valid: boolean; address?: string; expiresInSeconds?: number }> => {
  try {
    const result = await requestIdentityState(token);
    const expiresInSeconds = Math.max((new Date(result.expirationDate).getTime() - new Date().getTime()) / 1000);
    return { valid: result.state === expectedState, address: result.address, expiresInSeconds };
  } catch (e) {
    return { valid: false };
  }
};
