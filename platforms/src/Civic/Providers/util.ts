const isError = (e: unknown): e is Error => e instanceof Error;
export const errorToString = (e: unknown): string => (isError(e) ? e.message : JSON.stringify(e));
