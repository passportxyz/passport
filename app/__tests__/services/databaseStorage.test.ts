import { Passport } from "@dpopp/types";
import { LocalStorageDatabase } from "../../services/databaseStorage";
import "jest-localstorage-mock";
import {
  passportFixture,
  simpleStampFixture,
} from "../../__test-fixtures__/databaseStorageFixtures";

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
    const actualPassport = localStorageDatabase.getPassport(
      localStorageDatabase.passportKey
    );

    expect(localStorage.getItem).toBeCalled();
    expect(actualPassport).toEqual(undefined);
  });

  it("addStamp creates a passport with a stamp", () => {
    const did = localStorageDatabase.passportKey;

    localStorageDatabase.addStamp(did, simpleStampFixture);

    const finalPassport = JSON.parse(
      localStorage.__STORE__[did] as string
    ) as Passport;
    expect(finalPassport.stamps).toHaveLength(1);
    expect(finalPassport.stamps).toContainEqual(simpleStampFixture);
    expect(localStorage.setItem).toHaveBeenCalled();
  });
});

describe("when there is an existing passport for the given did", () => {
  beforeEach(() => {
    localStorage.__STORE__[localStorageDatabase.passportKey] =
      JSON.stringify(passportFixture);
  });

  // what happens if you try to create a passport for the same key?

  it("getPassport retrieves the passport from localstorage", () => {
    const actualPassport = localStorageDatabase.getPassport(
      localStorageDatabase.passportKey
    );

    expect(localStorage.getItem).toBeCalledTimes(1);
    expect(actualPassport).toEqual(passportFixture);
  });

  it("addStamp adds a stamp to the passport", () => {
    const did = localStorageDatabase.passportKey;

    localStorageDatabase.addStamp(did, simpleStampFixture);

    // verify passport has new stamp
    const expectedPassport: Passport = {
      ...passportFixture,
      stamps: [...passportFixture.stamps, simpleStampFixture],
    };

    const finalPassport = JSON.parse(
      localStorage.__STORE__[did] as string
    ) as Passport;
    expect(finalPassport.stamps).toHaveLength(
      passportFixture.stamps.length + 1
    );
    expect(finalPassport.stamps).toContainEqual(simpleStampFixture);
    expect(localStorage.setItem).toHaveBeenLastCalledWith(
      did,
      JSON.stringify(expectedPassport)
    );
  });
});
