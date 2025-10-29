// Mock data for TopNav component stories and development

export interface NavFeature {
  icon: "user-check" | "embed" | "database" | "passport";
  title: string;
  description: string;
  id: string; // Will be used for routing to /#/<id>/dashboard
}

export interface PartnerLink {
  name: string;
  logo: string; // SVG path or component
  id: string; // Will be used for routing to /#/<id>/dashboard
}

export const mockNavFeatures: NavFeature[] = [
  {
    icon: "user-check",
    title: "Real-time Verification",
    description: "Protect programs in real-time with Stamps and Models",
    id: "real-time",
  },
  {
    icon: "embed",
    title: "Embed",
    description: "Embed humanity verification directly in your dApp",
    id: "embed",
  },
  {
    icon: "database",
    title: "Data Services",
    description: "Classify and cluster Sybils in bulk lists of addresses",
    id: "data-services",
  },
  {
    icon: "passport",
    title: "Passport Ecosystem",
    description: "View all Passport-protected partners",
    id: "ecosystem",
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
