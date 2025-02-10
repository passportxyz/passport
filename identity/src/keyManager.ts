// This loads the latest 2 active keys (i.e. start time in the past) from
// environment variables, based on start times
const MAX_CONCURRENT_KEYS = 2;

const KEY_ENV_PREFIX = "IAM_JWK_EIP712_V";
const getKeyEnvName = (version: number) => `${KEY_ENV_PREFIX}${version}`;
const getStartTimeEnvName = (version: number) => `${getKeyEnvName(version)}_START_TIME`;

type KeyVersion = {
  key: string;
  startTime: Date;
  version: number;
};

const keyEnvNameRegex = new RegExp(`^${KEY_ENV_PREFIX}(?<version>\\d+)$`);

const loadKeyFromEnv = ({ version }: { version: number }): KeyVersion | undefined => {
  const key = process.env[getKeyEnvName(version)];
  const startTimeStr = process.env[getStartTimeEnvName(version)];

  if (!key || !startTimeStr) {
    return undefined;
  }

  const startTime = new Date(startTimeStr);
  if (isNaN(startTime.getTime())) {
    throw new Error(`Invalid start time for key version ${version}`);
  }

  return { key, startTime, version };
};

const getStartVersion = () => {
  const startVersion = Math.min(
    ...Object.keys(process.env)
      .map((key) => key.match(keyEnvNameRegex)?.groups?.version)
      .filter((v) => v)
      .map(parseInt)
  );

  if (isNaN(startVersion) || startVersion < 1) {
    throw new Error("No valid key versions found in environment variables");
  }

  return startVersion;
};

// Enforce monotonically increasing start times
const checkKeyOrder = (keys: KeyVersion[]) => {
  keys.forEach((key, index) => {
    const previousKey = index ? keys[index - 1] : null;
    if (previousKey && key.startTime <= previousKey.startTime) {
      throw new Error(
        `Key version ${key.version} start time (${key.startTime.toISOString()}) must be after previous version (${previousKey.startTime.toISOString()})`
      );
    }
  });
};

const loadInitiatedKeys = (): KeyVersion[] => {
  const initiatedKeys: KeyVersion[] = [];

  let version = getStartVersion();

  while (true) {
    const key = loadKeyFromEnv({ version });

    // Break if no key found, or if we found a future key
    if (!key || key.startTime > new Date()) {
      break;
    }

    initiatedKeys.push(key);
    version++;
  }

  if (initiatedKeys.length === 0) {
    throw new Error("No valid keys configured");
  }

  checkKeyOrder(initiatedKeys);

  return initiatedKeys;
};

export const getCurrentKeys = (): KeyVersion[] => {
  const initiatedKeys = loadInitiatedKeys();
  return initiatedKeys.slice(-MAX_CONCURRENT_KEYS);
};
