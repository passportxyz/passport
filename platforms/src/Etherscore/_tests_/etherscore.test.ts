import { RequestPayload } from "@gitcoin/passport-types";
import * as Etherscore from "../Providers/Etherscore";

describe("Attempt verification", () => {
  const mockedResultBronze = 10;
  const mockRequestPayload: { address: string } = {
    address: "0x00525f7d6714043076e08d9e60a80d99924b6b79",
  };
  it("handles valid verification attempt", async () => {
    const getNumberOfBadgesMock = jest.spyOn(Etherscore, "getNumberOfBadges");
    getNumberOfBadgesMock.mockResolvedValue(mockedResultBronze);

    const etherscoreBronzeProvider = new Etherscore.EtherscoreBronzeProvider();
    const verifiedPayload = await etherscoreBronzeProvider.verify({
      address: "0x00525F7D6714043076e08d9e60a80d99924B6B79",
    } as unknown as RequestPayload);
    expect(getNumberOfBadgesMock).toHaveBeenCalledWith(mockRequestPayload.address);
    expect(verifiedPayload).toEqual({
      valid: true,
      record: {
        address: mockRequestPayload.address,
        numberOfBadges: "10",
      },
    });
    jest.restoreAllMocks();
  });

  it("handles invalid verification attempt where address is not proper ether address", async () => {
    const getNumberOfBadgesMock = jest.spyOn(Etherscore, "getNumberOfBadges").mockImplementationOnce(() => {
      throw new Error("Invalid ether address");
    });
    const etherscoreBronzeProvider = new Etherscore.EtherscoreBronzeProvider();

    const verifiedPayload = await etherscoreBronzeProvider.verify({
      address: "FAKE_ADDRESS",
    } as unknown as RequestPayload);

    expect(getNumberOfBadgesMock).toHaveBeenCalledWith("fake_address");
    expect(verifiedPayload).toEqual({
      valid: false,
      error: ["EtherscoreBronze provider get user handle error"],
    });
    jest.restoreAllMocks();
  });

  it("should return error response when getNumberOfBadges call throws an error", async () => {
    const getNumberOfBadgesMock = jest.spyOn(Etherscore, "getNumberOfBadges");
    getNumberOfBadgesMock.mockRejectedValue(new Error("some error"));
    const etherscoreBronzeProvider = new Etherscore.EtherscoreBronzeProvider();
    const verifiedPayload = await etherscoreBronzeProvider.verify({
      address: mockRequestPayload.address,
    } as unknown as RequestPayload);

    expect(getNumberOfBadgesMock).toBeCalledWith(mockRequestPayload.address);
    expect(verifiedPayload).toEqual({
      valid: false,
      error: ["EtherscoreBronze provider get user handle error"],
    });
    jest.restoreAllMocks();
  });
});

// All the negative case for thresholds are tested
describe("should return invalid payload", function () {
  const resultBelowBronze = 9;
  const resultBelowSilver = 19;
  const resultBelowGold = 29;
  const mockRequestPayload: { address: string } = {
    address: "0x00525f7d6714043076e08d9e60a80d99924b6b79",
  };
  it("when holded badges is below 10 badge for Bronze", async () => {
    const getNumberOfBadgesMock = jest.spyOn(Etherscore, "getNumberOfBadges");
    getNumberOfBadgesMock.mockResolvedValue(resultBelowBronze);
    const etherscoreBronzeProvider = new Etherscore.EtherscoreBronzeProvider();

    const verifiedPayload = await etherscoreBronzeProvider.verify({
      address: mockRequestPayload.address,
    } as unknown as RequestPayload);

    expect(verifiedPayload).toMatchObject({ valid: false });
    jest.restoreAllMocks();
  });
  it("when holded badges is below 20 badges for Silver", async () => {
    const getNumberOfBadgesMock = jest.spyOn(Etherscore, "getNumberOfBadges");
    getNumberOfBadgesMock.mockResolvedValue(resultBelowSilver);
    const etherscoreBronzeProvider = new Etherscore.EtherscoreSilverProvider();

    const verifiedPayload = await etherscoreBronzeProvider.verify({
      address: mockRequestPayload.address,
    } as unknown as RequestPayload);

    expect(verifiedPayload).toMatchObject({ valid: false });
    jest.restoreAllMocks();
  });
  it("when holded badges is below 30 badges for Gold", async () => {
    const getNumberOfBadgesMock = jest.spyOn(Etherscore, "getNumberOfBadges");
    getNumberOfBadgesMock.mockResolvedValue(resultBelowGold);
    const etherscoreBronzeProvider = new Etherscore.EtherscoreGoldProvider();

    const verifiedPayload = await etherscoreBronzeProvider.verify({
      address: mockRequestPayload.address,
    } as unknown as RequestPayload);

    expect(verifiedPayload).toMatchObject({ valid: false });
    jest.restoreAllMocks();
  });
});

// All the positive case for thresholds are tested
describe("should return valid payload", function () {
  const resultBronze = 10;
  const resultSilver = 20;
  const resultGold = 30;
  const mockRequestPayload: { address: string } = {
    address: "0x00525f7d6714043076e08d9e60a80d99924b6b79",
  };
  it("return true when holded badges is >= 10 badges for Bronze", async () => {
    const getNumberOfBadgesMock = jest.spyOn(Etherscore, "getNumberOfBadges");
    getNumberOfBadgesMock.mockResolvedValue(resultBronze);
    const etherscoreBronzeProvider = new Etherscore.EtherscoreBronzeProvider();

    const verifiedPayload = await etherscoreBronzeProvider.verify({
      address: mockRequestPayload.address,
    } as unknown as RequestPayload);

    expect(verifiedPayload).toMatchObject({ valid: true });
    jest.restoreAllMocks();
  });
  it("return true when holded badges is >= 20 badges for Silver", async () => {
    const getNumberOfBadgesMock = jest.spyOn(Etherscore, "getNumberOfBadges");
    getNumberOfBadgesMock.mockResolvedValue(resultSilver);
    const etherscoreBronzeProvider = new Etherscore.EtherscoreSilverProvider();

    const verifiedPayload = await etherscoreBronzeProvider.verify({
      address: mockRequestPayload.address,
    } as unknown as RequestPayload);

    expect(verifiedPayload).toMatchObject({ valid: true });
    jest.restoreAllMocks();
  });
  it("return true when holded badges is >= 30 badges for Gold", async () => {
    const getNumberOfBadgesMock = jest.spyOn(Etherscore, "getNumberOfBadges");
    getNumberOfBadgesMock.mockResolvedValue(resultGold);
    const etherscoreBronzeProvider = new Etherscore.EtherscoreGoldProvider();

    const verifiedPayload = await etherscoreBronzeProvider.verify({
      address: mockRequestPayload.address,
    } as unknown as RequestPayload);

    expect(verifiedPayload).toMatchObject({ valid: true });
    jest.restoreAllMocks();
  });
});
