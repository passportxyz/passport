import { PlatformSpec, PlatformGroupSpec, Provider } from "../types";
import { OutdidProvider } from "./Providers/outdid";
 
export const PlatformDetails: PlatformSpec = {
    icon: "./assets/outdidStampIcon.svg",
    platform: "Outdid",
    name: "Outdid",
    description: "Outdid's free ZK ID verification brings a strong sybil signal with complete privacy and anonymity.",
    connectMessage: "Connect Account",
};
    
export const ProviderConfig: PlatformGroupSpec[] = [
    {
    platformGroup: "Name of the Stamp platform group",
    providers: [
        {
            title: "ZK-prove your identity with Outdid",
            description: "Outdid uses zero-knowledge cryptography to ensure you are a unique human without revealing any personal information.",
            name: "Outdid",
        },
    ]
    },
];
 
export const providers: Provider[] = [new OutdidProvider()]