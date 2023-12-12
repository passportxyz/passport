import "dotenv/config";

export type Env = {
  OPENAI_API_KEY: string;
  OPENAI_ASSISTANT_ID: string;
  OPENAI_FILE_ID: string;
  PASSPORT_SCORER_API_KEY: string;
  PASSPORT_SCORER_ID: string;
  USER_ADDRESS: string;
};

export const loadEnv = (envVars: (keyof Env)[]) => {
  envVars.map((key) => {
    if (!process.env[key]) {
      throw new Error(`${key} environment variable is required.`);
    }
  });

  return { env: process.env } as { env: Env };
};
