import axios from "axios";
import { GrantsStackProvider, getGrantsStackData } from "../GrantsStack";
import { RequestPayload } from "@gitcoin/passport-types";

// Mocking axios
jest.mock("axios");

// Common setup
const userAddress = "0x123";
const requestPayload = { address: userAddress } as RequestPayload;

describe("GrantsStackProvider", () => {
  // Testing getGrantsStackData function
  describe("getGrantsStackData", () => {
    it("should fetch GrantsStack data successfully", async () => {
      // Mock the axios response
      (axios.get as jest.Mock).mockResolvedValue({
        data: { num_grants_contribute_to: 10, num_rounds_contribute_to: 5 },
      });
      const context = {};
      const result = await getGrantsStackData(requestPayload, context);
      expect(result).toEqual({ projectCount: 10, programCount: 5 });
    });

    it("should throw error when fetching GrantsStack data fails", async () => {
      // Mock an axios error
      (axios.get as jest.Mock).mockRejectedValue(new Error("Network Error"));
      const context = {};
      await expect(() => getGrantsStackData(requestPayload, context)).rejects.toThrow("Network Error");
    });
  });

  // Testing GrantsStackProvider class
  describe("verify method", () => {
    it("should verify GrantsStack data and return valid true if threshold is met", async () => {
      const providerId = "GrantsStack5Projects";
      const threshold = 5;
      const provider = new GrantsStackProvider({ type: providerId, threshold, dataKey: "projectCount" });
      // Using the previously tested getGrantsStackData, we'll assume it works as expected
      const verifiedPayload = await provider.verify(requestPayload, {
        grantsStack: { projectCount: 10, programCount: 1 },
      });
      expect(verifiedPayload).toMatchObject({
        valid: true,
        record: {
          address: userAddress,
          contributionStatistic: `${providerId}-${threshold}-contribution-statistic`,
        },
      });
    });

    it("should verify GrantsStack data and return valid false if threshold is not met", async () => {
      const projectCount = 10;
      const programCount = 1;
      const threshold = 15;
      const providerId = "GrantsStack5Projects";
      const provider = new GrantsStackProvider({ type: providerId, threshold, dataKey: "projectCount" });
      const verifiedPayload = await provider.verify(requestPayload, {
        grantsStack: { projectCount, programCount },
      });
      expect(verifiedPayload).toMatchObject({
        valid: false,
        record: undefined,
        errors: [`You do not qualify for this stamp -- projectCount: ${projectCount} is less than ${threshold}`],
      });
    });

    it("should throw an error if verification fails", async () => {
      const providerId = "GrantsStack5Projects";
      // Mock the axios response to throw an error in getGrantsStackData
      (axios.get as jest.Mock).mockRejectedValue(new Error("Network Error"));
      const provider = new GrantsStackProvider({ type: providerId, threshold: 5, dataKey: "projectCount" });
      await expect(() => provider.verify(requestPayload, {})).rejects.toThrow(
        "Grant Stack contribution verification error: Error: Network Error."
      );
    });
  });
});
