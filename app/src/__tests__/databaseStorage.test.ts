/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/unbound-method */
import { Passport, VerifiableCredential } from "@dpopp/types";
import { LocalStorageDatabase } from "../services/databaseStorage";
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

it("should create a passport in localstorage", () => {
  const actualDID = localStorageDatabase.createPassport();

  expect(localStorage.setItem).toBeCalled();
  expect(actualDID).toEqual(localStorageDatabase.passportKey);
});

it("should get a passport from localstorage", () => {
  const expectedPassport: Passport = {
    issuanceDate: new Date(),
    expiryDate: new Date(),
    stamps: [{ provider: "Test", credential: {} as unknown as VerifiableCredential }],
  };

  localStorage.__STORE__[localStorageDatabase.passportKey] = JSON.stringify(expectedPassport);
  const actualPassport = localStorageDatabase.getPassport(localStorageDatabase.passportKey);

  expect(localStorage.getItem).toBeCalled();
  expect(actualPassport).toEqual(expectedPassport);
});

it("if there is no passport, then return undefined", () => {
  const actualPassport = localStorageDatabase.getPassport(localStorageDatabase.passportKey);

  expect(localStorage.getItem).toBeCalled();
  expect(actualPassport).toEqual(undefined);
});

it("should add a stamp to passport", () => {
  // set up test assumptions / environment
  const did = localStorageDatabase.passportKey;
  const expirationDate = new Date();
  expirationDate.setFullYear(expirationDate.getFullYear() + 1);
  const initialPassport: Passport = {
    issuanceDate: new Date(),
    expiryDate: expirationDate,
    stamps: [],
  };

  localStorage.__STORE__[did] = JSON.stringify(initialPassport);

  // call addStamp
  const stampToAdd = { provider: "AddStamp", credential: {} as unknown as VerifiableCredential };
  localStorageDatabase.addStamp(did, stampToAdd);

  // verify passport has new stamp
  const expectedPassport: Passport = {
    ...initialPassport,
    stamps: [{ provider: "AddStamp", credential: {} as unknown as VerifiableCredential }],
  };

  // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
  const finalPassport = JSON.parse(localStorage.__STORE__[did] as string) as Passport;
  expect(finalPassport.stamps).toHaveLength(1);
  expect(finalPassport.stamps[0]).toEqual(stampToAdd);
  expect(localStorage.setItem).toHaveBeenCalledWith(did, JSON.stringify(expectedPassport));
});
