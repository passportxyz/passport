export const createPassportMock = jest.fn();
export const getPassportMock = jest.fn().mockImplementation(() => {
  return {
    passport: {
      stamps: [],
    },
    errorDetails: {},
    status: "Success",
  };
});
export const addStampMock = jest.fn();
export const addStampsMock = jest.fn();
export const deleteStampMock = jest.fn();
export const deleteStampsMock = jest.fn();

export const CeramicDatabase = jest.fn().mockImplementation(() => {
  return {
    constructor() {
      return {
        createPassport: createPassportMock,
        getPassport: getPassportMock,
        addStamp: addStampMock,
        addStamps: addStampMock,
        deleteStamp: deleteStampMock,
        deleteStamps: deleteStampsMock,
      };
    },
  };
});

export const PassportDatabase = jest.fn().mockImplementation(() => {
  return {
    constructor() {
      return {
        createPassport: createPassportMock,
        getPassport: getPassportMock,
        addStamp: addStampMock,
        addStamps: addStampMock,
        deleteStamp: deleteStampMock,
        deleteStamps: deleteStampsMock,
      };
    },
  };
});
