// ---- Test subject
import { FractalIdProvider } from "../src/providers/fractalId";

import { RequestPayload } from "@gitcoin/passport-types";

// ----- Libs
import axios from "axios";

jest.mock("axios");

const mockedAxios = axios as jest.Mocked<typeof axios>;

describe("Attempt verification", function () {
  it("handles valid verification attempt", async () => {
    // TODO
  });
});
