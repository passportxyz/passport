import { useSyncToChainButton } from "../hooks/useSyncToChainButton";
import { OnChainStatus } from "../utils/onChainStatus";
import { chains } from "../utils/chains";
import { LoadButton } from "./LoadButton";
import Tooltip from "./Tooltip";
import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay } from "@chakra-ui/react";
import { Button } from "./Button";
import { ScorerContext } from "../context/scorerContext";
import { useContext, useState, ReactNode } from "react";
import { CustomDashboardPanel } from "./CustomDashboardPanel";
import { useOnChainStatus } from "../hooks/useOnChainStatus";
import { mintFee } from "../config/mintFee";
import { twMerge } from "tailwind-merge";
import { OnchainSidebar } from "./OnchainSidebar";

const VeraxLogo = () => (
  <svg width="64" height="56" viewBox="0 0 64 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M17.1082 0H0L15.8409 37.0131L24.395 17.7418L17.1082 0Z" fill="rgb(var(--color-text-4))" />
    <path d="M46.5404 0H63.0907L40.7172 55.5197H23.5539L46.5404 0Z" fill="rgb(var(--color-text-4))" />
  </svg>
);

const getButtonMsg = (onChainStatus: OnChainStatus): string => {
  switch (onChainStatus) {
    case OnChainStatus.NOT_MOVED:
      return "Push to Verax";
    case OnChainStatus.MOVED_OUT_OF_DATE:
    case OnChainStatus.MOVED_EXPIRED:
      return "Update";
    case OnChainStatus.MOVED_UP_TO_DATE:
      return "Already pushed";
    case OnChainStatus.LOADING:
      return "Loading";
  }
};

// 0xe704 - Linea Goerli
const LINEA_CHAIN_ID = process.env.NEXT_PUBLIC_ENABLE_TESTNET === "on" ? "0xe704" : "0xe708";
const chain = chains.find(({ id }) => id === LINEA_CHAIN_ID);

export const VeraxPanel = ({ className, actionClassName }: { className: string; actionClassName?: string }) => {
  const [showSidebar, setShowSidebar] = useState(false);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const { rawScore, scoreState, passingScore } = useContext(ScorerContext);
  const { status: onChainStatus } = useOnChainStatus({ chain });
  const buttonText = getButtonMsg(onChainStatus);

  const enableWriteToChain = scoreState.status === "success";
  const {
    props: buttonProps,
    syncingToChain,
    needToSwitchChain,
  } = useSyncToChainButton({
    chain,
    onChainStatus,
  });

  return (
    <div className={`${className} flex flex-col rounded-3xl text-color-4 bg-[#ffffff99] p-4 justify-between`}>
      <div className="flex items-center justify-end h-16">
        <div className="grow font-medium text-lg">Verax</div>
        <div className="flex bg-white p-2 rounded-md">
          <div className="h-10 [&_svg]:h-full">
            <VeraxLogo />
          </div>
        </div>
        <Tooltip
          className={`pl-2 self-start ${needToSwitchChain && onChainStatus !== OnChainStatus.MOVED_UP_TO_DATE ? "block" : "hidden"}`}
          panelClassName="w-[200px] border-customization-background-1"
          iconClassName="text-customization-background-1"
        >
          You will be prompted to switch to {chain?.label} and sign the transaction.
        </Tooltip>
      </div>
      Verax is a community maintained public attestation registry on Linea. Push your Passport Stamps onto Verax to gain
      rewards for early adopters in the Linea ecosystem.
      <div className="flex items-center">
        <LoadButton
          {...buttonProps}
          disabled={!enableWriteToChain}
          variant="custom"
          isLoading={syncingToChain || onChainStatus === OnChainStatus.LOADING}
          className={twMerge(
            "rounded-md mr-2 w-fit self-end bg-customization-background-3 text-customization-foreground-2 hover:bg-customization-background-3/75 disabled:bg-customization-background-1 disabled:brightness-100",
            actionClassName
          )}
          onClick={() => {
            if (!passingScore) {
              setConfirmModalOpen(true);
            } else {
              setShowSidebar(true);
            }
          }}
        >
          <span className="text-nowrap">{buttonText}</span>
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M5 12H19M19 12L12 5M19 12L12 19"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </LoadButton>
        <div className="text-sm grow">
          This action requires ETH bridged to Linea Mainnet to cover network fees, as well as a ${mintFee} mint fee
          which goes to the Passport treasury.
        </div>
      </div>
      <OnchainSidebar isOpen={showSidebar} onClose={() => setShowSidebar(false)} />{" "}
      <VeraxPanelApprovalModal
        isOpen={confirmModalOpen}
        onReject={() => setConfirmModalOpen(false)}
        onConfirm={() => {
          setShowSidebar(true);
          setConfirmModalOpen(false);
        }}
      />
    </div>
  );
};

export const VeraxPanelApprovalModal = ({
  isOpen,
  onReject,
  onConfirm,
}: {
  isOpen: boolean;
  onReject: () => void;
  onConfirm: () => void;
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onReject}>
      <ModalOverlay width="100%" height="100%" />
      <ModalContent rounded={"none"} padding={5}>
        <ModalHeader>
          <img alt="shield alert" src="../assets/shield-alert.svg" className="m-auto mb-4 w-10" />
          <p className="text-center text-color-4">Alert: Low Score</p>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody className="mb-10 overflow-auto text-center text-color-9">
          Your Passport score is currently below the Unique Humanity Verification threshold. Submitting this Passport
          onchain might not qualify your account as a valid unique human on Linea. Please review your stamps or reach
          out to support before proceeding.
        </ModalBody>

        <div className="grid grid-cols-2 gap-4">
          <Button variant="secondary" onClick={onReject}>
            Cancel
          </Button>
          <Button variant="primary" onClick={onConfirm}>
            Continue anyway
          </Button>
        </div>
      </ModalContent>
    </Modal>
  );
};
