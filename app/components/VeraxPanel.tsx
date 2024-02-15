import { useSyncToChainButton } from "../hooks/useSyncToChainButton";
import { useOnChainStatus } from "../hooks/useOnChainStatus";
import { OnChainStatus } from "../utils/onChainStatus";
import { chains } from "../utils/chains";
import { LoadButton } from "./LoadButton";
import Tooltip from "./Tooltip";
import { Modal, ModalBody, ModalCloseButton, ModalContent, ModalHeader, ModalOverlay } from "@chakra-ui/react";
import { Button } from "./Button";
import { ScorerContext } from "../context/scorerContext";
import { useContext, useState } from "react";
import { CustomDashboardPanel } from "./CustomDashboardPanel";

const VeraxLogo = () => (
  <svg width="64" height="56" viewBox="0 0 64 56" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path
      d="M17.1082 0H0L15.8409 37.0131L24.395 17.7418L17.1082 0Z"
      fill="rgb(var(--color-customization-background-1))"
    />
    <path
      d="M46.5404 0H63.0907L40.7172 55.5197H23.5539L46.5404 0Z"
      fill="rgb(var(--color-customization-background-1))"
    />
  </svg>
);

const getButtonMsg = (onChainStatus: OnChainStatus): string => {
  switch (onChainStatus) {
    case OnChainStatus.NOT_MOVED:
      return "Push to Verax";
    case OnChainStatus.MOVED_OUT_OF_DATE:
      return "Update";
    case OnChainStatus.MOVED_UP_TO_DATE:
      return "Already pushed";
    case OnChainStatus.LOADING:
      return "Loading";
  }
};

const LINEA_CHAIN_NAME = process.env.NEXT_PUBLIC_ENABLE_TESTNET === "on" ? "Linea Goerli" : "Linea";
const chain = chains.find(({ label }) => label === LINEA_CHAIN_NAME);

export const VeraxPanel = ({ className }: { className: string }) => {
  const onChainStatus = useOnChainStatus({ chain });
  const { score } = useContext(ScorerContext);
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);

  const {
    props: buttonProps,
    syncingToChain,
    text,
    needToSwitchChain,
  } = useSyncToChainButton({
    chain,
    onChainStatus,
    getButtonMsg,
  });

  return (
    <>
      <CustomDashboardPanel
        className={`${className} ${
          onChainStatus === OnChainStatus.MOVED_UP_TO_DATE
            ? "text-customization-background-1 brightness-50 saturate-50"
            : ""
        } ${
          onChainStatus === OnChainStatus.MOVED_OUT_OF_DATE
            ? "shadow-[0_0_15px_rgb(var(--color-customization-background-1)/.75)]"
            : ""
        }`}
        logo={{ image: <VeraxLogo />, caption: "Verax" }}
      >
        <Tooltip
          className={`absolute top-0 right-0 p-2 ${
            needToSwitchChain && onChainStatus !== OnChainStatus.MOVED_UP_TO_DATE ? "block" : "hidden"
          }`}
          panelClassName="w-[200px] border-customization-background-1"
          iconClassName="text-customization-background-1"
        >
          You will be prompted to switch to {chain?.label} and sign the transaction.
        </Tooltip>
        {onChainStatus === OnChainStatus.NOT_MOVED || onChainStatus === OnChainStatus.MOVED_OUT_OF_DATE ? (
          <>
            Verax is a community maintained public attestation registry on Linea. Push your Passport Stamps onto Verax
            to gain rewards for early adopters in the Linea ecosystem.
            <span className="text-xs text-customization-background-1 brightness-[1.4]">
              This action requires ETH bridged to Linea Mainnet to cover network fees, as well as a $2 mint fee which
              goes to the Gitcoin treasury.
            </span>
          </>
        ) : (
          <p>
            Verax is a community maintained public attestation registry on Linea. Push your Passport Stamps onto Verax
            to gain rewards for early adopters in the Linea ecosystem.
          </p>
        )}
        <div className="grow" />
        <LoadButton
          {...buttonProps}
          isLoading={syncingToChain || onChainStatus === OnChainStatus.LOADING}
          variant="custom"
          className={`${buttonProps.className} rounded-s mr-2 mt-2 w-fit  self-end bg-customization-background-1 text-color-4 hover:bg-customization-background-1/75 enabled:hover:text-color-1 disabled:bg-customization-background-1 disabled:brightness-100`}
          onClick={() => {
            if (score < 1) {
              setConfirmModalOpen(true);
            } else {
              buttonProps.onClick();
            }
          }}
        >
          {text}
        </LoadButton>
      </CustomDashboardPanel>
      <VeraxPanelApprovalModal
        isOpen={confirmModalOpen}
        onReject={() => setConfirmModalOpen(false)}
        onConfirm={() => {
          buttonProps.onClick();
          setConfirmModalOpen(false);
        }}
      />
    </>
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
          <p className="text-center">Alert: Low Score</p>
        </ModalHeader>
        <ModalCloseButton />
        <ModalBody color="rgb(var(--color-text-5))" className="mb-10 overflow-auto text-center">
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
