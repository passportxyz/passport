// --- React Methods
import React, { useCallback, useEffect } from "react";

// --- Utils & configs
import { atom, useAtom } from "jotai";
import { useWeb3ModalAccount } from "@web3modal/ethers/react";

type UserWarningName = "expiredStamp" | "cacaoError";

export interface UserWarning {
  content: React.ReactNode;
  icon?: React.ReactNode;
  name?: UserWarningName;
  dismissible?: boolean;
  link?: string;
}

export const userWarningAtom = atom<UserWarning | undefined>(undefined);

export interface UserVerification {
  loading: boolean;
  success: boolean;
  error?: string;
}

export const userVerificationAtom = atom<UserVerification>({
  loading: false,
  success: false,
  error: undefined,
});

export const mutableUserVerificationAtom = atom(
  (get) => get(userVerificationAtom),
  (_get, set, newState: UserVerification) => {
    set(userVerificationAtom, newState);
  }
);

export const userIntercomHashAtom = atom<string | undefined>(undefined);

const useIntercom = () => {


const UserStateManagerLogic = () => {
  const { isConnected } = useWeb3ModalAccount();
  const [_userIntercomHash, setUserIntercomHash] = useAtom(userIntercomHashAtom);

  const onDisconnect = useCallback(() => {
    setUserIntercomHash(undefined);
  }, [setUserIntercomHash]);

  useEffect(() => {
    if (!isConnected) {
      onDisconnect();
    }
  }, [isConnected]);

  return null;
};

export const UserStateManager = ({ children }: { children: React.ReactNode }) => {
  // Don't add anything here that will cause a re-render of this component

  return (
    <>
      {/* Render this component in parallel so it can't cause the whole app to re-render */}
      <UserStateManagerLogic />
      {children}
    </>
  );
};
