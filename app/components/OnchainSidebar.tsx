import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerOverlay, DrawerCloseButton } from "@chakra-ui/react";
import { chains } from "../utils/onboard";
import { NetworkCard } from "./NetworkCard";

export type OnchainSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

export function OnchainSidebar({ isOpen, onClose }: OnchainSidebarProps) {
  console.log({ chains });
  return (
    <Drawer isOpen={isOpen} placement="right" size="sm" onClose={onClose}>
      <DrawerOverlay />
      <DrawerContent
        style={{
          backgroundColor: "var(--color-background-2)",
          border: "1px solid var(--color-accent-2)",
          borderRadius: "6px",
        }}
      >
        <DrawerCloseButton className="text-color-1" />
        <DrawerHeader className="text-center text-color-1">
          <div className="mt-10 justify-center">
            <h2 className="mt-4 text-2xl">Go On-Chain</h2>
            <p className="text-base font-normal">
              Moving your passport on-chain creates a tamper-proof record of your stamps. This is only required if
              you&apos;re using applications that fetch Passport data from on-chain. Note: This involves blockchain
              network fees and a $2 Gitcoin minting fee.
            </p>
          </div>
        </DrawerHeader>
        <DrawerBody>
          {chains.map((chain) => (
            <NetworkCard key={chain.id} />
          ))}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
