export type PlatformSpec = {
  icon?: string | undefined;
  platform: string;
  name: string;
  description: string;
  connectMessage: string;
  isEVM?: boolean;
};

export type ProviderSpec = {
  title: string;
  name: string;
  icon?: string;
  description?: string;
};

export type PlatformGroupSpec = {
  providers: ProviderSpec[];
  platformGroup: string;
};
