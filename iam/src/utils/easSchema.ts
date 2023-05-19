import { utils } from "ethers";
import { SchemaEncoder } from "@ethereum-attestation-service/eas-sdk";
import { VerifiableCredential } from "@gitcoin/passport-types";

const attestationSchemaEncoder = new SchemaEncoder("bytes32 provider, bytes32 hash");

export function encodeEasStamp(credential: VerifiableCredential): string {
  // We hash the provider to get a bytes32 value
  const providerValue = utils.keccak256(utils.toUtf8Bytes(credential.credentialSubject.provider));

  // We decode the hash to get back the original bytes32 value
  // The format of the hash is: v0.0.0:BASE64_ENCODED_BYTES32
  const hashValue = "0x" + Buffer.from(credential.credentialSubject.hash.split(":")[1], "base64").toString("hex");

  const encodedData = attestationSchemaEncoder.encodeData([
    { name: "provider", value: providerValue, type: "bytes32" },
    { name: "hash", value: hashValue, type: "bytes32" },
  ]);
  return encodedData;
}
