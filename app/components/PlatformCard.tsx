// --- React Methods
import { useCallback, useContext, useEffect, useState } from "react";
import { useRouter } from "next/router";

// --- Chakra UI Elements
import { useDisclosure, Menu, MenuButton, MenuList, MenuItem } from "@chakra-ui/react";
import { LinkIcon, ShieldCheckIcon } from "@heroicons/react/20/solid";
import { ChevronDownIcon } from "@heroicons/react/20/solid";

// --- Types
import { PLATFORM_ID, PROVIDER_ID } from "@gitcoin/passport-types";
import { PlatformSpec } from "@gitcoin/passport-platforms";
import { datadogLogs } from "@datadog/browser-logs";
import { datadogRum } from "@datadog/browser-rum";
import { STAMP_PROVIDERS, UpdatedPlatforms } from "../config/providers";

// --- Context
import { CeramicContext } from "../context/ceramicContext";
import { pillLocalStorage, UserContext } from "../context/userContext";

// --- Components
import { JsonOutputModal } from "./JsonOutputModal";
import { RemoveStampModal } from "./RemoveStampModal";
import { getStampProviderFilters } from "../config/filters";
import { graphql_fetch } from "../utils/helpers";
import { ethers } from "ethers";

type SelectedProviders = Record<PLATFORM_ID, PROVIDER_ID[]>;

type PlatformCardProps = {
  i: number;
  platform: PlatformSpec;
  selectedProviders: SelectedProviders;
  updatedPlatforms: UpdatedPlatforms | undefined;
  btnRef: React.MutableRefObject<undefined>;
  onOpen: () => void;
  setCurrentPlatform: React.Dispatch<React.SetStateAction<PlatformSpec | undefined>>;
  getUpdatedPlatforms: () => void;
  className?: string;
};

