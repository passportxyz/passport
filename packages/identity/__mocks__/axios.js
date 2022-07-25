// IAM challenge response
const MOCK_CHALLENGE_VALUE = "this is a challenge";
const MOCK_CHALLENGE_CREDENTIAL = {
  credentialSubject: {
    challenge: "this is a challenge",
  },
};
const MOCK_CHALLENGE_RESPONSE_BODY = {
  credential: MOCK_CHALLENGE_CREDENTIAL,
};

// IAM verify response
const MOCK_VERIFY_RESPONSE_BODY = {
  credential: { type: ["VerifiableCredential"] },
  record: {
    type: "test",
    address: "0xmyAddress",
  },
};

const clearAxiosMocks = () => {
  post.mockClear();
};

const post = jest.fn(async (url, data) => {
  if (url.endsWith("/challenge")) {
    return {
      data: MOCK_CHALLENGE_RESPONSE_BODY,
    };
  }

  if (url.endsWith("/verify")) {
    return {
      data: MOCK_VERIFY_RESPONSE_BODY,
    };
  }

  throw Error("This endpoint is not set up!");
});

module.exports = {
  post,

  /* Mock values and helpers */
  clearAxiosMocks,
  MOCK_CHALLENGE_VALUE,
  MOCK_CHALLENGE_CREDENTIAL,
  MOCK_CHALLENGE_RESPONSE_BODY,
  MOCK_VERIFY_RESPONSE_BODY,
};
