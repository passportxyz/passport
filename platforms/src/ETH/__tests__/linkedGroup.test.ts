import axios from "axios";
import { getLinkedGroup } from "../Providers/linkedGroup.js";

jest.mock("axios");
const mockedAxios = axios as jest.Mocked<typeof axios>;

const WAAP = "0x" + "1".repeat(40);
const LINKED = "0x" + "b".repeat(40);

const answer = (data: unknown) => mockedAxios.get.mockResolvedValueOnce({ data });

describe("getLinkedGroup", () => {
  const saved = { url: process.env.SILK_AUTH_SERVER_URL, key: process.env.SILK_SERVICE_API_KEY };

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SILK_AUTH_SERVER_URL = "https://auth.waap.test/";
    process.env.SILK_SERVICE_API_KEY = "svc-key";
  });

  afterAll(() => {
    if (saved.url === undefined) delete process.env.SILK_AUTH_SERVER_URL;
    else process.env.SILK_AUTH_SERVER_URL = saved.url;
    if (saved.key === undefined) delete process.env.SILK_SERVICE_API_KEY;
    else process.env.SILK_SERVICE_API_KEY = saved.key;
  });

  it("returns the group for its WaaP address, with the service key and a short timeout", async () => {
    answer({ addresses: [WAAP, LINKED], waapAddress: WAAP, cooldownSeconds: 300 });

    expect(await getLinkedGroup(WAAP)).toEqual({
      addresses: [WAAP, LINKED],
      waapAddress: WAAP,
      cooldownSeconds: 300,
    });
    expect(mockedAxios.get).toHaveBeenCalledWith(
      `https://auth.waap.test/api/public/linked-wallets/by-address/${WAAP}`,
      {
        headers: { "X-Service-Key": "svc-key" },
        timeout: 2_000,
      }
    );
  });

  // A linked wallet never holds a credential earned from another wallet's
  // activity, so only the WaaP address is scored with the group.
  it("is null for a linked wallet that isn't the WaaP address", async () => {
    answer({ addresses: [WAAP, LINKED], waapAddress: WAAP });
    expect(await getLinkedGroup(LINKED)).toBeNull();
  });

  it("is null when the account has no stored WaaP address", async () => {
    answer({ addresses: [WAAP, LINKED], waapAddress: null });
    expect(await getLinkedGroup(WAAP)).toBeNull();
  });

  it("is null for a group of one", async () => {
    answer({ addresses: [WAAP], waapAddress: WAAP });
    expect(await getLinkedGroup(WAAP)).toBeNull();
  });

  it("is null when the WaaP address isn't in its own list", async () => {
    answer({ addresses: [LINKED, "0x" + "c".repeat(40)], waapAddress: WAAP });
    expect(await getLinkedGroup(WAAP)).toBeNull();
  });

  it("is null on a failed or malformed lookup", async () => {
    mockedAxios.get.mockRejectedValueOnce(new Error("timeout"));
    expect(await getLinkedGroup(WAAP)).toBeNull();
    answer({ addresses: "nope", waapAddress: WAAP });
    expect(await getLinkedGroup(WAAP)).toBeNull();
    answer(undefined);
    expect(await getLinkedGroup(WAAP)).toBeNull();
  });

  it("doesn't call WaaP when it isn't configured", async () => {
    delete process.env.SILK_SERVICE_API_KEY;
    expect(await getLinkedGroup(WAAP)).toBeNull();
    expect(mockedAxios.get).not.toHaveBeenCalled();
  });

  it("ignores a missing or invalid cooldown", async () => {
    answer({ addresses: [WAAP, LINKED], waapAddress: WAAP, cooldownSeconds: -5 });
    expect((await getLinkedGroup(WAAP))?.cooldownSeconds).toBeUndefined();
  });
});