export const PlatformCard = ({
  i,
  platform,
  selectedProviders,
  updatedPlatforms,
  btnRef,
  onOpen,
  setCurrentPlatform,
  getUpdatedPlatforms,
  className,
}: PlatformCardProps): JSX.Element => {
  const [isOnChain, setIsOnChain] = useState(false);
  const { wallet } = useContext(UserContext);

  // import all providers
  const { allProvidersState, passportHasCacaoError, handleDeleteStamps } = useContext(CeramicContext);

  // stamp filter
  const router = useRouter();
  const { filter } = router.query;

  // useDisclosure to control JSON modal
  const {
    isOpen: isOpenJsonOutputModal,
    onOpen: onOpenJsonOutputModal,
    onClose: onCloseJsonOutputModal,
  } = useDisclosure();

  // useDisclosure to control stamp removal modal
  const {
    isOpen: isOpenRemoveStampModal,
    onOpen: onOpenRemoveStampModal,
    onClose: onCloseRemoveStampModal,
  } = useDisclosure();

  const disabled = passportHasCacaoError;

  // hide platforms based on filter
  const stampFilters = filter?.length && typeof filter === "string" ? getStampProviderFilters(filter) : false;
  const hidePlatform = stampFilters && !Object.keys(stampFilters).includes(platform.platform);
  if (hidePlatform) return <></>;

  // Feature Flag Guild Stamp
  if (process.env.NEXT_PUBLIC_FF_GUILD_STAMP !== "on" && platform.platform === "GuildXYZ") return <></>;

  // check on-chain status by checking if attestations exist for at least one provider of the stamp
  const checkOnChainStatus = useCallback(async () => {
    try {
      if (!process.env.NEXT_PUBLIC_EAS_INDEXER_URL) {
        throw new Error("NEXT_PUBLIC_EAS_INDEXER_URL is not defined");
      }
      // get the attestions for given user
      const res = await graphql_fetch(
        new URL(process.env.NEXT_PUBLIC_EAS_INDEXER_URL),
        `
        query GetAttestations($recipient: StringFilter, $attester: StringFilter) {
          attestations(where: {
            recipient: $recipient,
            attester: $attester
          }) {
            decodedDataJson
            timeCreated
          }
        }
      `,
        {
          recipient: { equals: ethers.getAddress(wallet?.accounts[0].address!) },
          attester: { equals: process.env.NEXT_PUBLIC_GITCOIN_ATTESTER_CONTRACT_ADDRESS },
        }
      );

      // sort the attestations by timeCreated in descending order
      const sortedAttestations = res.data.attestations.sort((a: any, b: any) => b.timeCreated - a.timeCreated);

      // find the latest timeCreated value
      const latestTimeCreated = sortedAttestations[0]?.timeCreated;

      // extract all providers with the latest timeCreated value
      const latestProviders: string[] = [];
      for (const attestation of sortedAttestations) {
        const decodedData = JSON.parse(attestation.decodedDataJson);
        const providerData = decodedData.find((data: any) => data.name === "provider");
        if (providerData && attestation.timeCreated === latestTimeCreated) {
          latestProviders.push(providerData.value.value);
        }
      }

      // check if all selected providers are present in the latest bulk of providers
      const isAllSelectedProvidersPresent = selectedProviders[platform.platform].every((provider) =>
        latestProviders.includes(provider)
      );

      // set the on-chain status
      setIsOnChain(isAllSelectedProvidersPresent);
    } catch (e: any) {
      datadogLogs.logger.error("Failed to check on-chain status", e);
      datadogRum.addError(e);
    }
  }, [wallet?.accounts]);

  useEffect(() => {
    if (selectedProviders[platform.platform].length > 0) {
      checkOnChainStatus();
    }
  }, [checkOnChainStatus]);

  // returns a single Platform card
  return (
    <div className={className} key={`${platform.name}${i}`}>
      <div className="relative flex h-full flex-col border border-accent-2 bg-background-2 p-0">
        <div className="flex flex-row p-6">
          <div className="flex h-10 w-10 flex-grow justify-center md:justify-start">
            {platform.icon ? (
              <img src={platform.icon} alt={platform.name} className="h-10 w-10" />
            ) : (
              <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M24.7999 24.8002H28.7999V28.8002H24.7999V24.8002ZM14 24.8002H18V28.8002H14V24.8002ZM3.19995 24.8002H7.19995V28.8002H3.19995V24.8002ZM24.7999 14.0002H28.7999V18.0002H24.7999V14.0002ZM14 14.0002H18V18.0002H14V14.0002ZM3.19995 14.0002H7.19995V18.0002H3.19995V14.0002ZM24.7999 3.2002H28.7999V7.2002H24.7999V3.2002ZM14 3.2002H18V7.2002H14V3.2002ZM3.19995 3.2002H7.19995V7.2002H3.19995V3.2002Z"
                  fill="var(--color-muted)"
                />
              </svg>
            )}
          </div>
          {updatedPlatforms &&
            platform?.enablePlatformCardUpdate &&
            updatedPlatforms[platform.name] !== true &&
            selectedProviders[platform.platform].length > 0 && (
              <div className="inline-flex h-6 items-center rounded-xl border border-accent-3 px-2 text-xs text-accent-3">
                Update
              </div>
            )}
        </div>
        <div className="flex justify-center px-2 py-0 pb-6 md:block md:justify-start md:px-6">
          <h1 className="mb-0 text-lg md:mb-3">{platform.name}</h1>
          <p className="pleading-relaxed hidden text-color-4 md:inline-block">{platform.description}</p>
        </div>
        <div className="mt-auto text-color-3">
          {selectedProviders[platform.platform].length > 0 ? (
            <>
              <Menu>
                <MenuButton disabled={disabled} className="verify-btn flex" data-testid="card-menu-button">
                  <div className="m-auto flex items-center justify-center">
                    {isOnChain ? <LinkIcon className="h-6 w-5 text-accent-3" /> : <></>}
                    <ShieldCheckIcon className="h-6 w-5 text-accent-3" />
                    <span className="mx-2 translate-y-[1px]">Verified</span>
                    <ChevronDownIcon className="h-6 w-6" />
                  </div>
                </MenuButton>
                <MenuList style={{ marginLeft: "16px" }}>
                  <MenuItem onClick={onOpenJsonOutputModal} data-testid="view-json">
                    View stamp JSON
                  </MenuItem>
                  <MenuItem
                    onClick={() => {
                      setCurrentPlatform(platform);
                      onOpen();
                      if (platform.enablePlatformCardUpdate) {
                        pillLocalStorage(platform.name);
                      }
                      getUpdatedPlatforms();
                    }}
                    data-testid="manage-stamp"
                  >
                    Manage stamp
                  </MenuItem>
                  <MenuItem onClick={onOpenRemoveStampModal} data-testid="remove-stamp">
                    Remove stamp
                  </MenuItem>
                </MenuList>
              </Menu>
              <JsonOutputModal
                isOpen={isOpenJsonOutputModal}
                onClose={onCloseJsonOutputModal}
                title={`${platform.name} JSON`}
                subheading={`You can find the ${platform.name} JSON data below`}
                jsonOutput={selectedProviders[platform.platform].map(
                  (providerId) => allProvidersState[providerId]?.stamp?.credential
                )}
              />
              <RemoveStampModal
                isOpen={isOpenRemoveStampModal}
                onClose={onCloseRemoveStampModal}
                title={`Remove ${platform.name} Stamp`}
                body={
                  "This stamp will be removed from your Passport. You can still re-verify your stamp in the future."
                }
                stampsToBeDeleted={
                  STAMP_PROVIDERS[platform.platform]?.reduce((all, stamp) => {
                    return all.concat(stamp.providers?.map((provider) => provider.name as PROVIDER_ID));
                  }, [] as PROVIDER_ID[]) || []
                }
                handleDeleteStamps={handleDeleteStamps}
                platformId={platform.name as PLATFORM_ID}
              />
            </>
          ) : (
            <button
              className="verify-btn"
              disabled={disabled}
              ref={btnRef.current}
              onClick={(e) => {
                if (platform.enablePlatformCardUpdate) {
                  pillLocalStorage(platform.platform);
                }
                setCurrentPlatform(platform);
                onOpen();
              }}
            >
              {platform.connectMessage}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
