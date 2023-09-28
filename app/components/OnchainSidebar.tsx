import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerOverlay, DrawerCloseButton } from "@chakra-ui/react";
import { chains } from "../utils/chains";
import { NetworkCard } from "./NetworkCard";

type OnchainSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const chainsWithAttestations = chains.filter(
  ({ attestationProvider }) => attestationProvider?.status === "comingSoon" || attestationProvider?.status === "enabled"
);

export function OnchainSidebar({ isOpen, onClose }: OnchainSidebarProps) {
  return (
    <Drawer isOpen={isOpen} placement="right" size="sm" onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent
        style={{
          backgroundColor: "rgb(var(--color-background))",
          border: "1px solid rgb(var(--color-foreground-3))",
          borderRadius: "6px",
        }}
      >
        <DrawerCloseButton className="text-color-1" />
        <DrawerHeader className="text-center text-color-1">
          <div className="mt-10 justify-center">
            <h2 className="mt-4 text-2xl">Go Onchain</h2>
            <p className="text-base font-normal">
              Minting your Passport onchain creates a tamper-proof record of your Gitcoin Passport onchain. This is only
              required if you&apos;re using applications that fetch Gitcoin Passport data onchain. Note: Minting your
              Passport onchain involves blockchain network fees and a $2 minting fee, which is directed to the Gitcoin
              treasury.
            </p>
          </div>
        </DrawerHeader>
        <DrawerBody>
          {chainsWithAttestations.map((chain) => (
            <NetworkCard key={chain.id} chain={chain} />
          ))}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
