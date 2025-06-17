// --- Chakra UI Elements
import { DrawerBody, DrawerHeader, DrawerContent } from "@chakra-ui/react";

import { PlatformGroupSpec, PlatformBanner } from "@gitcoin/passport-platforms";

import { PROVIDER_ID } from "@gitcoin/passport-types";

import { StampSelector } from "./StampSelector";
import { PlatformDetails } from "./PlatformDetails";
import { PlatformScoreSpec } from "../context/scorerContext";
import { Button } from "./Button";
import { CancelButton } from "./CancelButton";

export type SideBarContentProps = {
  currentPlatform: PlatformScoreSpec | undefined;
  currentProviders: PlatformGroupSpec[] | undefined;
  verifiedProviders: PROVIDER_ID[] | undefined;
  isLoading: boolean | undefined;
  verifyButton: JSX.Element | undefined;
  onClose: () => void;
  bannerConfig?: PlatformBanner;
};

export const SideBarContent = ({
  onClose,
  currentPlatform,
  currentProviders,
  verifiedProviders,
  isLoading,
  verifyButton,
  bannerConfig,
}: SideBarContentProps): JSX.Element => {
  return (
    <DrawerContent
      style={{
        backgroundColor: "rgb(var(--color-background))",
        border: "1px solid rgb(var(--color-foreground-5))",
        borderRadius: "6px",
      }}
    >
      <CancelButton
        onClose={onClose}
        className={`visible z-10 text-color-1 md:invisible absolute right-2 top-0`}
        width={42}
        height={42}
      />
      {currentPlatform && currentProviders ? (
        <div className="overflow-auto p-10 text-gray-800">
          <DrawerHeader
            style={{
              fontWeight: "inherit",
              padding: "0",
            }}
          >
            <PlatformDetails
              currentPlatform={currentPlatform}
              bannerConfig={bannerConfig}
              verifiedProviders={verifiedProviders}
              onClose={onClose}
            />
          </DrawerHeader>
          {verifyButton}
          <Button variant="secondary" onClick={onClose} className="mt-4 w-full md:hidden">
            Close
          </Button>
          <DrawerBody
            style={{
              padding: "0",
            }}
          >
            <div>
              <StampSelector currentProviders={currentProviders} verifiedProviders={verifiedProviders} />
            </div>
          </DrawerBody>
        </div>
      ) : (
        <div>
          <DrawerHeader>
            <div className="mt-10 flex flex-col md:flex-row">
              <div className="w-full text-center md:py-8 md:pr-8">The requested Platform or Provider was not found</div>
            </div>
          </DrawerHeader>
        </div>
      )}
    </DrawerContent>
  );
};
