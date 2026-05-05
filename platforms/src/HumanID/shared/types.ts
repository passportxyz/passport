import { CredentialType } from "@holonym-foundation/human-id-sdk";
import type {
  RequestSBTExtraParams,
  KycOptions,
  CleanHandsOptions,
  PaymentConfig,
} from "@holonym-foundation/human-id-interface-core";

type RequestSBTResponse = null | {
  sbt: {
    recipient: string;
    txHash: string;
    chain: "Optimism" | "NEAR" | "Stellar";
  };
};

// Define the base interface locally since we can't import it directly
interface HumanIDProviderInterface {
  request(args: { method: string; params?: unknown[] | object }): Promise<unknown>;
  on(event: string, listener: (...args: any[]) => void): any;
  removeListener(event: string, listener: (...args: any[]) => void): any;
  requestSBT(type: CredentialType, args: RequestSBTExtraParams): Promise<unknown>;
}

// privateRequestSBT accepts the full unrestricted KycOptions (including freeZKPassport),
// unlike the public requestSBT which strips freeZKPassport from the type. We forward all
// three sub-options so the iframe shows every Government ID card variant.
export type PrivateRequestSBTArgs = RequestSBTExtraParams & {
  kycOptions?: KycOptions;
  cleanHandsOptions?: CleanHandsOptions;
  paymentConfig?: PaymentConfig;
};

// Extended interface with secret methods that exist at runtime but aren't in the public interface
export interface ExtendedHumanIDProvider extends HumanIDProviderInterface {
  getKeygenMessage(): string;
  privateRequestSBT(type: CredentialType, args: PrivateRequestSBTArgs): Promise<RequestSBTResponse>;
}
