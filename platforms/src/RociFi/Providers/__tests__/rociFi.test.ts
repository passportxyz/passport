/* eslint-disable */
// ---- Test subject
import { RociFiProvider } from "../rociFi";

import { RequestPayload } from "@gitcoin/passport-types";

const NFCS_OWNER = "0x644b862E6F8D8333E9d6c65FcD2f0Fa0674E899C";
const NFCS_NOT_OWNER = "0x0000000000000000000000000000000000000001";

describe("Attempt verification", function () {
  it("Should return valid NFCS ownership", async () => {
    const rociFiProvider = new RociFiProvider();

    const nfcsPayload = await rociFiProvider.verify({
      address: NFCS_OWNER,
    } as unknown as RequestPayload);

    expect(nfcsPayload).toEqual({
      valid: true,
      record: {
        address: NFCS_OWNER,
      },
    });
  });

  it("Should return invalid NFCS ownership", async () => {
    const rociFiProvider = new RociFiProvider();

    const nfcsPayload = await rociFiProvider.verify({
      address: NFCS_NOT_OWNER,
    } as unknown as RequestPayload);

    expect(nfcsPayload).toEqual({
      valid: false,
      record: undefined,
    });
  });
});
