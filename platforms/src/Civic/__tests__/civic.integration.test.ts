import { RequestPayload } from "@gitcoin/passport-types";
import { CivicPassProvider } from "../Providers/civic";
import { CivicPassType } from "../Providers/types";

// Has a CAPTCHA pass on polygon mainnet
const userAddress = "0xE7a141e09D7943663B327C04A7d138eD63A5E916";
const requestPayload = { address: userAddress } as RequestPayload;

describe("Civic Pass Provider Integration Test", function () {
  // Warning - this tests the real world chain status and the real-world Civic endpoint
  it("should return valid true if a pass is found", async () => {
    const civic = new CivicPassProvider({
      type: "uniqueness",
      passType: CivicPassType.CAPTCHA,
    });
    const verifiedPayload = await civic.verify(requestPayload);

    expect(verifiedPayload).toMatchObject({
      valid: true,
    });
  });
});
