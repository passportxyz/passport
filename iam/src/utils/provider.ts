// ----- Types
import { Payload, Verification } from '@dpopp/types';

// Base Provider which all Providers must extend
export class Provider {
  // This should be the name of the Identity Provider in TitleCase
  _type = 'Base';
  // Set of options to influence the verify procedure
  _options = {};

  // Add constructor so that typescript knows this is a constructable base
  constructor(options: { [k: string]: any } = {}) {
    // combine options with this._options
    this.setOptions(options);
  }

  // Set the options against the instance
  setOptions(options: { [k: string]: any } = {}) {
    this._options = { ...this._options, ...options };
  }

  // Verification should follow this signature
  verify(payload: Payload): Verification {
    return {
      valid: true,
      record: {},
    };
  }
}
