// ----- Types
import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { Provider, ProviderOptions } from "../../types";

// ----- Idena SignIn library
import { requestIdentityAge, IdenaContext } from "../procedures/idenaSignIn";

// Class used as a base for verifying Idena age
abstract class IdenaAgeProvider implements Provider {
  minAge: number;

  // The type will be determined dynamically, from the minAge parameter passed in to the constructor
  type = "";

  // Options can be set here and/or via the constructor
  _options = {};

  // construct the provider instance with supplied options and minAge
  constructor(options: ProviderOptions = {}, minAge: number) {
    this._options = { ...this._options, ...options };
    this.type = `IdenaAge#${minAge}`;
    this.minAge = minAge;
  }

  // verify that the proof object contains valid === "true"
  async verify(payload: RequestPayload, context: IdenaContext): Promise<VerifiedPayload> {
    const token = payload.proofs.sessionKey;
    const { valid, address, expiresInSeconds } = await checkAge(token, context, this.minAge);
    if (!valid) {
      return { valid: false };
    }
    return {
      valid: true,
      record: {
        address: address,
        age: `gt${this.minAge}`,
      },
      expiresInSeconds: expiresInSeconds,
    };
  }
}

// Export an Idena provider that verifies that an identity age >= 5 epochs
export class IdenaAge5Provider extends IdenaAgeProvider {
  constructor(options: ProviderOptions = {}) {
    super(options, 5);
  }
}

// Export an Idena provider that verifies that an identity age >= 10 epochs
export class IdenaAge10Provider extends IdenaAgeProvider {
  constructor(options: ProviderOptions = {}) {
    super(options, 10);
  }
}

const checkAge = async (
  token: string,
  context: IdenaContext,
  min: number
): Promise<{ valid: boolean; address?: string; expiresInSeconds?: number }> => {
  try {
    const result = await requestIdentityAge(token, context);
    const expiresInSeconds = Math.max((new Date(result.expirationDate).getTime() - new Date().getTime()) / 1000, 0);
    return { valid: result.age > min, address: result.address, expiresInSeconds };
  } catch {
    return { valid: false };
  }
};
