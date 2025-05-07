// This supports ENV vars of the format:
// IAM_JWK_EIP712_V1='{...}'
// IAM_JWK_EIP712_V1_START_TIME=2021-01-01T00:00:00Z
// IAM_JWK_EIP712_V2='{...}'
// IAM_JWK_EIP712_V2_START_TIME=2021-04-01T00:00:00Z
//
// All "initiated" keys are loaded, meaning the start time is in the past.
//
// The newest 2 initiated keys are the "active" keys.
//
// The older of the 2 active keys is the "issuer" key.
//
// Each consecutive version must have a monotonically increasing start time.
//
// Old keys can be removed from the ENV, and gaps are allowed. But we should
// generally hold onto keys until any credentials issued with those keys are
// expired
//
// If set in the ENV, the legacy key (IAM_JWK_EIP712) is always the first
// key in the list, with version "0.0.0"

import { checkRotatingKeysEnabled } from "./helpers.js";
import * as logger from "./logger.js";
const MAX_CONCURRENT_KEYS = 2;

const LEGACY_KEY_ENV_NAME = "IAM_JWK_EIP712";

const KEY_ENV_PREFIX = "IAM_JWK_EIP712_V";
const getKeyEnvName = (version: number) => `${KEY_ENV_PREFIX}${version}`;
const getStartTimeEnvName = (version: number) => `${getKeyEnvName(version)}_START_TIME`;

const LEGACY_VERSION = "0.0.0";
type LegacyVersion = typeof LEGACY_VERSION;

type KeyVersion = {
  key: string;
  startTime: Date;
  version: number | LegacyVersion;
};

const keyEnvNameRegex = new RegExp(`^${KEY_ENV_PREFIX}(?<version>\\d+)$`);

const loadKeyFromEnv = ({ version }: { version: number }): KeyVersion | undefined => {
  const key = process.env[getKeyEnvName(version)];
  const startTimeStr = process.env[getStartTimeEnvName(version)];

  if (!key || !startTimeStr) {
    throw new Error(`Missing key value or start time for version ${version}`);
  }

  const startTime = new Date(startTimeStr);
  if (isNaN(startTime.getTime())) {
    throw new Error(`Invalid start time for key version ${version}`);
  }

  return { key, startTime, version };
};

const getVersions = () =>
  Object.keys(process.env)
    .map((key) => Number(key.match(keyEnvNameRegex)?.groups?.version))
    .filter((v) => v > 0)
    .sort();

// Enforce monotonically increasing start times
const checkKeyOrder = (keys: KeyVersion[]) => {
  keys.forEach((key, index) => {
    const previousKey = index ? keys[index - 1] : null;
    if (previousKey && key.startTime <= previousKey.startTime) {
      throw new Error(
        `Key version ${
          key.version
        } start time (${key.startTime.toISOString()}) must be after previous version (${previousKey.startTime.toISOString()})`
      );
    }
  });
};

const getLegacyKeyVersion = (): KeyVersion | undefined => {
  const key = process.env[LEGACY_KEY_ENV_NAME];

  if (!key) {
    logger.warn(`Warning: No legacy key (${LEGACY_KEY_ENV_NAME}) found in ENV`);
  }

  return (
    key && {
      key,
      startTime: new Date(0),
      version: LEGACY_VERSION,
    }
  );
};

const loadInitiatedRotatingKeyVersions = (): KeyVersion[] => {
  const initiatedKeyVersions: KeyVersion[] = [];

  const versions = getVersions();

  for (const version of versions) {
    const keyVersion = loadKeyFromEnv({ version });

    // Break if we found a future key
    if (keyVersion.startTime > new Date()) {
      break;
    }

    initiatedKeyVersions.push(keyVersion);
  }

  if (initiatedKeyVersions.length === 0) {
    logger.warn("Warning: No valid IAM_JWK_EIP712_V* keys configured");
  }

  return initiatedKeyVersions;
};

const loadInitiatedKeys = (): KeyVersion[] => {
  const rotatingKeyVersions = checkRotatingKeysEnabled() ? loadInitiatedRotatingKeyVersions() : [];

  const legacyKeyVersion = getLegacyKeyVersion();

  const initiatedKeyVersions = [legacyKeyVersion, ...rotatingKeyVersions].filter(Boolean);

  if (initiatedKeyVersions.length === 0) {
    throw new Error("No valid keys configured");
  }

  return initiatedKeyVersions;
};

type GetKeyVersionsResponse = {
  initiated: KeyVersion[];
  active: KeyVersion[];
  issuer: KeyVersion;
};

export const getKeyVersions = (): GetKeyVersionsResponse => {
  const initiated = loadInitiatedKeys();

  checkKeyOrder(initiated);

  const active = initiated.slice(-MAX_CONCURRENT_KEYS);
  const issuer = active[0];

  return {
    initiated,
    active,
    issuer,
  };
};
