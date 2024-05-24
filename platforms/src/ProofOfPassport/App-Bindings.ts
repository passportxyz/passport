//App-bindings.ts - EVM
import { AppContext, ProviderPayload } from "../types";
import { Platform } from "../utils/platform";

export class ProofOfPassportPlatform extends Platform {
    platformId = "ProofofPassport";
    path = "ProofOfPassport";
    clientId: string = null;
    redirectUri: string = null;
    isEVM = true;
    banner = {
        heading:
            "Proof of Passport",
        cta: {
            label: "Learn more",
            url: "https://proofofpassport.com",
        },
    };

    async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
        const result = await Promise.resolve({});
        return result;
    }
}