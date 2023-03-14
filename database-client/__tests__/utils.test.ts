import { getTilesToCreate } from "../src/utils";
import { CeramicPassport } from "../src/ceramicClient";
import { Stamp } from "@gitcoin/passport-types";

describe('getTilesToCreate', () => {
  it('should return undefined when passport is not provided', () => {
    const stamps: Stamp[] = [];
    const did = 'did:test:123';
    const result = getTilesToCreate(stamps, did);
    expect(result).toBeUndefined();
  });

  it('should return stamps that are not already in the passport', () => {
    const stamp1 = {
      credential: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        credentialSubject: { hash: 'hash1' },
        issuanceDate: '2022-01-01T00:00:00Z',
      },
    } as Stamp;

    const stamp2 = {
      credential: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        credentialSubject: { hash: 'hash2' },
        issuanceDate: '2022-01-01T00:00:00Z',
      },
    } as Stamp;

    const passport = {
      stamps: [
        {
          credential: JSON.stringify(stamp1.credential),
        },
      ],
    } as CeramicPassport;

    const stamps: Stamp[] = [stamp1, stamp2];
    const did = 'did:test:123';

    const result = getTilesToCreate(stamps, did, passport);

    expect(result).toEqual([stamp2]);
  });

  it('should not return stamps that are already in the passport', () => {
    const stamp1 = {
      credential: {
        '@context': ['https://www.w3.org/2018/credentials/v1'],
        type: ['VerifiableCredential'],
        credentialSubject: { hash: 'hash1' },
        issuanceDate: '2022-01-01T00:00:00Z',
      },
    } as Stamp;

    const passport = {
      stamps: [
        {
          credential: JSON.stringify(stamp1.credential),
        },
      ],
    } as CeramicPassport;

    const stamps: Stamp[] = [stamp1];
    const did = 'did:test:123';

    const result = getTilesToCreate(stamps, did, passport);

    expect(result).toEqual([]);
  });
});