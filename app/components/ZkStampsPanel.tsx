import { PlatformSpec } from "@gitcoin/passport-platforms";
import { PLATFORM_ID, PROVIDER_ID, Stamp } from "@gitcoin/passport-types";
import React, { useCallback, useContext, useEffect, useMemo } from "react";
import { getPlatformSpec } from "../config/platforms";
import { CeramicContext } from "../context/ceramicContext";
import { useZkStore, ZkStampInput } from "../context/zkContext";
import { BarretenbergBackend, CompiledCircuit } from "@noir-lang/backend_barretenberg";
import { Noir } from "@noir-lang/noir_js";
import zk_passport_score from "../circuits/zk_passport_score.json";
import { LoadButton } from "./LoadButton";
import { hexlify, getBytes } from "ethers";

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
  const { stampInputs, stampsByProviderHash, addStamps, loadStamps, clearStamps } = useZkStore();

  useEffect(loadStamps, []);

  console.log("geri verifiedPlatforms", verifiedPlatforms);
  console.log("geri stampInputs", stampInputs);

  const addStampsToCart = () => {
    const zkStamps: Record<string, string> = {};
    const zkStampsList: ZkStampInput[] = [];
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
            zkStampsList.push({
              providerName: providerState.providerSpec.name,
              provider: providerHash,
              hash: zkStamps[providerHash],
            });
          }
        }
      }
    }
    console.log("geri zkStampsList", zkStampsList);
    addStamps(zkStampsList);
  };

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
        providers: orderStampProvidersForZkProof.map((providerHash) => Array.from(getBytes(providerHash))),
        stamp_hashs: orderStampProvidersForZkProof.map((providerHash) => {
          if (stampsByProviderHash[providerHash]) {
            // return stampsByProviderHash[providerHash].hash.slice(2);
            // return stampsByProviderHash[providerHash].hash;
            // return [
            //   1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
            //   30, 31, 32,
            // ];
            console.log("geri stamp hashes:", stampsByProviderHash[providerHash].hash);
            console.log("geri stamp hashes:", Array.from(getBytes(stampsByProviderHash[providerHash].hash)));
            return Array.from(getBytes(stampsByProviderHash[providerHash].hash));
          } else {
            return Array.from(getBytes("0x0000000000000000000000000000000000000000000000000000000000000000"));
          }
        }),
        pub_key_x: [
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
        ],
        pub_key_y: [
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
          "1",
        ],
        signatures: [
          [
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
          ],
          [
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
            "1",
          ],
        ],

        trusted_signer: "123",
      };
      console.log("geri input", input);

      const input1 = {
        // stamp_hashs: orderStampProvidersForZkProof.map((providerHash) => {
        //   if (stampsByProviderHash[providerHash]) {
        //     // return stampsByProviderHash[providerHash].hash.slice(2);
        //     // return stampsByProviderHash[providerHash].hash;
        //     return [
        //       1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
        //       30, 31, 32,
        //     ];
        //   } else {
        //     return "0000000000000000000000000000000000000000000000000000000000000000";
        //   }
        // }),
        // providers: orderStampProvidersForZkProof.map((providerHash) => getBytes(providerHash)),
        stamp_hashs: [
          [
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
            30, 31, 32,
          ],
          [
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
            30, 31, 32,
          ],
        ],
        providers: [
          [
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
            30, 31, 32,
          ],
          [
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
            30, 31, 32,
          ],
        ],
        signatures: [
          [
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
            30, 31, 32, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
            27, 28, 29, 30, 31, 32,
          ],
          [
            1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29,
            30, 31, 32, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26,
            27, 28, 29, 30, 31, 32,
          ],
        ],
        pub_key_x: [
          1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
          31, 32,
        ],
        pub_key_y: [
          1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30,
          31, 32,
        ],
        trusted_signer: 123456,
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

  const zkStampListDisplay = stampInputs.map((stampInput) => {
    return (
      <li>
        <pre>
          Stamp {stampInput.hash} from {stampInput.providerName}
        </pre>
      </li>
    );
  });
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
      <ul>{zkStampListDisplay}</ul>
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
      <LoadButton
        className="button-verify mt-10 w-full"
        //  disabled={!submitted && !canSubmit}
        onClick={addStampsToCart}
      >
        Add Stamps
      </LoadButton>

      <LoadButton
        className="button-verify mt-10 w-full"
        //  disabled={!submitted && !canSubmit}
        onClick={clearStamps}
      >
        Clear Stamps
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
