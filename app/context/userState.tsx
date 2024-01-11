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
