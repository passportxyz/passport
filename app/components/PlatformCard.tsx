// --- React Methods
import { useContext, useEffect } from "react";
import { useRouter } from "next/router";

// --- Chakra UI Elements
import { useDisclosure, Menu, MenuButton, MenuList, MenuItem } from "@chakra-ui/react";

// --- Types
import { PLATFORM_ID, PROVIDER_ID } from "@gitcoin/passport-types";
import { PlatformSpec } from "@gitcoin/passport-platforms";
import { PlatformGroupSpec, STAMP_PROVIDERS, UpdatedPlatforms } from "../config/providers";

// --- Context
import { CeramicContext } from "../context/ceramicContext";
import { pillLocalStorage } from "../context/userContext";

// --- Components
import { JsonOutputModal } from "./JsonOutputModal";
import { RemoveStampModal } from "./RemoveStampModal";
import { getStampProviderFilters } from "../config/filters";

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
}: PlatformCardProps): JSX.Element => {
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

  const disabled = passportHasCacaoError();

  // hide platforms based on filter
  const stampFilters = filter?.length && typeof filter === "string" ? getStampProviderFilters(filter) : false;
  const hidePlatform = stampFilters && !Object.keys(stampFilters).includes(platform.platform);
  if (hidePlatform) return <></>;

  // Hides Coinbase stamp if feature flag is off
  if (process.env.NEXT_PUBLIC_FF_COINBASE_STAMP === "off" && platform.platform === "Coinbase") return <></>;

  // returns a single Platform card
  return (
    <div className="w-1/2 p-2 md:w-1/2 xl:w-1/4" key={`${platform.name}${i}`}>
      <div className="relative flex h-full flex-col border border-gray-200 p-0">
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
                  fill="#161616"
                />
              </svg>
            )}
          </div>
          {updatedPlatforms &&
            platform?.enablePlatformCardUpdate &&
            updatedPlatforms[platform.name] !== true &&
            selectedProviders[platform.platform].length > 0 && (
              <div className="inline-flex h-6 items-center rounded-xl bg-yellow px-2 text-xs font-medium shadow-sm">
                Update
              </div>
            )}
        </div>
        <div className="flex justify-center py-0 px-6 pb-6 md:block md:justify-start">
          <h1 className="title-font mb-0 text-lg font-medium text-gray-900 md:mb-3">{platform.name}</h1>
          <p className="pleading-relaxed hidden md:inline-block">{platform.description}</p>
        </div>
        <div className="mt-auto">
          {selectedProviders[platform.platform].length > 0 ? (
            <>
              <Menu>
                <MenuButton disabled={disabled} className="verify-btn flex" data-testid="card-menu-button">
                  <div className="m-auto flex justify-center">
                    <svg
                      className="m-1 mr-2"
                      width="15"
                      height="16"
                      viewBox="0 0 15 16"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M0.449301 3.499C3.15674 3.46227 5.62356 2.42929 7.4998 0.75C9.37605 2.42929 11.8429 3.46227 14.5503 3.499C14.6486 4.0847 14.6998 4.68638 14.6998 5.30002C14.6998 10.0024 11.6945 14.0028 7.4998 15.4854C3.30511 14.0028 0.299805 10.0024 0.299805 5.30002C0.299805 4.68638 0.350982 4.0847 0.449301 3.499ZM10.8362 6.83638C11.1877 6.48491 11.1877 5.91506 10.8362 5.56359C10.4847 5.21212 9.91488 5.21212 9.56341 5.56359L6.5998 8.5272L5.4362 7.36359C5.08473 7.01212 4.51488 7.01212 4.16341 7.36359C3.81194 7.71506 3.81194 8.28491 4.16341 8.63638L5.96341 10.4364C6.31488 10.7879 6.88473 10.7879 7.2362 10.4364L10.8362 6.83638Z"
                        fill="#059669"
                      />
                    </svg>
                    Verified
                    <svg
                      className="relative m-1 mt-2 pl-1"
                      style={{ top: "1px" }}
                      width="11"
                      height="7"
                      viewBox="0 0 11 7"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M0.292787 1.29308C0.480314 1.10561 0.734622 1.00029 0.999786 1.00029C1.26495 1.00029 1.51926 1.10561 1.70679 1.29308L4.99979 4.58608L8.29279 1.29308C8.38503 1.19757 8.49538 1.12139 8.61738 1.06898C8.73939 1.01657 8.87061 0.988985 9.00339 0.987831C9.13616 0.986677 9.26784 1.01198 9.39074 1.06226C9.51364 1.11254 9.62529 1.18679 9.71918 1.28069C9.81307 1.37458 9.88733 1.48623 9.93761 1.60913C9.98789 1.73202 10.0132 1.8637 10.012 1.99648C10.0109 2.12926 9.9833 2.26048 9.93089 2.38249C9.87848 2.50449 9.8023 2.61483 9.70679 2.70708L5.70679 6.70708C5.51926 6.89455 5.26495 6.99987 4.99979 6.99987C4.73462 6.99987 4.48031 6.89455 4.29279 6.70708L0.292787 2.70708C0.105316 2.51955 0 2.26525 0 2.00008C0 1.73492 0.105316 1.48061 0.292787 1.29308Z"
                        fill="currentColor"
                      />
                    </svg>
                  </div>
                </MenuButton>
                <MenuList>
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
