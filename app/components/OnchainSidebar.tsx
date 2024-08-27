import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerOverlay } from "@chakra-ui/react";
import { chains } from "../utils/chains";
import { NetworkCard } from "./NetworkCard";
import { useCustomization } from "../hooks/useCustomization";
import { mintFee } from "../config/mintFee";
import { parseValidChains } from "../hooks/useOnChainStatus";
import { Button } from "./Button";

type OnchainSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const CancelButton = ({ onClose }: { onClose: () => void }) => (
  <button onClick={onClose}>
    <svg width="56" height="56" viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M41.5 14.4131L14.0978 41.8153" stroke="#C1F6FF" stroke-width="2" stroke-linecap="round" />
      <path d="M41.5 41.8154L14.0978 14.4132" stroke="#C1F6FF" stroke-width="2" stroke-linecap="round" />
    </svg>
  </button>
);

export function OnchainSidebar({ isOpen, onClose }: OnchainSidebarProps) {
  const customization = useCustomization();
  const validChains = chains.filter(
    ({ attestationProvider, id }) =>
      (attestationProvider?.status === "comingSoon" || attestationProvider?.status === "enabled") &&
      parseValidChains(customization, id)
  );
  return (
    <Drawer isOpen={isOpen} placement="right" size="sm" onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent
        style={{
          backgroundColor: "rgb(var(--color-background))",
          border: "1px solid rgb(var(--color-foreground-5))",
        }}
      >
        <DrawerHeader className="text-center text-color-1">
          <div className="mt-10 justify-center text-left">
            <div className="flex items-center mb-2">
              <h2 className="text-2xl font-heading grow">Go Onchain</h2>
              <CancelButton onClose={onClose} />
            </div>
            <p className="text-base font-normal">
              Minting your Passport onchain creates a tamper-proof record of your Passport onchain. This is only
              required if you&apos;re using applications that fetch Passport data onchain. Note: Minting your Passport
              onchain involves blockchain network fees and a ${mintFee} minting fee, which is directed to the Passport
              treasury.
            </p>
          </div>
        </DrawerHeader>
        <DrawerBody>
          {validChains.map((chain) => (
            <NetworkCard key={chain.id} chain={chain} />
          ))}
          <Button variant="secondary" onClick={onClose} className="w-full rounded-lg">
            Close
          </Button>
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
