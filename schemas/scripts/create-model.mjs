import { writeFile } from "node:fs/promises";
import { CeramicClient } from "@ceramicnetwork/http-client";
import { ModelManager } from "@glazed/devtools";
import { DID } from "dids";
import { Ed25519Provider } from "key-did-provider-ed25519";
import { getResolver } from "key-did-resolver";
import { fromString } from "uint8arrays";
import Passport from "../models/Passports.json" assert { type: "json" };
import VerifiableCredentials from "../models/VerifiableCredentials.json" assert { type: "json" };

// import 'dotenv/config' // see https://github.com/motdotla/dotenv#how-do-i-use-dotenv-with-import
import dotenv from "dotenv";
dotenv.config();

const models = [Passport, VerifiableCredentials];

let SEED = process.env.SEED;

if (!process.env.SEED) {
  // throw new Error('Missing SEED environment variable');
  // SEED = new Uint32Array(32);
  SEED = new Uint8Array([
    6, 190, 125, 152, 83, 9, 111, 202, 6, 214, 218, 146, 104, 168, 166, 110,
    202, 171, 42, 114, 73, 204, 214, 60, 112, 254, 173, 151, 170, 254, 250, 2,
  ]);
}
console.log("VIEW SEE ", SEED, SEED.length);
// The seed must be provided as an environment variable
// const seed = fromString(process.env.SEED, 'base16');
// const seed = fromString(SEED, 'base16');
// Create and authenticate the DID
const did = new DID({
  provider: new Ed25519Provider(SEED),
  resolver: getResolver(),
});
await did.authenticate();

// Connect to the local Ceramic node
const ceramic = new CeramicClient("http://localhost:7007");
ceramic.did = did;

// Create a manager for the model
const manager = new ModelManager(ceramic);

// read in files from models directory
models.forEach(async (model) => {
  // Pass in schema name and json
  const schemaId = await manager.createSchema(model.title, model);

  // Create the definition using the created schema ID
  await manager.createDefinition(model.title, {
    name: model.title,
    description: model.description,
    schema: manager.getSchemaURL(schemaId),
  });

  await writeFile(
    new URL("create-model.json", import.meta.url),
    JSON.stringify(manager.toJSON())
  );
});

console.log("Encoded model written to scripts/create-model.json file");
