import { PROVIDER_ID } from "@dpopp/types";

export type ProviderSpec = {
  icon: string | undefined;
  name: string;
  description: string;
};

export type Providers = {
  [provider in PROVIDER_ID]: ProviderSpec;
};

export const STAMP_PROVIDERS: Readonly<Providers> = {
  Google: {
    icon: "./assets/googleStampIcon.svg",
    name: "Google",
    description: "Google Authentication",
  },
  Simple: {
    icon: undefined,
    name: "Simple",
    description: "Simple Username",
  },
  Ens: {
    icon: "./assets/ensStampIcon.svg",
    name: "Ens",
    description: "Ens name",
  },
  Poh: {
    icon: "./assets/pohStampIcon.svg",
    name: "POH",
    description: "Proof of Humanity",
  },
  Twitter: {
    icon: "./assets/twitterStampIcon.svg",
    name: "Twitter",
    description: "Twitter name",
  },
  POAP: {
    icon: "./assets/poapStampIcon.svg",
    name: "POAP",
    description: "POAP Verification",
  },
  Facebook: {
    icon: "./assets/facebookStampIcon.svg",
    name: "Facebook",
    description: "Facebook name",
  },
};
