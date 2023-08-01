import { Drawer, DrawerContent, DrawerHeader, DrawerBody, DrawerOverlay, DrawerCloseButton } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { chains } from "../utils/onboard";
import { NetworkCard } from "./NetworkCard";
import { pgnChainId, lineaChainId, optimismChainId, goerliBaseChainId } from "../utils/onboard";

type OnchainSidebarProps = {
  isOpen: boolean;
  onClose: () => void;
};

const onChainPassportChainIds = JSON.parse(process.env.NEXT_PUBLIC_POSSIBLE_ON_CHAIN_PASSPORT_CHAINIDS || "[]");

const deployedChains = chains.filter((chain) => onChainPassportChainIds.includes(chain.id));

export function OnchainSidebar({ isOpen, onClose }: OnchainSidebarProps) {
  const activeOnChainPassportChains = process.env.NEXT_PUBLIC_ACTIVE_ON_CHAIN_PASSPORT_CHAINIDS;
  const [activeChains, setActiveChains] = useState<string[]>([]);

  useEffect(() => {
    if (activeOnChainPassportChains) {
      const chainsArray = JSON.parse(activeOnChainPassportChains);
      setActiveChains(chainsArray);
    }
  }, [activeOnChainPassportChains]);

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
          {deployedChains.map((chain) => (
            <NetworkCard key={chain.id} chain={chain} activeChains={activeChains} />
          ))}
        </DrawerBody>
      </DrawerContent>
    </Drawer>
  );
}
