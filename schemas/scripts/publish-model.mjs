import { readFile, writeFile } from "node:fs/promises";
import { CeramicClient } from "@ceramicnetwork/http-client";
import { ModelManager } from "@glazed/devtools";

// Connect to the local Ceramic node
const ceramic = new CeramicClient("http://localhost:7007");

// Load and create a manager for the model
const bytes = await readFile(new URL("create-model.json", import.meta.url));
const manager = ModelManager.fromJSON(ceramic, JSON.parse(bytes.toString()));

// Write model to JSON file
const model = await manager.toPublished();
await writeFile(
  new URL("publish-model.json", import.meta.url),
  JSON.stringify(model)
);

console.log("Model written to publish-model.json file:", model);
