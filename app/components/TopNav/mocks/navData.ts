// Mock data for TopNav component stories and development

export interface NavFeature {
  icon: "user-check" | "embed" | "database" | "passport";
  title: string;
  description: string;
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

export const mockPartners: PartnerLink[] = [
  { name: "Lido", logo: "lido", id: "lido" },
  { name: "Verax", logo: "verax", id: "verax" },
  { name: "Shape", logo: "shape", id: "shape" },
  { name: "Octant", logo: "octant", id: "octant" },
  { name: "Recall", logo: "recall", id: "recall" },
  { name: "Linea", logo: "linea", id: "linea" },
];
