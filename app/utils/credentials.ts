import { RequestPayload, IssuedChallenge, CredentialResponseBody, ValidResponseBody } from "@gitcoin/passport-types";

// --- Node/Browser http req library
import axios from "axios";

// Fetch a verifiable challenge credential
export const fetchChallengeCredential = async (iamUrl: string, payload: RequestPayload): Promise<IssuedChallenge> => {
  // fetch challenge as a credential from API that fits the version, address and type (this credential has a short ttl)
  const response: { data: CredentialResponseBody } = await axios.post(
    `${iamUrl.replace(/\/*?$/, "")}/v${payload.version}/challenge`,
    {
      payload: {
        address: payload.address,
        type: payload.type,
        // if an alt signer is being added pass it in to be included in the challenge string
        signer: payload.signer,
        signatureType: payload.signatureType,
      },
    }
  );

  const data = response.data;

  if ("error" in data && data.error) {
    console.error("Error fetching challenge credential", data.error);
    throw new Error("Unable to fetch challenge credential");
  } else {
    return {
      challenge: (data as ValidResponseBody).credential,
    } as IssuedChallenge;
  }
};

// Fetch a verifiableCredential
export const fetchVerifiableCredential = async (
  iamUrl: string,
  payload: RequestPayload,
  createSignedPayload: (data: any) => Promise<any>
): Promise<{ credentials: CredentialResponseBody[] }> => {
  console.log("fetchVerifiableCredential 1");
  // first pull a challenge that can be signed by the user
  const { challenge } = await fetchChallengeCredential(iamUrl, payload);

  console.log("fetchVerifiableCredential 2");
  // sign the challenge provided by the IAM
  const signedChallenge = challenge.credentialSubject.challenge
    ? await createSignedPayload(challenge.credentialSubject.challenge)
    : "";

  console.log("fetchVerifiableCredential 3");
  // must provide signature for message
  if (!signedChallenge) {
    throw new Error("Unable to sign message");
  }

  console.log("fetchVerifiableCredential 4");
  // fetch a credential from the API that fits the version, payload and passes the signature message challenge
  const response: { data: CredentialResponseBody | CredentialResponseBody[] } = await axios.post(
    `${iamUrl.replace(/\/*?$/, "")}/v${payload.version}/verify`,
    {
      payload,
      challenge,
      signedChallenge,
    }
  );

  console.log("fetchVerifiableCredential 5");
  // return everything that was used to create the credential (along with the credential)
  return {
    credentials: Array.isArray(response.data) ? response.data : [response.data],
  };
};
