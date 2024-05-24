import React, { useCallback, useContext, useEffect } from "react";
import { Button } from "./Button";
import { Spinner, useToast } from "@chakra-ui/react";
import { PROVIDER_ID, StampPatch, ValidResponseBody, VerifiableCredential } from "@gitcoin/passport-types";
import { fetchVerifiableCredential } from "@gitcoin/passport-identity";
import { IAM_SIGNATURE_TYPE, iamUrl } from "../config/stamp_config";
import { createSignedPayload } from "../utils/helpers";
import { useWalletStore } from "../context/walletStore";
import { useDatastoreConnectionContext } from "../context/datastoreConnectionContext";
import { CeramicContext } from "../context/ceramicContext";
import { DoneToastContent } from "./DoneToastContent";

type ZKEmailStatus = "idle" | "searching" | "proving" | "claiming" | "done";

const success = "../../assets/check-icon2.svg";

const searchForProviders = async (): Promise<PROVIDER_ID[]> => {
  // TODO Real thing

  await new Promise((resolve) => setTimeout(resolve, 3000));

  return [
    "Discord",
    "Linkedin",
    "githubContributionActivityGte#30",
    "githubContributionActivityGte#60",
    "githubContributionActivityGte#120",
    "CoinbaseDualVerification",
    "Google",
  ];
};

const generateProof = async (provider: PROVIDER_ID): Promise<string> => {
  // TODO Real thing

  await new Promise((resolve) => setTimeout(resolve, Math.floor(Math.random() * 9000 + 1000)));

  return "proof_" + provider;
};

const useClaimZKEmailStamps = () => {
  const { did } = useDatastoreConnectionContext();
  const address = useWalletStore((state) => state.address);
  const { handlePatchStamps } = useContext(CeramicContext);

  return useCallback(
    async (providers: PROVIDER_ID[]) => {
      if (!did || !address) return;

      const verifyCredentialsResponse = await fetchVerifiableCredential(
        iamUrl,
        {
          type: "EVMBulkVerify",
          types: providers,
          version: "0.0.0",
          address,
          proofs: {},
          signatureType: IAM_SIGNATURE_TYPE,
        },
        (data: any) => createSignedPayload(did, data)
      );

      const verifiedCredentials =
        providers.length > 0
          ? verifyCredentialsResponse.credentials?.filter((cred: any): cred is ValidResponseBody => !cred.error) || []
          : [];

      const stampPatches: StampPatch[] = providers.map((provider: PROVIDER_ID) => {
        const cred = verifiedCredentials.find((cred: any) => cred.record?.type === provider);
        if (cred) return { provider, credential: cred.credential as VerifiableCredential };
        else return { provider };
      });

      await handlePatchStamps(stampPatches);
    },
    [did, address, handlePatchStamps]
  );
};

export const ZKEmail = ({ className }: { className: string }) => {
  const [status, setStatus] = React.useState<ZKEmailStatus>("idle");
  const [providersFound, setProvidersFound] = React.useState<string[]>([]);
  const [proofs, setProofs] = React.useState<string[]>([]);
  const isLoading = status === "searching" || status === "proving";
  const claimStamps = useClaimZKEmailStamps();
  const toast = useToast();

  const reset = () => {
    setStatus("idle");
    setProvidersFound([]);
    setProofs([]);
  };

  const onClick = async () => {
    if (status !== "idle") {
      reset();
      return;
    }

    setStatus("searching");

    const providers = await searchForProviders();
    setProvidersFound(providers);

    setStatus("proving");

    await Promise.all(
      providers.map(async (provider) => {
        const proof = await generateProof(provider);
        setProofs((proofs) => [...proofs, proof]);
      })
    );

    setStatus("claiming");

    claimStamps(providers);

    setStatus("done");
  };

  useEffect(() => {
    if (status === "done") {
      toast({
        duration: 9000,
        isClosable: true,
        render: (result: any) => (
          <DoneToastContent
            title="Success"
            message={`Auto-verified ${proofs.length} stamps!`}
            icon={success}
            result={result}
          />
        ),
      });
    }
  }, [status]);

  return (
    <div className={`flex items-center ${className}`}>
      <Button className="w-full" onClick={onClick} disabled={isLoading}>
        <div className="gap-4 flex items-center justify-start w-full">
          <div className="flex items-center w-10 justify-center">
            {isLoading ? <Spinner size="sm" /> : <img src="/assets/zk-email.png" />}
          </div>
          {(() => {
            switch (status) {
              case "idle":
                return "Sign in with ZK Email";
              case "searching":
                return "Searching inbox...";
              case "proving":
                return `Generating proofs (${proofs.length} of ${providersFound.length})`;
              case "claiming":
                return `Claiming ${proofs.length} stamps...`;
              case "done":
                return `Auto-verified ${proofs.length} stamps!`;
            }
          })()}
        </div>
      </Button>
    </div>
  );
};
