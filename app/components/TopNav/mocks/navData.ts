// Mock data for TopNav component stories and development

export interface NavFeature {
  icon: "user-check" | "embed" | "database" | "passport" | "chat" | "code" | "briefcase" | "headset";
  title: string;
  description?: string; // Optional for compact displays
  url: string; // Navigation URL
}

export interface PartnerLink {
  name: string;
  logo: string; // SVG path or component
  id: string; // Will be used for routing to /#/<id>/dashboard
  isCurrent?: boolean; // Optional flag to indicate if this is the current active dashboard
}

// TODO: Replace with API query when backend is ready
export const mockNavFeatures: NavFeature[] = [
  {
    icon: "user-check",
    title: "Real-time Verification",
    description: "Protect programs in real-time with Stamps and Models",
    url: "https://passport.human.tech/verification",
  },
  {
    icon: "embed",
    title: "Embed",
    description: "Embed humanity verification directly in your dApp",
    url: "https://passport.human.tech/embed",
  },
  {
    icon: "database",
    title: "Data Services",
    description: "Classify and cluster Sybils in bulk lists of addresses",
    url: "https://passport.human.tech/data",
  },
  {
    icon: "passport",
    title: "Passport Ecosystem",
    description: "View all Passport-protected partners",
    url: "https://passport.human.tech/ecosystem",
  },
];

export const mockPartnerFeatures: NavFeature[] = [
  {
    icon: "chat",
    title: "Contact Us",
    url: "https://tally.so/r/3X81KL?ref=passport-app",
  },
  {
    icon: "code",
    title: "Developer Docs",
    url: "https://docs.passport.xyz/",
  },
  {
    icon: "briefcase",
    title: "Case Studies",
    url: "https://passport.human.tech/blog",
  },
  {
    icon: "headset",
    title: "User Support",
    url: "https://support.passport.xyz/passport-knowledge-base/need-support",
  },
];

export const mockPartners: PartnerLink[] = [
  { name: "Lido", logo: "lido", id: "lido" },
  { name: "Verax", logo: "verax", id: "verax" },
  { name: "Shape", logo: "shape", id: "shape" },
  { name: "Octant", logo: "octant", id: "octant" },
  { name: "Recall", logo: "recall", id: "recall" },
  { name: "Linea", logo: "linea", id: "linea" },
];
