// ---- Server
import express from 'express';
import cors from 'cors';

// ---- Types
import { Response } from 'express';
import { ChallengeRecord, MerkleRecord, Payload } from '@dpopp/types';

// ---- Generate & Verify methods
import * as DIDKit from '@dpopp/identity/dist/commonjs/didkit-node';
import { issueChallengeCredential, issueMerkleCredential, verifyCredential } from '@dpopp/identity/dist/commonjs';

// ---- Identity Provider Management
import { Providers } from './utils/providers';

// ---- Identity Providers
import { SimpleProvider } from './providers/simple';

// Initiate providers - new Providers should be registered in this array...
const providers = new Providers([
  // Example provider which verfies the payload when `payload.proofs.valid === "true"`
  new SimpleProvider(),
]);

// create the app and run on port
const app = express();
const port = 65535; // default port to listen on

// set cors to accept calls from anywhere
app.use(cors());

// parse JSON post bodys
app.use(express.json());

// return a JSON error response with a 400 status
const errorRes = (res: Response, error: string) => res.status(400).json({ error });

// @TODO - remove example key - this should be supplied by the .env
const key = JSON.stringify({
  kty: 'OKP',
  crv: 'Ed25519',
  x: 'a7wbszn1DfZ3I7-_zDkUXCgypcGxL_cpCSTYEPRYj_o',
  d: 'Z0hucmxRt1C22ygAXJ1arXwD9QlAA5tEPLb7qoXYDGY',
});

// expose challenge entry point
app.post('/api/v0.0.0/challenge', async (req, res) => {
  // get the payload from the JSON req body
  const payload = req.body.payload as Payload;
  // check for a valid payload
  if (payload.address && payload.type) {
    // check if the payload is valid against one of the providers
    const challenge = providers.getChallenge(payload);
    // check if the request was valid against Identity Providers
    if (challenge && challenge.valid === true) {
      // add additional fields to the record object so that we definitely produce a valid merkleTree
      const record = {
        // add fields to identify the bearer of the challenge
        type: payload.type,
        address: payload.address,
        // version as defined by entry point
        version: '0.0.0',
        // extend/overwrite with record returned from the provider
        ...(challenge?.record || {}),
      } as ChallengeRecord;

      // generate a VC for the given payload
      const credential = await issueChallengeCredential(DIDKit, key, record);

      // check error state and run safety check to ensure we're returning a valid VC
      if (credential.error || !(await verifyCredential(DIDKit, credential.credential))) {
        // return error msg indicating a failure producing VC
        return errorRes(res, 'Unable to produce a verifiable credential');
      }

      // return the verifiable credential
      return res.json(credential);
    } else {
      // return error message if an error present
      return errorRes(res, (challenge.error && challenge.error.join(', ')) || 'Unable to verify proofs');
    }
  }

  // error response
  return errorRes(res, 'Unable to verify payload');
});

// expose verify entry point
app.post('/api/v0.0.0/verify', async (req, res) => {
  // get the payload from the JSON req body
  const payload = req.body.payload as Payload;
  // check for a valid payload
  if (payload && payload.address && payload.type) {
    // check if the payload is valid against one of the providers
    const verified = providers.verify(payload);
    // check if the request was valid against Identity Providers
    if (verified && verified?.valid === true) {
      // add additional fields to the record object so that we definitely produce a valid merkleTree
      const record = {
        // add enough fields to ensure the merkleTree is always valid
        type: payload.type,
        address: payload.address,
        // version as defined by entry point
        version: '0.0.0',
        // extend/overwrite with record returned from the provider
        ...(verified?.record || {}),
      } as MerkleRecord;

      // generate a VC for the given payload
      const credential = await issueMerkleCredential(DIDKit, key, record);

      // check error state and run safety check to ensure we're returning a valid VC
      if (credential.error || !(await verifyCredential(DIDKit, credential.credential))) {
        // return error msg indicating a failure producing VC
        return errorRes(res, 'Unable to produce a verifiable credential');
      }

      // return the verifiable credential
      return res.json(credential);
    } else {
      // return error message if an error present
      return errorRes(res, (verified.error && verified.error.join(', ')) || 'Unable to verify proofs');
    }
  }

  // error response
  return errorRes(res, 'Unable to verify payload');
});

// start the Express server
app.listen(port, () => {
  console.log(`server started at http://localhost:${port}`);
});
