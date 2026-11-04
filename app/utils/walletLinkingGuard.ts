// Set while a wallet is being linked. Connecting the wallet to link (often MetaMask) makes wagmi's
// injected connector auto-connect and become the active connection, so the active address briefly
// changes. That must not log the user out; restoreActiveConnection (waapLinking.ts) undoes it.
let linkInProgress = false;

export const setWalletLinkInProgress = (value: boolean) => {
  linkInProgress = value;
};

export const isWalletLinkInProgress = () => linkInProgress;
