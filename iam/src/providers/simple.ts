// ----- Types
import { Payload, Verification } from "@dpopp/types";

// ---- Base Provider
import { Provider } from "../utils/provider";

// Export a simple Provider as an example
export class SimpleProvider extends Provider {
  // Give the provider a type so that we can select it with a payload
  _type = "Simple";
  // Options can be set here and/or via the constructor
  _options = {
    valid: "true",
  };

  // construct this and its super
  constructor(options: { [k: string]: any } = {}) {
    // construct Provider
    super();
    // set options against this instance
    this.setOptions(options);
  }

  // verify that the proof object contains valid === "true"
  verify(payload: Payload): Verification {
    return {
      valid: payload?.proofs?.valid === this._options.valid,
      record: {
        username: payload?.proofs?.username || "",
      },
    };
  }
}
