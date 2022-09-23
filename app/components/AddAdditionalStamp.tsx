import { Switch } from "@chakra-ui/react";
import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";
import {
  fetchChallengeCredential,
  fetchVerifiableCredential,
} from "@gitcoin/passport-identity/dist/commonjs/src/credentials";
import {
  CredentialResponseBody,
  PROVIDER_ID,
  Stamp,
  VerifiableCredential,
  VerifiableCredentialRecord,
} from "@gitcoin/passport-types";
import { useContext, useEffect, useState } from "react";
import { getPlatformSpec, PlatformSpec } from "../config/platforms";
import { STAMP_PROVIDERS } from "../config/providers";
import { UserContext } from "../context/userContext";
import { AdditionalSignature, EVMStamp } from "../signer/utils";

export const AddAdditionalStamp = ({
  additionalSigner,
  stamp,
  stampAdded,
}: {
  additionalSigner: AdditionalSignature;
  stamp: EVMStamp;
  stampAdded: () => void;
}) => {
  const { address, signer } = useContext(UserContext);
  const [selectedProviders, setSelectedProviders] = useState<PROVIDER_ID[]>([]);
  const [verifiedProviders, setVerifiedProviders] = useState<PROVIDER_ID[]>([]);
  const [allSelected, setAllSelected] = useState(false);
  const [canSubmit, setCanSubmit] = useState(false);
  const [allProviderIds, setAllProviderIds] = useState<PROVIDER_ID[]>([]);

  useEffect(() => {
    if (selectedProviders.length !== verifiedProviders.length) {
      setCanSubmit(true);
    }
    if (selectedProviders.length === 0) {
      setCanSubmit(false);
    }
  }, [selectedProviders, verifiedProviders]);

  const spec = getPlatformSpec(stamp.platformType);
  const currentProviders = STAMP_PROVIDERS[stamp.platformType];

  // alter select-all state when items change
  useEffect(() => {
    // find all providerIds
    const providerIds =
      currentProviders?.reduce((all, stamp, i) => {
        return all.concat(stamp.providers?.map((provider) => provider.name as PROVIDER_ID));
      }, [] as PROVIDER_ID[]) || [];
    // should we select or deselect?
    const doSelect = (selectedProviders?.length || 0) < providerIds.length;

    // is everything selected?
    setAllSelected(!doSelect);
    setAllProviderIds(providerIds);
  }, [currentProviders, selectedProviders]);

  const handleFetchCredential = async () => {
    const iamUrl = process.env.NEXT_PUBLIC_PASSPORT_IAM_URL || "";

    const { challenge } = await fetchChallengeCredential(iamUrl, {
      type: "SignerChallenge",
      version: "0.0.0",
      address: address || "",
    });

    await fetchVerifiableCredential(
      iamUrl,
      {
        type: "Signer",
        types: selectedProviders,
        version: "0.0.0",
        address: address || "",
        proofs: {
          valid: address ? "true" : "false",
        },
        signer: {
          challenge: challenge,
          signature: additionalSigner?.sig,
          address: additionalSigner?.addr,
        },
      },
      signer as { signMessage: (message: string) => Promise<string> }
    )
      .then(async (verified: VerifiableCredentialRecord): Promise<(Stamp | undefined)[]> => {
        // because we provided a types array in the params we expect to receive a credentials array in the response...
        const vcs =
          verified.credentials
            ?.map((cred: CredentialResponseBody): Stamp | undefined => {
              if (!cred.error) {
                // add each of the requested/received stamps to the passport...
                return {
                  provider: cred.record?.type as PROVIDER_ID,
                  credential: cred.credential as VerifiableCredential,
                };
              }
            })
            .filter((v: Stamp | undefined) => v) || [];

        const actualVerifiedProviders = allProviderIds.filter(
          (providerId) =>
            !!vcs.find((vc: Stamp | undefined) => vc?.credential?.credentialSubject?.provider === providerId)
        );
        // both verified and selected should look the same after save
        setVerifiedProviders([...actualVerifiedProviders]);
        setSelectedProviders([...actualVerifiedProviders]);
        return vcs;
      })
      .catch((e: any): void => {
        datadogLogs.logger.error("Verification Error", { error: e, provider: spec?.platform });
        datadogRum.addError(e, { provider: spec?.platform });
        return undefined;
      });
  };

  return (
    <>
      <div className="flex w-full justify-start">
        <button onClick={stampAdded} className="float-left p-2">
          <img className="w-4" src="./assets/arrow.svg" alt="Back arrow" />
        </button>
      </div>

      <img className="w-6" src={spec?.icon} alt={spec?.description} />
      <p className="my-4 font-bold">{spec?.name}</p>
      <p className="mb-4">{spec?.description}</p>
      <div className="w-full px-4">
        <div className="flex w-full justify-between">
          <p>Data Points</p>
          <span
            className={`ml-auto py-2 text-sm ${
              !allSelected ? `cursor-pointer text-purple-connectPurple` : `cursor-default `
            } `}
            onClick={(e) => {
              // set the selected items by concating or filtering by providerId
              if (!allSelected) setSelectedProviders && setSelectedProviders(!allSelected ? allProviderIds : []);
            }}
          >
            {allSelected ? `Selected!` : `Select all`}
          </span>
        </div>
        <hr />
        {/* each of the available providers in this platform */}
        {currentProviders?.map((stamp, i) => {
          return (
            <div key={i} className="border-b py-4 px-6">
              <p className="ml-4 text-sm font-bold">{stamp.platformGroup}</p>
              <div className="flex flex-row justify-between">
                <ul className="marker:leading-1 list-disc marker:text-3xl ">
                  {stamp.providers?.map((provider, i) => {
                    return (
                      <li
                        className={`ml-4 ${
                          verifiedProviders?.indexOf(provider.name) !== -1 ? `text-green-500` : `text-gray-400`
                        }`}
                        key={`${provider.title}${i}`}
                      >
                        <div className="relative top-[-0.3em] text-sm text-gray-400">{provider.title}</div>
                      </li>
                    );
                  })}
                </ul>
                <div className="align-right flex">
                  <Switch
                    colorScheme="green"
                    size="lg"
                    isChecked={
                      stamp.providers?.reduce(
                        (isPresent, provider) => isPresent || selectedProviders?.indexOf(provider.name) !== -1,
                        false as boolean // typing the response - always bool
                      ) || false
                    }
                    onChange={(e) => {
                      // grab all provider_ids for this group of stamps
                      const providerIds = stamp.providers?.map((provider) => provider.name as PROVIDER_ID);

                      // set the selected items by concating or filtering by providerId
                      setSelectedProviders(
                        e.target.checked
                          ? (selectedProviders || []).concat(providerIds)
                          : (selectedProviders || []).filter((id) => !providerIds.includes(id))
                      );
                    }}
                  />
                </div>
              </div>
            </div>
          );
        })}
        <button
          disabled={!canSubmit}
          onClick={handleFetchCredential}
          data-testid="button-verify-ens"
          className="sidebar-verify-btn"
        >
          Verify
        </button>
      </div>
    </>
  );
};
