import * as logger from "./logger.js";

export const humanNetworkOprf = async ({
  value,
  clientPrivateKey,
  relayUrl,
}: {
  value: string;
  clientPrivateKey: string;
  relayUrl: string;
}): Promise<string> => {
  const signerUrl = process.env.HN_SIGNER_URL;
  
  if (!signerUrl) {
    throw new Error("HN_SIGNER_URL environment variable is required");
  }

  try {
    const response = await fetch(`${signerUrl}/sign`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        value,
      }),
    });

    if (!response.ok) {
      throw new Error(`HN Signer request failed: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    
    if (!result.signature) {
      throw new Error("Invalid response from HN Signer: missing signature");
    }

    return result.signature;
  } catch (error) {
    logger.error("Error calling HN Signer service:", error);
    throw error;
  }
};
