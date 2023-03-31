/* eslint-disable */
import { AppContext, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

export class WIWPlatform extends Platform {
    platformId = "WIW";
    path = "WIW";
    isEVM = true;

    async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
        const result = await Promise.resolve({});
        return result;
    }
}