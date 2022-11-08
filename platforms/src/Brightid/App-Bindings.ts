/* eslint-disable */
import { AppContext, Platform, ProviderPayload } from "../types";

export class BrightidPlatform implements Platform {
  platformId = "Brightid";
  path = "brightid";
  clientId: string = null;
  redirectUri: string = null;

  async getProviderPayload(appContext: AppContext): Promise<ProviderPayload> {
    return {};
  }

  getOAuthUrl(state: string): Promise<string> {
    throw new Error("Method not implemented.");
  }

  verifyButton(): JSX.Element {
    return (
      <>
        <button
          disabled={!canSubmit}
          onClick={async () => {
            setVerificationInProgress(true);
            // primary check to see if users did is verified
            const isVerified = await handleVerifyContextId();
            if (isVerified) {
              handleFetchCredential();
            } else {
              // uncheck the switch after this connection modal shows
              setSelectedProviders([]);
              onOpen();
            }
          }}
          data-testid="button-verify-brightid"
          className="sidebar-verify-btn"
        >
          {verifiedProviders.length > 0 ? <p>Save</p> : <p>Verify</p>}
        </button>

        <Modal isOpen={isOpen} onClose={onClose}>
          <ModalOverlay />
          <ModalContent>
            {isLoading ? (
              <div className="p-20 text-center">
                <Spinner data-testid="loading-spinner" />
              </div>
            ) : (
              <>
                <ModalHeader px={8} pb={1} pt={6} textAlign="center">
                  {"Verify Bright ID Stamp Data"}
                </ModalHeader>
                <ModalCloseButton mr={2} />
                <ModalBody p={0}>
                  <div className="px-8 pb-4 text-gray-500">
                    {/* RSX Element passed in to show desired stamp output */}
                    {brightIdSponsorshipWidget}
                  </div>
                </ModalBody>
              </>
            )}
          </ModalContent>
        </Modal>
      </>
    );
  }
}
