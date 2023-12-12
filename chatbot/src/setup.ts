import "dotenv/config";

export type Env = {
  OPENAI_API_KEY: string;
  OPENAI_ASSISTANT_ID: string;
  PASSPORT_SCORER_API_KEY: string;
  PASSPORT_SCORER_ID: string;
  USER_ADDRESS: string;
};

export const loadEnv = (envVars: (keyof Env)[]) => {
  const env = envVars.reduce((env, key) => {
    env[key] = process.env[key] as string;
    if (!env[key]) {
      throw new Error(`${key} environment variable is required.`);
    }
    return env;
  }, {} as Env) as Partial<Env>;

  return { env } as { env: Env };
};
