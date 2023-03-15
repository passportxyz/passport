import { Stamp, VerifiableCredential } from "@gitcoin/passport-types";
import { getTilesToCreate } from "../src/utils";

export const createStamp = (hash: string, issuanceDate: string) => ({
  credential: {
    '@context': ['https://www.w3.org/2018/credentials/v1'],
    type: ['VerifiableCredential'],
    credentialSubject: { hash } as any,
    issuanceDate,
  },
});

describe('getTilesToCreate', () => {
  const did = 'did:example:123456789abcdefghi';


  it('should return empty array if all stamps are already in existingStamps', () => {
    const stamps = [createStamp('hash1', '2022-01-01'), createStamp('hash2', '2022-01-02')] as Stamp[];
    const existingStamps = stamps;

    expect(getTilesToCreate(stamps, did, existingStamps)).toEqual([]);
  });

  it('should return all stamps if none of them are in existingStamps', () => {
    const stamps = [createStamp('hash1', '2022-01-01'), createStamp('hash2', '2022-01-02')] as Stamp[];
    const existingStamps: Stamp[] = [];

    expect(getTilesToCreate(stamps, did, existingStamps)).toEqual(stamps);
  });

  it('should return only new stamps not in existingStamps', () => {
    const stamp1 = createStamp('hash1', '2022-01-01');
    const stamp2 = createStamp('hash2', '2022-01-02');
    const stamp3 = createStamp('hash3', '2022-01-03');
    const stamps = [stamp1, stamp2, stamp3] as Stamp[];
    const existingStamps = [stamp1, stamp2] as Stamp[];

    expect(getTilesToCreate(stamps, did, existingStamps)).toEqual([stamp3]);
  });

  it('should return empty array if no stamps are provided', () => {
    const stamps: Stamp[] = [];
    const existingStamps: Stamp[] = [];

    expect(getTilesToCreate(stamps, did, existingStamps)).toEqual([]);
  });
});
