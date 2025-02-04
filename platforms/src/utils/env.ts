
export function getEnvVar(key: string, defaultValue?: string): string {
    const importMeta = import.meta as undefined as { env: Record<string, string> };
    if (typeof importMeta.env !== "undefined" && key in importMeta.env) {
        return importMeta.env[key] as string;
    }

    if (typeof process !== "undefined" && process.env && key in process.env) {
        return process.env[key] as string;
    }

    if (defaultValue !== undefined) {
        return defaultValue;
    }

    throw new Error(`Environment variable "${key}" is not defined`);
}
