// ---- Base Provider instance that all Providers will inherit
import { Provider } from './provider';

// ---- Types
import { Payload, Challenge, Verification } from '@dpopp/types';

// ---- Return randomBytes as a challenge
import crypto from 'crypto';

// Collate all Providers to abstract verify logic
export class Providers {
  // collect providers against instance
  _providers: { [k: string]: Provider } = {};

  // construct an array of providers
  constructor(_providers: Provider[]) {
    // reduce unique entries into _providers object
    this._providers = _providers.reduce((providers, provider) => {
      if (!providers[provider._type]) {
        providers[provider._type] = provider;
      }

      return providers;
    }, {} as { [k: string]: Provider });
  }

  // request a challenge sig
  getChallenge(payload: Payload): Challenge {
    // @TODO - expand this to allow providers to set custom challanges?

    // check that we've been provided an address for the challenge
    if (payload.address) {
      // valid payload - create a challenge string
      return {
        valid: true,
        record: {
          challenge: crypto.randomBytes(32).toString('hex'),
          address: payload.address,
          type: payload.type,
        },
      };
    } else {
      // unable to create a challenge without address
      return {
        valid: false,
        error: ['Missing address'],
      };
    }
  }

  // Given the payload is valid return the response of the selected Providers verification proceedure
  verify(payload: Payload): Verification {
    // collect provider from options
    const provider = this._providers[payload.type];

    // if a provider is available - use it to verify the payload
    if (provider) {
      // return the verification response
      return provider.verify(payload);
    }

    // unable to verify without provider
    return {
      valid: false,
      error: ['Missing provider'],
    };
  }
}
