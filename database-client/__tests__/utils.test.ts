import { getTilesToCreate } from "../src/utils";

describe("getTilesToCreate", () => {
  it("should return undefined if passport is undefined", () => {
    const stamps = [];
    const did = "did:3:abc";
    const passport = undefined;
    const result = getTilesToCreate(stamps, did, passport);
    expect(result).toBeUndefined();
  });
});