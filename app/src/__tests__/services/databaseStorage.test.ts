/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
import { Passport, VerifiableCredential } from "@dpopp/types";
import { LocalStorageDatabase } from "../../services/databaseStorage";
import "jest-localstorage-mock";

const localStorageDatabase = new LocalStorageDatabase("testaddress");

beforeEach(() => {
  localStorage.clear();
  // and reset all mocks
  jest.clearAllMocks();
});

afterAll(() => {
  localStorage.clear();
  // and reset all mocks
  jest.clearAllMocks();
});

describe("when there is no passport for the given did", () => {
  it("createPassport creates a passport in localstorage", () => {
    const actualDID = localStorageDatabase.createPassport();

    expect(localStorage.setItem).toBeCalled();
    expect(actualDID).toEqual(localStorageDatabase.passportKey);
  });

  it("getPassport returns undefined", () => {
    const actualPassport = localStorageDatabase.getPassport(localStorageDatabase.passportKey);

    expect(localStorage.getItem).toBeCalled();
    expect(actualPassport).toEqual(undefined);
  });

  it("addStamp creates a passport with a stamp", () => {
    const did = localStorageDatabase.passportKey;
    const stampToAdd = { provider: "AddStamp", credential: {} as unknown as VerifiableCredential };

    localStorageDatabase.addStamp(did, stampToAdd);

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const finalPassport = JSON.parse(localStorage.__STORE__[did] as string) as Passport;
    expect(finalPassport.stamps).toHaveLength(1);
    expect(finalPassport.stamps).toContainEqual(stampToAdd);
    expect(localStorage.setItem).toHaveBeenCalled();
  });
});

describe("when there is an existing passport for the given did", () => {
  const initialPassport: Passport = {
    issuanceDate: new Date("2022-01-01"),
    expiryDate: new Date("2022-01-02"),
    stamps: [{ provider: "Test", credential: {} as unknown as VerifiableCredential }],
  };

  beforeEach(() => {
    localStorage.__STORE__[localStorageDatabase.passportKey] = JSON.stringify(initialPassport);
  });

  // what happens if you try to create a passport for the same key?

  it("getPassport retrieves the passport from localstorage", () => {
    const actualPassport = localStorageDatabase.getPassport(localStorageDatabase.passportKey);

    expect(localStorage.getItem).toBeCalledTimes(1);
    expect(actualPassport).toEqual(initialPassport);
  });

  it("addStamp adds a stamp to the passport", () => {
    const did = localStorageDatabase.passportKey;

    const stampToAdd = { provider: "AddStamp", credential: {} as unknown as VerifiableCredential };
    localStorageDatabase.addStamp(did, stampToAdd);

    // verify passport has new stamp
    const expectedPassport: Passport = {
      ...initialPassport,
      stamps: [...initialPassport.stamps, stampToAdd],
    };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const finalPassport = JSON.parse(localStorage.__STORE__[did] as string) as Passport;
    expect(finalPassport.stamps).toHaveLength(initialPassport.stamps.length + 1);
    expect(finalPassport.stamps).toContainEqual(stampToAdd);
    expect(localStorage.setItem).toHaveBeenLastCalledWith(did, JSON.stringify(expectedPassport));
  });
});
