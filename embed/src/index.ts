export type * from "./types.d.ts";
import { logger } from "./utils/logger.js";
import { logger as idenityLogger } from "@gitcoin/passport-identity/";

idenityLogger.setLogger(logger);
