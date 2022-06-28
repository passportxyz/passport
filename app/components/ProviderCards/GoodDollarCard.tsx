// --- React Methods
import React, { useCallback, useContext, useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom"; // --- Datadog
import { datadogLogs } from "@datadog/browser-logs";

// --- Identity tools
import { fetchVerifiableCredential } from "@gitcoin/passport-identity/dist/commonjs/src/credentials";

// --- GoodDollar
import { useIsAddressVerified } from "@gooddollar/web3sdk-v2";
import { LoginButton, createLoginLink, parseLoginResponse } from "@gooddollar/goodlogin-sdk";

// pull context
import { UserContext } from "../../context/userContext";

import { PROVIDER_ID, Stamp } from "@gitcoin/passport-types";

// --- import components
import { Card } from "../Card";
import { Box, Button, ButtonGroup, useDisclosure, useToast, Alert, Spinner, AlertTitle } from "@chakra-ui/react";
import { DoneToastContent } from "../DoneToastContent";

import { Envs } from "@gooddollar/web3sdk-v2";
import { GoodDollarVerifyModal } from "./GoodDollarVerifyModal";
import { VerifyModal } from "../VerifyModal";

const providerId: PROVIDER_ID = "GoodDollar";

export default function GoodDollarCard(): JSX.Element {
  const { address, signer, handleAddStamp, allProvidersState } = useContext(UserContext);
  const [credentialResponse, SetCredentialResponse] = useState<Stamp | undefined>(undefined);
  const [credentialResponseIsLoading, setCredentialResponseIsLoading] = useState(false);
  const [verificationInProgress, setVerificationInProgress] = useState(false);
  const [getVerified, setGetVerified] = useState(false);

  const [isWhitelisted] = useIsAddressVerified(address || "");
  const { isOpen, onOpen, onClose } = useDisclosure();
  const toast = useToast();

  const [searchParams, setSearchParams] = useSearchParams();

  // console.log({ isWhitelisted, address, credentialResponseIsLoading, searchParams }, searchParams.get("login"));
  //TODO: verify all these details
  const gooddollarLinkDev = createLoginLink({
    redirectLink: Envs[process.env.NEXT_PUBLIC_GOODDOLLAR_ENV || "fuse"].dappUrl + "/AppNavigation/LoginRedirect",
    v: "Gitcoin Passport",
    web: "https://passport.gitcoin.co",
    id: "",
    r: [],
    rdu: window.location.href,
  });

  const clearLogin = useCallback(() => {
    const loginParam = searchParams.get("login") || searchParams.get("verified");
    if (loginParam) {
      searchParams.delete("login");
      searchParams.delete("verified");
      setSearchParams(searchParams);
    }
  }, [searchParams, setSearchParams]);

  const handleModalOnClose = useCallback((): void => {
    onClose(); //this needs to be first to prevent loop in jest tests
    setCredentialResponseIsLoading(false);
    setVerificationInProgress(false);
    setGetVerified(false);
  }, [setVerificationInProgress, onClose]);

  const handleFetchGoodCredential = useCallback(
    async (walletAddress: string, signedResponse?: any): Promise<void> => {
      try {
        //TODO: which address are we passing to credential?

        setCredentialResponseIsLoading(true);
        // console.log("getting credential");

        const credential = await fetchVerifiableCredential(
          process.env.NEXT_PUBLIC_DPOPP_IAM_URL || "",
          {
            type: "GoodDollar",
            version: "0.0.0",
            address: address || "",
            proofs: {
              valid: "true",
              whitelistedAddress: walletAddress,
              signedResponse,
            },
          },
          signer as { signMessage: (message: string) => Promise<string> }
        );

        // console.log("setting credential", credential);
        SetCredentialResponse({
          provider: providerId,
          credential: credential.credential,
        });
      } catch (e) {
        datadogLogs.logger.error("Verification Error", { error: e, provider: providerId });
        handleModalOnClose(); //make sure we close the modal to prevent retry loop by LoginButton (at least on jest testing)
        toast({
          id: "gd-failed-verification",
          duration: 2500,
          isClosable: true,
          status: "error",
          title: "Your GoodDollar verification failed. Try again!",
        });
      } finally {
        // console.log("setting credential finally");
        setCredentialResponseIsLoading(false);
      }
    },
    [address, signer, toast, setCredentialResponseIsLoading, SetCredentialResponse, handleModalOnClose]
  );

  const handleUserVerify = (): void => {
    // console.log({ credentialResponse });
    handleAddStamp(credentialResponse!)
      .then(() => datadogLogs.logger.info("Successfully saved Stamp", { provider: providerId }))
      .catch((e) => {
        datadogLogs.logger.error("Error Saving Stamp", { error: e, provider: providerId });
      })
      .finally(() => {
        setVerificationInProgress(false);
      });
    onClose();
    // Custom Success Toast
    toast({
      duration: 5000,
      isClosable: true,
      render: (result: any) => <DoneToastContent providerId={providerId} result={result} />,
    });
  };

  //once user is back from login with gooddolalr or face verification we can use this helper to trigger the stamp verificaiton
  const onGoodDollarRedirect = useCallback(
    async (verifiedAddress: string, signedResponse?: any) => {
      setVerificationInProgress(true);
      SetCredentialResponse(undefined);
      onOpen();
      await handleFetchGoodCredential(verifiedAddress, signedResponse);
    },
    [SetCredentialResponse, setVerificationInProgress, handleFetchGoodCredential, onOpen]
  );

  //handle LoginButton result form redirect back
  const goodDollarLoginCallback = useCallback(
    async (signedResponse: any) => {
      clearLogin();
      // console.log({ data });
      if (signedResponse.error) {
        toast({
          id: "gd-login-denied",
          duration: 2500,
          isClosable: true,
          status: "error",
          title: "Request to login was denied!",
        });
        return;
      }

      const parsed = await parseLoginResponse(signedResponse);
      onGoodDollarRedirect(parsed.walletAddrress.value, signedResponse);
    },
    [onGoodDollarRedirect, clearLogin, toast]
  );

  useEffect(() => {
    //reopen modal whe comming back from gooddollar login redirect, this will trigger the GoodDollar LoginButton callback(goodDollarLoginCallback)
    // so no need for onGoodDollarRedirect
    if (searchParams.get("login")) {
      // console.log("opening modal");
      onOpen();
    }

    //in case wallet is whitelisted after choosing face verification, we can issue a credential
    //in case user just passed face verification this will be triggered once isWhitelisted is true (useIsAddressVerified should be reactive)
    if (isWhitelisted && searchParams.get("verified")) {
      // console.log("opening modal verified");

      onGoodDollarRedirect(address!);
    }
  }, [searchParams, onOpen, isWhitelisted, address, onGoodDollarRedirect]);

  const gooddollarWidget = (
    <Box display="flex" alignItems="center" justifyContent="center" width="100%" py={6}>
      <ButtonGroup>
        <LoginButton
          data-testid="button-verify-gooddollar"
          // className="verify-btn"
          onLoginCallback={goodDollarLoginCallback}
          gooddollarlink={gooddollarLinkDev}
          rdu={window.location.href}
        >
          <Button data-testid="modal-gd-connect" colorScheme="purple" mr={2}>
            Connect Exisitng
          </Button>
        </LoginButton>
        <Button
          data-testid="button-fvverify-gooddollar"
          colorScheme="purple"
          mr={2}
          onClick={() => setGetVerified(true)}
        >
          Get Verified
        </Button>
      </ButtonGroup>
      <GoodDollarVerifyModal
        isOpen={getVerified}
        onClose={handleModalOnClose}
        // stamp={{ provider: "GoodDollar", credential: { credentialSubject: { address } } }}
        stamp={undefined}
        isLoading={false}
      />
    </Box>
  );
  const issueCredentialWidget = (
    <div>
      <button
        data-testid="button-getverified-gooddollar"
        className="verify-btn"
        onClick={() => {
          SetCredentialResponse(undefined);
          if (isWhitelisted) {
            setVerificationInProgress(true);
            handleFetchGoodCredential(address || "");
          }
          onOpen();
        }}
      >
        Login with GoodDolar Or Get Verified
      </button>
      <VerifyModal
        title="GoodDollar Liveness and Uniqueness Verification"
        isOpen={isOpen}
        onClose={handleModalOnClose}
        stamp={credentialResponse}
        handleUserVerify={handleUserVerify}
        verifyData={credentialResponse ? <></> : gooddollarWidget}
        isLoading={credentialResponseIsLoading}
      />
      <Alert
        hidden={!credentialResponseIsLoading}
        status="warning"
        data-testid="signature-waiting-alert"
        position={"fixed"}
        top={"30%"}
      >
        <Spinner thickness="4px" speed="0.65s" emptyColor="gray.200" color="orange.500" size="md" />
        <AlertTitle ml={4}> Waiting for wallet signature</AlertTitle>
      </Alert>
    </div>
  );

  return (
    <Card
      isLoading={verificationInProgress}
      providerSpec={allProvidersState[providerId]!.providerSpec}
      verifiableCredential={allProvidersState[providerId]!.stamp?.credential}
      issueCredentialWidget={issueCredentialWidget}
    />
  );
}
