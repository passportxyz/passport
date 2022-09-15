import { EVMProviders } from "./utils/evmProviders";
import { EnsProvider } from "./providers/ens";

export const evmProviders = new EVMProviders([new EnsProvider()]);
