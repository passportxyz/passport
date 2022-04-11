import { Passport } from "@dpopp/types";
import { LocalStorageDatabase } from "../services/databaseStorage";

const setItemSpy = jest.spyOn(window.localStorage.__proto__, "setItem");
const getItemSpy = jest.spyOn(window.localStorage.__proto__, "getItem");

const localStorageDatabase = new LocalStorageDatabase("testaddress");

it("should create a passport in localstorage", () => {
  const actualDID = localStorageDatabase.createPassport();

  expect(setItemSpy).toBeCalled();
  expect(actualDID).toEqual(localStorageDatabase.passportKey);
});

it("should get a passport from localstorage", () => {
  const expectedPassport: Passport = {
    issuanceDate: new Date(),
    expiryDate: new Date(),
    stamps: [{ recordUserName: "myUsername", credentialIssuer: "gitcoin" }],
  };
  getItemSpy.mockReturnValue(JSON.stringify(expectedPassport));

  const actualPassport = localStorageDatabase.getPassport(localStorageDatabase.passportKey);

  expect(getItemSpy).toBeCalled();
  expect(actualPassport).toEqual(expectedPassport);
});

it("if there is no passport, then return undefined", () => {
  getItemSpy.mockReturnValue(null);

  const actualPassport = localStorageDatabase.getPassport(localStorageDatabase.passportKey);

  expect(getItemSpy).toBeCalled();
  expect(actualPassport).toEqual(undefined);
});
