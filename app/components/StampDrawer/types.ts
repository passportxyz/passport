// Types for the StampDrawer component

import { PlatformGroupSpec, StepItem, GuideSection } from "@gitcoin/passport-platforms/types";
import { PROVIDER_ID } from "@gitcoin/passport-types";
import { PlatformScoreSpec } from "../../context/scorerContext";

// Re-export platform types that we use
export type { StepItem, GuideSection } from "@gitcoin/passport-platforms/types";

export interface Credential {
  id: string;
  name: string;
  description?: string;
  verified: boolean;
  flags: ("expired" | "deduplicated")[];
  points: number;
  isEligible: boolean;
  isBeta?: boolean;
}

export interface CredentialGroup {
  title: string;
  credentials: Credential[];
}

export interface VerificationState {
  isVerified: boolean;
  isLoading: boolean;
  timeToGet?: string;
  price?: string;
  pointsGained: number;
  totalPossiblePoints: number;
}

export interface StampDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  platformSpec: PlatformScoreSpec;
  credentialGroups: PlatformGroupSpec[];
  onVerify: () => void;
  verifiedProviders: PROVIDER_ID[];
  expiredProviders: PROVIDER_ID[];
  stampWeights: Partial<Record<PROVIDER_ID, string | number>>;
  stampDedupStatus: Partial<Record<PROVIDER_ID, boolean>>;
  isLoading?: boolean;
}

export interface DrawerHeaderProps {
  icon: string;
  name: string;
  onClose: () => void;
  website?: string;
  onViewJSON?: () => void;
  onRemoveAll?: () => void;
  showMenu?: boolean;
}

export interface CTAButtonsProps {
  platformSpec: PlatformScoreSpec;
  verificationState: VerificationState;
  onVerify: () => void;
  onClose: () => void;
}

export interface PointsModuleProps {
  timeToGet?: string;
  price?: string;
  pointsGained?: number;
  totalPossiblePoints?: number;
}

export interface CredentialCardProps {
  name: string;
  description?: string;
  verified: boolean;
  flags?: ("expired" | "deduplicated")[];
  points: number;
  isBeta?: boolean;
}

export interface CredentialGridProps {
  credentialGroups: CredentialGroup[];
  columns: 1 | 2 | 3;
}

export interface StepGuideProps {
  steps: StepItem[];
  isMobile?: boolean;
}

export interface DrawerFooterProps {
  onVerify: () => void;
  onClose?: () => void;
  isLoading?: boolean;
  isVerified?: boolean;
}
