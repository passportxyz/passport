import axios from "axios";
import { utils } from "ethers";
import { BigNumber } from "@ethersproject/bignumber";
import { SchemaEncoder, ZERO_BYTES32, NO_EXPIRATION } from "@ethereum-attestation-service/eas-sdk";
import { VerifiableCredential } from "@gitcoin/passport-types";

const attestationSchemaEncoder = new SchemaEncoder("bytes32 provider, bytes32 hash");

export function encodeEasStamp(credential: VerifiableCredential): string {
  const encodedData = attestationSchemaEncoder.encodeData([
    { name: "provider", value: credential.credentialSubject.provider, type: "bytes32" },
    { name: "hash", value: credential.credentialSubject.hash, type: "bytes32" },
  ]);
  return encodedData;
}
