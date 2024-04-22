import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { OutdidProvider } from "./Providers/outdid";
 
export const PlatformDetails: PlatformSpec = {
    icon: "./assets/outdidStampIcon.svg",
    platform: "Outdid",
    name: "Outdid",
    description: "Connect to Outdid to verify you are a unique person.",
    connectMessage: "Connect Account",
};
    
export const ProviderConfig: PlatformGroupSpec[] = [
    {
    platformGroup: "Name of the Stamp platform group",
    providers: [
        {
            title: "Verify your identity with Outdid",
            description: "Outdid uses zero-knowledge cryptography to ensure you are a unique human without revealing any personal information.",
            name: "Outdid",
        },
    ]
    },
];
 
export const providers: Provider[] = [new OutdidProvider()]