import { PlatformSpec } from "@gitcoin/passport-platforms";
import { PLATFORM_ID, PROVIDER_ID, Stamp } from "@gitcoin/passport-types";
import React, { useCallback, useContext, useMemo } from "react";
import { getPlatformSpec } from "../config/platforms";
import { CeramicContext } from "../context/ceramicContext";
import { BarretenbergBackend, CompiledCircuit } from "@noir-lang/backend_barretenberg";
import { Noir } from "@noir-lang/noir_js";
import zk_passport_score from "../circuits/zk_passport_score.json";
import { LoadButton } from "./LoadButton";
import pako from "pako";
import { hexlify } from "ethers";

type StampsListProps = {
  onChainPlatformIds: PLATFORM_ID[];
  className?: string;
};

const supportedProviders: Record<string, boolean> = {
  "0x6f028453ddea055c2bfd6baeffa906ae6954e0bb90083e4b76c86058e9e2c08a": true,
  "0xf610f88085f5955bccb50431e1315a28335522d87be5000ff334274cc9985741": true,
};

const supportedProviderNames = {
  Facebook: true,
  Google: true,
};

const orderStampProvidersForZkProof = [
  "0x6f028453ddea055c2bfd6baeffa906ae6954e0bb90083e4b76c86058e9e2c08a", // Facebook
  "0xf610f88085f5955bccb50431e1315a28335522d87be5000ff334274cc9985741", // Google
];

export const ZkStampsPanel = ({ className }: { className: string }) => {
  const { verifiedPlatforms, allProvidersState } = useContext(CeramicContext);
  const [provingInProgress, setProvingInProgress] = React.useState(false);
  const [proof, setProof] = React.useState("");
  const zkStamps: Record<string, string> = {};

  console.log("geri verifiedPlatforms", verifiedPlatforms);

  for (const _providerId in allProvidersState) {
    const providerId = _providerId as PROVIDER_ID;
    const providerState = allProvidersState[providerId];
    const providerHash = providerState?.providerSpec?.hash;
    // console.log("geri hash ", hash, typeof hash);
    if (providerHash) {
      if (supportedProviders[providerHash] && providerState?.stamp) {
        console.log("geri providerState?.stamp", providerState.providerSpec.hash);
        const stampHash = providerState.stamp.credential.credentialSubject.hash;
        if (stampHash) {
          zkStamps[providerHash] = "0x" + Buffer.from(stampHash.split(":")[1], "base64").toString("hex");
        }
      }
    }
  }

  const computeProof = async () => {
    setProvingInProgress(true);
    try {
      console.log("Computing proof ...");
      // here's where the magic happens
      const backend = new BarretenbergBackend(zk_passport_score as CompiledCircuit);
      const noir = new Noir(zk_passport_score as CompiledCircuit, backend);

      console.log("geri bn stuff");
      // const bn = BigInt("0xffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff");
      const bn = BigInt("0xffff");
      console.log("geri bn", bn.toString());
      const input = {
        hashes1: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
        hashes2: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
        providers1: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
        providers2: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
      };
      const input1 = {
        stampHashes: orderStampProvidersForZkProof.map((providerHash) => {
          if (zkStamps[providerHash]) {
            return zkStamps[providerHash];
          } else {
            return "0x0000000000000000000000000000000000000000000000000000000000000000";
          }
        }),
        providerHashes: orderStampProvidersForZkProof,
        providers1: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
        providers2: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"],
      };

      // const input = {
      //   a: 3,
      //   b: 1,
      //   c: 1,
      //   d: 1,
      //   e: 1,
      //   f: 1,
      //   x: 1,
      //   y: 2,
      // };
      console.log("zk_passport_score", zk_passport_score);
      console.log("logs", "Generating proof... ⌛");
      const proof = await noir.generateFinalProof(input);
      const publicInputs = Array.from(proof.publicInputs.entries());
      const jsonProof = JSON.stringify({
        proof: Array.from(proof.proof),
        publicInputs: publicInputs,
      });
      // console.log("logs", "Generating proof... ✅");
      // console.log("results", proof);
      // console.log("results", proof.proof);
      // console.log("results", jsonProof);
      // let binaryString = pako.gzip(jsonProof, { to: 'string' });

      // setProof(Buffer.from(binaryString).toString("base64"));
      setProof(jsonProof);
    } catch (e) {
      console.error("Error while generating proof");
      console.error(e);
    }
    setProvingInProgress(false);
  };

  const copyProofToClipboard = () => {
    navigator.clipboard.writeText(proof);
  };

  console.log("geri allProvidersState", allProvidersState);
  return (
    <div
      className={`flex flex-col items-center rounded border border-foreground-3 bg-gradient-to-b from-background to-background-2 text-xl text-foreground-2 ${className}`}
    >
      <div className="my-2">Stamps for ZkProof</div>
      {/* <div className="h-[2px] w-full bg-gradient-to-r from-background via-foreground-2 to-background" />
      <StampsList className="m-6" onChainPlatformIds={onChainPlatformIds} />
      <InitiateOnChainButton className="mb-2" />
      <span className={`mb-2 text-sm ${anyOnchain ? "visible" : "invisible"}`}>
        <OnchainMarker /> = Onchain
      </span> */}
      <LoadButton
        className="button-verify mt-10 w-full"
        isLoading={provingInProgress}
        //  disabled={!submitted && !canSubmit}
        onClick={computeProof}
      >
        Generate Zk Proof
      </LoadButton>
      <LoadButton
        className="button-verify mt-10 w-full"
        isLoading={provingInProgress}
        //  disabled={!submitted && !canSubmit}
        onClick={copyProofToClipboard}
      >
        Copy Zk Proof to clipboard
      </LoadButton>
      {proof.length}
      <a href={`http://localhost:3100/?proof=${proof}`}> Back to the voting App </a>
      <div>
        {proof.match(/.{1,64}/g)?.map((str: string) => (
          <pre>{str}</pre>
        ))}
      </div>
    </div>
  );
};
