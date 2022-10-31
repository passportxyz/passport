// ----- Types
import { RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
import { Provider, ProviderOptions } from "../../types";

// ----- Idena SignIn library
import { requestIdentityAge } from "../procedures/idenaSignIn";

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
  async verify(payload: RequestPayload): Promise<VerifiedPayload> {
    const { valid, address, expiresInSeconds } = await checkAge(payload.proofs.token, this.minAge);
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
  min: number
): Promise<{ valid: boolean; address?: string; expiresInSeconds?: number }> => {
  try {
    const result = await requestIdentityAge(token);
    const expiresInSeconds = Math.max((new Date(result.expirationDate).getTime() - new Date().getTime()) / 1000);
    return { valid: result.age > min, address: result.address, expiresInSeconds };
  } catch (e) {
    return { valid: false };
  }
};
