import axios from "axios";
import * as logger from "./logger.js";

export const humanNetworkOprf = async ({ value }: { value: string }): Promise<string> => {
  const signerUrl = process.env.HN_SIGNER_URL;

  if (!signerUrl) {
    throw new Error("HN_SIGNER_URL environment variable is required");
  }

  try {
    const response = await axios.post(
      `${signerUrl}/sign`,
      {
        value,
      },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.data.signature) {
      throw new Error("Invalid response from HN Signer: missing signature");
    }

    return response.data.signature;
  } catch (error) {
    logger.error("Error calling HN Signer service:", error);
    throw error;
  }
};
