import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerOverlay } from "@chakra-ui/react";
import { chains } from "../utils/chains";
import { NetworkCard } from "./NetworkCard";
import { useCustomization } from "../hooks/useCustomization";
import { mintFee } from "../config/mintFee";
import { parseValidChains } from "../hooks/useOnChainStatus";
import { Button } from "./Button";
import { CancelButton } from "./CancelButton";

type OnchainSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function OnchainSidebar({ isOpen, onClose }: OnchainSidebarProps) {
  const customization = useCustomization();
  const validChains = chains.filter((chain) => parseValidChains(customization, chain));
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
