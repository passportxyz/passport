import { handleAxiosError } from "@gitcoin/passport-platforms";
import { UnexpectedApiError } from "./helpers.js";
import axios from "axios";
import { VerifiableCredential, VerifiableEip712Credential } from "@gitcoin/passport-types";

const SCORER_ENDPOINT = process.env.SCORER_ENDPOINT;
const SCORER_API_KEY = process.env.SCORER_API_KEY;

type Revocation = {
  proof_value: string;
  is_revoked: boolean;
};

// Filters revoked credentials without throwing errors or
// returning info about filtered credentials
export const filterRevokedCredentials = async (
  credentials: VerifiableCredential[]
): Promise<VerifiableCredential[]> => {
  const proofValues = credentials
    .filter((credential): credential is VerifiableEip712Credential =>
      Boolean((credential as VerifiableEip712Credential).proof.proofValue)
    )
    .map((credential) => credential.proof.proofValue);

  const revocations = await fetchRevocations(proofValues);
  const revocationsByProofValue = revocations.reduce(
    (acc, revocation) => {
      acc[revocation.proof_value] = revocation;
      return acc;
    },
    {} as Record<string, Revocation>
  );

  return credentials.filter((credential) => {
    const proofValue = (credential as VerifiableEip712Credential).proof.proofValue;
    if (!proofValue) {
      return false;
    }

    const revocation = revocationsByProofValue[proofValue];

    return revocation && !revocation.is_revoked;
  });
};

const fetchRevocations = async (proofValues: string[]): Promise<Revocation[]> => {
  const payload = { proof_values: proofValues };

  console.log("Checking revocations", payload);

  try {
    const revocationResponse: {
      data?: Revocation[];
    } = await axios.post(`${SCORER_ENDPOINT}/internal/check-revocations`, payload, {
      headers: {
        Authorization: SCORER_API_KEY,
      },
    });

    return revocationResponse.data || [];
  } catch (e) {
    handleAxiosError(e, "Bans", UnexpectedApiError, [SCORER_API_KEY]);
  }
};
