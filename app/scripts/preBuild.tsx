import dotenv from "dotenv";
dotenv.config();

import { writeFileSync } from "fs";
import { join } from "path";

import { platformsData } from "@gitcoin/passport-platforms";

const outPath = join(__dirname, "..", "public", "stampMetadata.json");
console.log(`Saving platform info to JSON file at ${outPath}`);

writeFileSync(outPath, JSON.stringify(platformsData));
