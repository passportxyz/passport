// --- React Methods
import React, { useState, useEffect } from "react";

// --- Assets/Artefacts
import "./App.css";
import dpoppLogofrom from "./assets/dpoppLogo.svg";

// --- Wallet connection utilities
import { initWeb3Onboard } from "./utils/onboard";
import { OnboardAPI } from "@web3-onboard/core/dist/types";
import { useConnectWallet, useWallets } from "@web3-onboard/react";
import { JsonRpcSigner, Web3Provider } from "@ethersproject/providers";

// --- Identity Tools
import { ProofRecord, VerifiableCredential } from "@dpopp/types";
import { fetchVerifiableCredential, verifyCredential, verifyMerkleProof, generateMerkle } from "@dpopp/identity/src";
// - @workaround to import @spruceid/didkit-wasm
// issue: when imported directly vite separates the .wasm from the .js and bindings fail
// fix: copying the library into a workspace avoids .vites caching mechanism
import * as DIDKit from "@dpopp/identity/dist/didkit-browser";

// set the iamUrl to be used for new verifications (@TODO: this should be fed via the .env)
const iamUrl = "http://localhost:65535/api/";

function App(): JSX.Element {
  // Use onboard to control the current provider/wallets
  const [{ wallet }, connect, disconnect] = useConnectWallet();
  // const [{ chains, connectedChain, settingChain }, setChain] = useSetChain();
  const connectedWallets = useWallets();
  const [web3Onboard, setWeb3Onboard] = useState<OnboardAPI | undefined>();
  const [label, setLabel] = useState<string | undefined>();
  const [address, setAddress] = useState<string | undefined>();
  const [signer, setSigner] = useState<JsonRpcSigner | undefined>();
  const [signature, setSignature] = useState<string | undefined>();
  const [record, setRecord] = useState<false | ProofRecord | undefined>();
  const [challenge, setChallenge] = useState<false | VerifiableCredential | undefined>();
  const [credential, setCredential] = useState<false | VerifiableCredential | undefined>();
  const [verifiedMerkle, setVerifiedMerkle] = useState<boolean | undefined>();
  const [verifiedCredential, setVerifiedCredential] = useState<boolean | undefined>();

  // Init onboard to enable hooks
  useEffect((): void => {
    setWeb3Onboard(initWeb3Onboard);
  }, []);

  // Update on wallet connect
  useEffect((): void => {
    // no connection
    if (!connectedWallets.length) {
      setLabel(undefined);
      setAddress(undefined);
      setRecord(undefined);
      setSigner(undefined);
      // these are set as part of the verification flow demo (this will be replaced by @dpopp/storage)
      setSignature(undefined);
      setChallenge(undefined);
      setCredential(undefined);
      setVerifiedMerkle(undefined);
      setVerifiedCredential(undefined);
    } else {
      // record connected wallet details
      setLabel(wallet?.label);
      setAddress(wallet?.accounts[0].address);
      // get the signer from an ethers wrapped Web3Provider
      setSigner(new Web3Provider(connectedWallets[0]?.provider).getSigner());
      // flaten array for storage
      const connectedWalletsLabelArray = connectedWallets.map(({ label }) => label);
      // store in localstorage
      window.localStorage.setItem("connectedWallets", JSON.stringify(connectedWalletsLabelArray));
    }
  }, [connectedWallets]);

  // Connect wallet on reload
  useEffect((): void => {
    // retrieve localstorage state
    const previouslyConnectedWallets = JSON.parse(window.localStorage.getItem("connectedWallets") || "[]") as string[];
    if (previouslyConnectedWallets?.length) {
      /* eslint-disable no-inner-declarations */
      async function setWalletFromLocalStorage(): Promise<void> {
        void (await connect({
          autoSelect: {
            label: previouslyConnectedWallets[0],
            disableModals: true,
          },
        }));
      }
      // restore from localstorage
      setWalletFromLocalStorage().catch((e): void => {
        throw e;
      });
    }
  }, [web3Onboard, connect]);

  // Toggle connect/disconnect
  const handleConnection = (): void => {
    if (!address) {
      connect({}).catch((e) => {
        throw e;
      });
    } else {
      disconnect({
        label: label || "",
      }).catch((e) => {
        throw e;
      });
    }
  };

  // fetch an example VC from the IAM server
  const handleFetchCredential = (): void => {
    fetchVerifiableCredential(
      iamUrl,
      {
        address: address || "",
        type: "Simple",
        version: "0.0.0",
        proofs: {
          valid: "true",
          username: "test",
        },
      },
      signer
    )
      .then((res): void => {
        setSignature(res.signature);
        setRecord(res.record);
        setChallenge(res.challenge);
        setCredential(res.credential);
        // reset verification
        setVerifiedMerkle(undefined);
        setVerifiedCredential(undefined);
      })
      .catch((e): void => {
        throw e;
      });
  };

  // Verify the example VC returned from the IAM server
  const handleVerifyCredential = (): void => {
    if (record && credential) {
      // Recreate the merkle root
      const merkle = generateMerkle(record);
      // extract a single proof to test is a secret matches the proof in the root
      const matchingProof = merkle.proofs.username;
      const matchingSecret = record.username || "";
      const matchingRoot = credential.credentialSubject.root || "";
      // check if the proof verifies this content
      const verifiedProof = verifyMerkleProof(matchingProof, matchingSecret, matchingRoot);
      // merkle is verified
      setVerifiedMerkle(verifiedProof);
      // verify that the VC was generated by the trusted authority
      verifyCredential(DIDKit, credential)
        .then((verifiedVC): void => {
          setVerifiedCredential(verifiedVC);
        })
        .catch((e): void => {
          throw e;
        });
    }
  };

  return (
    <div className="bg-violet-700 font-librefranklin text-gray-100 min-h-max font-miriam-libre min-h-default">
      <div className="container px-5 py-24 mx-auto">
        <div className="mx-auto flex flex-wrap">
          <div className="w-1/2 w-full py-6 mb-6">
            <img src={dpoppLogofrom} className="App-logo" alt="logo" />
            <div className="font-miriam-libre text-gray-050 mt-10 font-normal font-bold leading-relaxed">
              <p className="text-6xl">
                Gitcoin
                <br />
                ID Passport
              </p>
            </div>
            <div className="font-libre-franklin md:w-1/3 mt-10 text-xl">
              Gitcoin ID Passport is an identity aggregator of the top identity providers in the web3 space into one
              transportable identity that proves your personhood.
            </div>
            <div className="mb-10 mt-10 md:w-1/4">
              <button
                data-testid="connectWalletButton"
                className="bg-gray-100 text-violet-500 rounded-lg py-4 px-20 min-w-full"
                onClick={handleConnection}
              >
                <p className="text-base">{address ? `Disconnect from ${label || ""}` : "Get Started"}</p>
              </button>
              {address ? <div className="pt-3">Connected to: {JSON.stringify(address, null, 2)}</div> : null}
            </div>
            <a className="underline">Why use your wallet as your identity?</a>
            <button
              className="bg-gray-100 mb-10 min-w-full mt-10 px-20 py-4 rounded-lg text-violet-500"
              onClick={handleFetchCredential}
            >
              Issue a Verifiable Credential
            </button>
            {challenge ? <p>✅ Challenged received ({challenge.credentialSubject.challenge}) </p> : null}
            {challenge ? <p>✅ Challenged signed ({signature}) </p> : null}
            {credential ? <p>✅ Credential issued: </p> : null}
            {credential ? <pre>{JSON.stringify(credential, null, 4)}</pre> : null}
            {record ? <p>✅ Provided with the following information: </p> : null}
            {record ? <pre>{JSON.stringify(record, null, 4)}</pre> : null}
            {credential ? (
              <button
                className="bg-gray-100 mb-10 min-w-full mt-10 px-20 py-4 rounded-lg text-violet-500"
                onClick={handleVerifyCredential}
              >
                Verify Credential
              </button>
            ) : null}
            {verifiedMerkle ? (
              <p>✅ MerkleProof verifiably contains the passed in username ({record && record.username})</p>
            ) : null}
            {verifiedCredential ? (
              <p>✅ Credential has verifiably been issued by {credential && credential.issuer} </p>
            ) : null}
          </div>
          <div className="lg:w-1/2 w-full lg:h-auto object-cover object-center rounded"></div>
        </div>
      </div>
    </div>
  );
}

export default App;
