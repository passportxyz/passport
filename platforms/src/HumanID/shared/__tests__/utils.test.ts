import { validateSbt, validateAttestation, isHexString, isAddress } from "../utils.js";

describe("isHexString", () => {
  it("should return true for strings starting with 0x", () => {
    expect(isHexString("0x1234567890123456789012345678901234567890")).toBe(true);
    expect(isHexString("0xaBcDeF1234567890123456789012345678901234")).toBe(true);
    expect(isHexString("0x123")).toBe(true);
    expect(isHexString("0x")).toBe(true);
  });

  it("should return false for strings not starting with 0x", () => {
    expect(isHexString("1234567890123456789012345678901234567890")).toBe(false);
    expect(isHexString("not-a-hex-string")).toBe(false);
    expect(isHexString("")).toBe(false);
  });
});

describe("isAddress", () => {
  it("should return true for valid Ethereum addresses", () => {
    expect(isAddress("0x1234567890123456789012345678901234567890")).toBe(true);
    expect(isAddress("0xaBcDeF1234567890123456789012345678901234")).toBe(true);
  });

  it("should return false for invalid addresses", () => {
    expect(isAddress("1234567890123456789012345678901234567890")).toBe(false);
    expect(isAddress("0x123")).toBe(false);
    expect(isAddress("not-a-hex-string")).toBe(false);
    expect(isAddress("")).toBe(false);
    expect(isAddress("0x")).toBe(false);
  });
});

describe("validateSbt", () => {
  describe("valid SBTs", () => {
    it("should return valid for SBT with correct publicValues", () => {
      const sbt = {
        expiry: BigInt(Math.floor(Date.now() / 1000) + 3600), // 1 hour from now
        publicValues: [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5)],
        revoked: false,
      };

      const result = validateSbt(sbt);
      expect(result.valid).toBe(true);
    });

    it("should return valid for SBT with more than 5 publicValues", () => {
      const sbt = {
        expiry: BigInt(Math.floor(Date.now() / 1000) + 3600),
        publicValues: [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5), BigInt(6)],
        revoked: false,
      };

      const result = validateSbt(sbt);
      expect(result.valid).toBe(true);
    });
  });

  describe("invalid SBTs", () => {
    it("should return invalid for null SBT", () => {
      const result = validateSbt(null);
      expect(result.valid).toBe(false);
      expect((result as any).error).toBe("SBT not found");
    });

    it("should return invalid for SBT with insufficient publicValues", () => {
      const sbt = {
        expiry: BigInt(Math.floor(Date.now() / 1000) + 3600),
        publicValues: [BigInt(1), BigInt(2)], // Only 2 values
        revoked: false,
      };

      const result = validateSbt(sbt);
      expect(result.valid).toBe(false);
      expect((result as any).error).toBe("Invalid SBT public values");
    });

    it("should return invalid for SBT with empty publicValues", () => {
      const sbt = {
        expiry: BigInt(Math.floor(Date.now() / 1000) + 3600),
        publicValues: [] as bigint[],
        revoked: false,
      };

      const result = validateSbt(sbt);
      expect(result.valid).toBe(false);
      expect((result as any).error).toBe("Invalid SBT public values");
    });

    it("should return invalid for expired SBT (using <= comparison)", () => {
      const sbt = {
        expiry: BigInt(Math.floor(Date.now() / 1000) - 3600), // 1 hour ago
        publicValues: [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5)],
        revoked: false,
      };

      const result = validateSbt(sbt);
      expect(result.valid).toBe(false);
      expect((result as any).error).toBe("SBT has expired");
    });

    it("should return invalid for SBT expiring exactly now", () => {
      const currentTime = BigInt(Math.floor(Date.now() / 1000));
      const sbt = {
        expiry: currentTime,
        publicValues: [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5)],
        revoked: false,
      };

      const result = validateSbt(sbt);
      expect(result.valid).toBe(false);
      expect((result as any).error).toBe("SBT has expired");
    });

    it("should return invalid for revoked SBT", () => {
      const sbt = {
        expiry: BigInt(Math.floor(Date.now() / 1000) + 3600),
        publicValues: [BigInt(1), BigInt(2), BigInt(3), BigInt(4), BigInt(5)],
        revoked: true,
      };

      const result = validateSbt(sbt);
      expect(result.valid).toBe(false);
      expect((result as any).error).toBe("SBT has been revoked");
    });
  });
});

describe("validateAttestation", () => {
  describe("valid attestations", () => {
    it("should return valid for attestation with indexingValue", () => {
      const attestation = {
        indexingValue: "valid-index-123",
        // other attestation fields...
      } as any;

      const result = validateAttestation(attestation);
      expect(result.valid).toBe(true);
    });
  });

  describe("invalid attestations", () => {
    it("should return invalid for null attestation", () => {
      const result = validateAttestation(null);
      expect(result.valid).toBe(false);
      expect((result as any).error).toBe("Attestation not found");
    });

    it("should return invalid for attestation without indexingValue", () => {
      const attestation = {
        // no indexingValue
      } as any;

      const result = validateAttestation(attestation);
      expect(result.valid).toBe(false);
      expect((result as any).error).toBe("Invalid attestation - missing indexingValue");
    });

    it("should return invalid for attestation with null indexingValue", () => {
      const attestation = {
        indexingValue: null,
      } as any;

      const result = validateAttestation(attestation);
      expect(result.valid).toBe(false);
      expect((result as any).error).toBe("Invalid attestation - missing indexingValue");
    });

    it("should return invalid for attestation with empty indexingValue", () => {
      const attestation = {
        indexingValue: "",
      } as any;

      const result = validateAttestation(attestation);
      expect(result.valid).toBe(false);
      expect((result as any).error).toBe("Invalid attestation - missing indexingValue");
    });
  });
});
