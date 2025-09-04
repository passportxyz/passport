import { SignProtocolAttestation } from "@holonym-foundation/human-id-sdk";

export function isHexString(value: string): value is `0x${string}` {
  return value.startsWith("0x") && value.length === 42;
}

export function validateSbt(
  sbt: { expiry: bigint; publicValues: bigint[]; revoked: boolean } | null
): { valid: true } | { valid: false; error: string } {
  if (!sbt) {
    return { valid: false, error: "SBT not found" };
  }

  // Check publicValues exist and have enough elements (nullifier is at index 3)
  if (!sbt.publicValues || !Array.isArray(sbt.publicValues) || sbt.publicValues.length < 5) {
    return { valid: false, error: "Invalid SBT public values" };
  }

  // Check expiry (use > not >=)
  const currentTime = BigInt(Math.floor(Date.now() / 1000));
  if (sbt.expiry <= currentTime) {
    return { valid: false, error: "SBT has expired" };
  }

  // Check revocation
  if (sbt.revoked) {
    return { valid: false, error: "SBT has been revoked" };
  }

  return { valid: true };
}

export function validateAttestation(
  attestation: SignProtocolAttestation | null
): { valid: true } | { valid: false; error: string } {
  if (!attestation) {
    return { valid: false, error: "Attestation not found" };
  }

  // Check that indexingValue exists (required for valid attestation)
  if (!attestation.indexingValue) {
    return { valid: false, error: "Invalid attestation - missing indexingValue" };
  }

  // Could add more checks here if needed (e.g., validUntil, revoked)

  return { valid: true };
}
