import { parseValidChains } from "../../hooks/useOnChainStatus";
import { Customization } from "../../utils/customizationUtils";
import { Chain } from "../../utils/chains";

const chain_1 = new Chain({
  id: "1",
  token: "ETH",
  label: "Ethereum Mainnet",
  rpcUrl: "some url",
  icon: "./assets/eth-network-logo.svg",
  chainLink: "https://support.passport.xyz/passport-knowledge-base/using-passport/onchain-passport",
  explorerUrl: "https://etherscan.io",
  attestationProviderConfig: {
    name: "Ethereum Attestation Service",
    status: "enabled",
    skipByDefault: false,
    easScanUrl: "https://scroll.easscan.org",
    monochromeIcon: "./assets/shape-logo.svg",
  },
});

const chain_3 = new Chain({
  id: "3",
  token: "ETH",
  label: "Ethereum Mainnet",
  rpcUrl: "some url",
  icon: "./assets/eth-network-logo.svg",
  chainLink: "https://support.passport.xyz/passport-knowledge-base/using-passport/onchain-passport",
  explorerUrl: "https://etherscan.io",
  attestationProviderConfig: {
    name: "Ethereum Attestation Service",
    status: "enabled",
    skipByDefault: false,
    easScanUrl: "https://scroll.easscan.org",
    monochromeIcon: "./assets/shape-logo.svg",
  },
});

const chain_4 = new Chain({
  id: "4",
  token: "ETH",
  label: "Ethereum Mainnet",
  rpcUrl: "some url",
  icon: "./assets/eth-network-logo.svg",
  chainLink: "https://support.passport.xyz/passport-knowledge-base/using-passport/onchain-passport",
  explorerUrl: "https://etherscan.io",
  attestationProviderConfig: {
    name: "Ethereum Attestation Service",
    status: "enabled",
    skipByDefault: false,
    easScanUrl: "https://scroll.easscan.org",
    monochromeIcon: "./assets/shape-logo.svg",
  },
});

const chain_5_skipByDefault = new Chain({
  id: "5",
  token: "ETH",
  label: "Ethereum Mainnet",
  rpcUrl: "some url",
  icon: "./assets/eth-network-logo.svg",
  chainLink: "https://support.passport.xyz/passport-knowledge-base/using-passport/onchain-passport",
  explorerUrl: "https://etherscan.io",
  attestationProviderConfig: {
    name: "Ethereum Attestation Service",
    status: "enabled",
    skipByDefault: true,
    easScanUrl: "https://scroll.easscan.org",
    monochromeIcon: "./assets/shape-logo.svg",
  },
});

const chain_3_skipByDefault = new Chain({
  id: "3",
  token: "ETH",
  label: "Ethereum Mainnet",
  rpcUrl: "some url",
  icon: "./assets/eth-network-logo.svg",
  chainLink: "https://support.passport.xyz/passport-knowledge-base/using-passport/onchain-passport",
  explorerUrl: "https://etherscan.io",
  attestationProviderConfig: {
    name: "Ethereum Attestation Service",
    status: "enabled",
    skipByDefault: true,
    easScanUrl: "https://scroll.easscan.org",
    monochromeIcon: "./assets/shape-logo.svg",
  },
});

const customization = {
  includedChainIds: ["1", "2", "3"],
  dashboardPanel: {},
} as unknown as Customization;

describe("Displaying Chains", () => {
  it("should return true if the chain is included in the customization", () => {
    expect(parseValidChains(customization, chain_1)).toBe(true);
  });

  it("should return false if the chain is not included in the customization", () => {
    expect(parseValidChains(customization, chain_4)).toBe(false);
  });

  it("should return true if customization is not present", () => {
    expect(parseValidChains({} as Customization, chain_3)).toBe(true);
  });

  it("should return false if customization is not present, and chain is set to skipByDefault ", () => {
    expect(parseValidChains({} as Customization, chain_5_skipByDefault)).toBe(false);
  });

  it("should return true if customization is present, chain is listed and set to skipByDefault ", () => {
    expect(parseValidChains(customization, chain_3_skipByDefault)).toBe(true);
  });
});
