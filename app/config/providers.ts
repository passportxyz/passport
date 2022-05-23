import { PROVIDER_ID } from "@dpopp/types";

export type ProviderSpec = {
  // icon: ??? // TODO
  name: string;
  description: string;
};

export type Providers = {
  [provider in PROVIDER_ID]: ProviderSpec;
};

export const STAMP_PROVIDERS: Readonly<Providers> = {
  Google: {
    name: "Google",
    description: "Google Authentication",
  },
  Ens: {
    name: "Ens",
    description: "Ens name",
  },
  Poh: {
    name: "POH",
    description: "Proof of Humanity",
  },
  Twitter: {
    name: "Twitter",
    description: "Twitter name",
  },
  POAP: {
    name: "POAP",
    description: "POAP Verification",
  },
  Facebook: {
    name: "Facebook",
    description: "Facebook name",
  },
};
