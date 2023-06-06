import fs from "fs";
import path from "path";
import { execSync } from "child_process";

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
  "App-Bindings.ts": `import { AppContext, ProviderPayload } from "../types";
  import { Platform } from "../utils/platform";
  
  export class ${providerName}Platform extends Platform {
    platformId = "${providerName}";
    path = "${providerName}";
    clientId: string = null;
    redirectUri: string = null;
  
  
  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
      const result = await Promise.resolve({});
      return result;
    }
  
    getOAuthUrl(state: string): Promise<string> {
      throw new Error("Method not implemented.");
    }
  }
  `,
  Providers: {
    __tests__: {
      [`${providerName}.test.ts`]: `
      describe("${providerName}", () => {
        it("should be true", () => {
          expect(true).toBe(true);
        });
      });      
      `,
    },
    [`${providerName}.ts`]: "",
  },
  "Providers-config.ts": `import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
  import { ${providerName}Provider } from "./Providers";

  export const PlatformDetails: PlatformSpec = {
    icon: "./assets/${providerName.toLowerCase()}StampIcon.svg",
    platform: "${providerName}",
    name: "${providerName}",
    description: "Connect your existing ${providerName} Account to verify",
    connectMessage: "Connect Account",
  };

  export const ProviderConfig: PlatformGroupSpec[] = [
    { platformGroup: "Account Name", providers: [{ title: "${providerName}", name: "${providerName}" }] },
  ];

  export const providers: Provider[] = [new ${providerName}Provider()];
`,
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

// Create a new directory for the generated files
const generatedFilesPath = path.join(__dirname, `../${providerName}`);
fs.mkdirSync(generatedFilesPath, { recursive: true });

// Create the structure inside the new directory
createStructure(generatedFilesPath, structure);

// Run Prettier on the generated code
try {
  execSync("yarn prettier");
  console.log("Prettier formatting completed successfully.");
} catch (error) {
  console.error("Failed to run Prettier on the generated code:", error);
}
