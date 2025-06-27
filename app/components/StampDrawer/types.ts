// Types for the StampDrawer component

export interface StepAction {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: "external";
}

export interface StepConfig {
  number: number;
  title: string;
  description: string;
  actions?: StepAction[];
  image?: {
    src: string;
    alt: string;
  };
}

export interface Credential {
  id: string;
  name: string;
  description?: string;
  verified: boolean;
  flags: ("expired" | "deduplicated")[];
  points: number;
}

export interface CredentialGroup {
  title: string;
  credentials: Credential[];
}

export interface PlatformInfo {
  id: string;
  name: string;
  icon: string;
  description: string;
  cta?: StepAction; // Custom CTA action
  website?: string; // Platform website URL
}

export interface VerificationState {
  isVerified: boolean;
  isLoading: boolean;
  canSubmit: boolean;
  timeToGet?: string;
  price?: string;
  pointsGained: number;
  totalPossiblePoints: number;
  validityDays?: number;
}

export interface StampDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  platform: any; // TODO: Use proper Platform type from existing codebase
  onVerify: () => void;
  verifiedProviders: string[];
  expiredProviders: string[];
  stampWeights: Partial<Record<string, string | number>>;
  stampDedupStatus: Partial<Record<string, boolean>>;
  isLoading?: boolean;
}

export interface DrawerHeaderProps {
  icon: string;
  name: string;
  onClose: () => void;
  website?: string;
}

export interface CTAButtonsProps {
  platformInfo: PlatformInfo;
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
}

export interface CredentialGridProps {
  credentialGroups: CredentialGroup[];
  columns: 1 | 2 | 3;
}

export interface StepGuideProps {
  steps: StepConfig[];
  isMobile?: boolean;
}

export interface DrawerFooterProps {
  onVerify: () => void;
  onClose?: () => void;
  isLoading?: boolean;
  isVerified?: boolean;
}
