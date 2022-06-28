export const createPassportMock = jest.fn();
export const getPassportMock = jest.fn();
export const addStampMock = jest.fn();

export class CeramicDatabase {
  constructor() {
    return { createPassport: createPassportMock, getPassport: getPassportMock, addStamp: addStampMock };
  }
}
