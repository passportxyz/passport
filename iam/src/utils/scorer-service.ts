import axios from "axios";

import { VerifiableCredential } from "@gitcoin/passport-types";

export async function cacheCredential(credential: VerifiableCredential): Promise<void> {
  try {
    const did = credential.credentialSubject.id;
    const address = did.substring(did.indexOf("0x"));

    await axios.post(
      `${process.env.PASSPORT_SCORER_ENDPOINT}/ceramic-cache/stamp`,
      {
        address,
        provider: credential.credentialSubject.provider,
        stamp: JSON.stringify(credential),
      },
      {
        headers: {
          Authorization: `Basic ${process.env.PASSPORT_SCORER_BEARER_TOKEN}`,
        },
      }
    );
  } catch (e) {
    // TODO - Log error to DD?
    console.log({ e });
  }
}
