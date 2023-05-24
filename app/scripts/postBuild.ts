import dotenv from "dotenv";
import { writeFileSync } from "fs";
import { join } from "path";

import { platforms } from "@gitcoin/passport-platforms";

dotenv.config();

const platformData: any = [];
console.log("POST BUILD");

// Parse platforms and write to a JSON file in the public directory
// writeFileSync(join(__dirname, "public", "providers.json"), JSON.stringify(platformData));
