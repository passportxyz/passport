module.exports = {
  post: async (url, data) => {
    switch (url) {
      case "/vbad/challenge":
        return {
          data: {
            credential: {
              credentialSubject: {},
            },
          },
        };
      case "/vbad/verify":
        return {
          data: {
            credential: {},
            record: {},
          },
        };
      case "/v0.0.0/challenge":
        return {
          data: {
            credential: {
              credentialSubject: {
                challenge: "this is a challenge",
              },
            },
          },
        };
      case "/v0.0.0/verify":
        return {
          data: {
            credential: {},
            record: {},
          },
        };
    }
  },
};
