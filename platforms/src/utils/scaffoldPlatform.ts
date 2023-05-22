import fs from "fs";
import path from "path";

// Get the command line argument
const providerName: string = process.argv[2];

// Validate providerName
if (!providerName) {
  console.error("Please provide a provider name");
  process.exit(1);
}

// Define a type for the file structure
type FileStructure = {
  [key: string]: string | FileStructure;
};

// Define the directory and file structure
const structure: FileStructure = {
  "App-Bindings.ts": "",
  Providers: {
    __tests__: {
      [`${providerName}.test.ts`]: "",
    },
    [`${providerName}.ts`]: "",
  },
  "Providers-config.ts": "",
  "index.ts": "",
};

// Function to create directories and files recursively
function createStructure(basePath: string, structure: FileStructure): void {
  for (const key in structure) {
    if (typeof structure[key] === "object") {
      // If the value is an object, it's a directory
      const dirPath = path.join(basePath, key);
      fs.mkdirSync(dirPath, { recursive: true });
      // Recursively create the inner directories or files
      createStructure(dirPath, structure[key] as FileStructure);
    } else {
      // If the value is not an object, it's a file
      const filePath = path.join(basePath, key);
      fs.writeFileSync(filePath, structure[key] as string);
    }
  }
}

// Create the structure
createStructure(__dirname, structure);
