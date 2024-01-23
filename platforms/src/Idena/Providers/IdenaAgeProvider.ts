// ----- Types
import { ProviderContext, RequestPayload, VerifiedPayload } from "@gitcoin/passport-types";
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
  async verify(payload: RequestPayload, _context: ProviderContext): Promise<VerifiedPayload> {
    // TODO: geri review this
    const context = _context as IdenaContext;
    const token = payload.proofs.sessionKey;
    const { valid, address, expiresInSeconds, errors } = await checkAge(token, context, this.minAge);
    return {
      valid,
      record: {
        address,
        age: `gt${this.minAge}`,
      },
      errors,
      expiresInSeconds,
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
): Promise<{ valid: boolean; address?: string; expiresInSeconds?: number; errors?: string[] }> => {
  const result = await requestIdentityAge(token, context);
  const expiresInSeconds = Math.max((new Date(result.expirationDate).getTime() - new Date().getTime()) / 1000, 0);

  if (result.age > min) return { valid: true, address: result.address, expiresInSeconds };
  return { valid: false, errors: [`Idena age "${result.age}" is less than required age of "${min}" epochs`] };
};
