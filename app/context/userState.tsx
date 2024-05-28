// --- React Methods
import React from "react";

// --- Utils & configs
import { atom } from "jotai";

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
