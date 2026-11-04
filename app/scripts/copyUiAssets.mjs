// @human.tech/ui components load their glass graphics and lottie files from /graphics and /lottie.
// The package README asks the host to serve its dist/graphics and dist/lottie there, so copy them
// into public/ from the installed package. They are gitignored and always match its version.
import { cpSync, existsSync, rmSync } from "fs";
import { createRequire } from "module";
import { dirname, join } from "path";
import { fileURLToPath } from "url";

const require = createRequire(import.meta.url);
const uiDist = join(dirname(require.resolve("@human.tech/ui/package.json")), "dist");
const publicDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public");

for (const folder of ["graphics", "lottie"]) {
  const source = join(uiDist, folder);
  const target = join(publicDir, folder);
  rmSync(target, { recursive: true, force: true });
  if (existsSync(source)) {
    cpSync(source, target, { recursive: true });
    console.log(`Copied @human.tech/ui ${folder} to ${target}`);
  }
}
