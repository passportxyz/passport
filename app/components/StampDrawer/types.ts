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
  pointsDisplay: string;
}

export interface CredentialGroup {
  title: string;
  credentials: Credential[];
}

export interface PlatformInfo {
  id: string;
  name: string;
  icon: React.ReactNode;
  description: string;
  cta?: string; // Custom CTA text like "Identity Staking"
  ctaHref?: string; // URL for custom CTA
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
  onUpdateScore: () => void;
  verifiedProviders: string[];
  expiredProviders: string[];
  stampWeights: Record<string, number>;
  stampDedupStatus: Record<string, boolean>;
}

export interface DrawerHeaderProps {
  icon: React.ReactNode;
  name: string;
  onClose: () => void;
}

export interface CTAButtonsProps {
  platformInfo: PlatformInfo;
  verificationState: VerificationState;
  onVerify: () => void;
  onClose: () => void;
}

export interface PointsModuleProps {
  variant: "pre-verification" | "post-verification";
  timeToGet?: string;
  price?: string;
  pointsGained?: number;
  totalPossiblePoints?: number;
  validityDays?: number;
  compact?: boolean;
}

export interface CredentialCardProps {
  name: string;
  description?: string;
  verified: boolean;
  flags?: ("expired" | "deduplicated")[];
  points: number;
  pointsDisplay: string;
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
  onUpdateScore: () => void;
}
