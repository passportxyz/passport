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
  Simple: {
    name: "Simple",
    description: "Simple Username",
  },
  Ens: {
    name: "Ens",
    description: "Ens name",
  },
  Twitter: {
    name: "Twitter",
    description: "Twitter name",
  },
};
