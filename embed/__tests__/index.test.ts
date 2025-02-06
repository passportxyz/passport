// TODO: geri fix the tests

describe("POST /challenge", function () {
  it("Dummy tests", async () => {});
});


// ---- Testing libraries

// import request from "supertest";
// import { Response, Request } from "express";
// import { apiKeyRateLimit, keyGenerator } from "../src/rate-limiter.js";
// import {
//   AutoVerificationResponseBodyType,
//   AutoVerificationRequestBodyType,
//   autoVerificationHandler,
// } from "../src/handlers.js";
// import { ParamsDictionary } from "express-serve-static-core";
// import { PassportScore } from "@gitcoin/passport-identity";

// const mockedScore: PassportScore = {
//   address: "0x0000000000000000000000000000000000000000",
//   score: "12",
//   passing_score: true,
//   last_score_timestamp: new Date().toISOString(),
//   expiration_timestamp: new Date().toISOString(),
//   threshold: "20.000",
//   error: "",
//   stamps: { "provider-1": { score: "12", dedup: true, expiration_date: new Date().toISOString() } },
// };

// jest.mock("../src/rate-limiter", () => {
//   const originalModule = jest.requireActual<typeof import("../src/rate-limiter.js")>("../src/rate-limiter");

//   return {
//     ...originalModule,
//     apiKeyRateLimit: jest.fn((req, res) => {
//       return new Promise((resolve, reject) => {
//         resolve(10000);
//       });
//     }),
//     keyGenerator: jest.fn(originalModule.keyGenerator),
//   };
// });

// jest.mock("../src/handlers", () => {
//   const originalModule = jest.requireActual<typeof import("../src/handlers.js")>("../src/handlers");

//   return {
//     // __esModule: true, // Use it when dealing with esModules
//     ...originalModule,
//     autoVerificationHandler: jest.fn(
//       (
//         req: Request<ParamsDictionary, AutoVerificationResponseBodyType, AutoVerificationRequestBodyType>,
//         res: Response
//       ): Promise<void> => {
//         return new Promise((resolve, reject) => {
//           res.status(200).json(mockedScore);
//           resolve();
//         });
//       }
//     ),
//   };
// });

// import { app } from "../src/index.js";

// beforeEach(() => {
//   // CLear the spy stats
//   jest.clearAllMocks();
// });

// describe("autoVerificationHandler", function () {
//   it("handles valid verify requests", async () => {
//     // as each signature is unique, each request results in unique output
//     const payload = {
//       address: "0x0000000000000000000000000000000000000000",
//       scorerId: "123",
//     };

//     // create a req against the express app
//     const verifyRequest = await request(app)
//       .post("/embed/verify")
//       .send(payload)
//       .set("Accept", "application/json")
//       .set("X-API-KEY", "MY.SECRET-KEY");

//     expect(apiKeyRateLimit as jest.Mock).toHaveBeenCalledTimes(1);
//     expect(keyGenerator as jest.Mock).toHaveBeenCalledTimes(1);
//     expect(autoVerificationHandler as jest.Mock).toHaveBeenCalledTimes(1);
//     expect(verifyRequest.status).toBe(200);
//     expect(verifyRequest.body).toStrictEqual(mockedScore);
//   });

//   it("handles invalid verify requests - missing api key", async () => {
//     // as each signature is unique, each request results in unique output
//     const payload = {
//       address: "0x0000000000000000000000000000000000000000",
//       scorerId: "123",
//     };

//     // create a req against the express app
//     const verifyRequest = await request(app).post("/embed/verify").send(payload).set("Accept", "application/json");

//     expect(apiKeyRateLimit as jest.Mock).toHaveBeenCalledTimes(0);
//     expect(keyGenerator as jest.Mock).toHaveBeenCalledTimes(1);
//     expect(verifyRequest.status).toBe(401);
//     expect(verifyRequest.body).toStrictEqual({ message: "Unauthorized! No 'X-API-KEY' present in the header!" });
//   });

//   it("handles invalid verify requests - api key validation fails", async () => {
//     // as each signature is unique, each request results in unique output
//     const payload = {
//       address: "0x0000000000000000000000000000000000000000",
//       scorerId: "123",
//     };

//     (apiKeyRateLimit as jest.Mock).mockImplementationOnce(() => {
//       throw "Invalid API-KEY";
//     });

//     // create a req against the express app
//     const verifyRequest = await request(app)
//       .post("/embed/verify")
//       .send(payload)
//       .set("Accept", "application/json")
//       .set("X-API-KEY", "MY.SECRET-KEY");

//     expect(apiKeyRateLimit as jest.Mock).toHaveBeenCalledTimes(1);
//     expect(keyGenerator as jest.Mock).toHaveBeenCalledTimes(1);
//     expect(verifyRequest.status).toBe(500);
//   });
// });

// describe("POST /health", function () {
//   it("handles valid health requests", async () => {
//     // create a req against the express app
//     const verifyRequest = await request(app).get("/health").set("Accept", "application/json");

//     expect(apiKeyRateLimit as jest.Mock).toHaveBeenCalledTimes(0);
//     expect(keyGenerator as jest.Mock).toHaveBeenCalledTimes(0);
//     expect(verifyRequest.status).toBe(200);
//     expect(verifyRequest.body).toStrictEqual({
//       message: "Ok",
//     });
//   });
// });
