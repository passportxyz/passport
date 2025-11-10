import type { Meta, StoryObj } from "@storybook/react";
import { TopNav } from "./TopNav";
import { mockNavFeatures, mockPartners } from "../mocks/navData";

const meta: Meta<typeof TopNav> = {
  title: "Navigation/TopNav",
  component: TopNav,
  parameters: {
    layout: "centered",
    backgrounds: {
      default: "light",
      values: [
        { name: "light", value: "#F5F5F5" },
        { name: "dark", value: "#122B33" },
      ],
    },
  },
  argTypes: {
    onPartnerClick: { action: "partner clicked" },
  },
  decorators: [
    (Story) => (
      <div className="w-[1200px] max-w-full p-8">
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Default TopNav with all features and partners
export const Default: Story = {
  args: {
    features: mockNavFeatures,
    partners: mockPartners,
  },
};

// TopNav with current dashboard highlighted
export const WithCurrentDashboard: Story = {
  args: {
    features: mockNavFeatures,
    partners: [
      { name: "Lido", logo: "lido", id: "lido" },
      { name: "Verax", logo: "verax", id: "verax", isCurrent: true }, // This one is current
      { name: "Shape", logo: "shape", id: "shape" },
      { name: "Octant", logo: "octant", id: "octant" },
      { name: "Recall", logo: "recall", id: "recall" },
      { name: "Linea", logo: "linea", id: "linea" },
    ],
    isOnCustomDashboard: true, // Show the Passport Dashboard button
    onPartnerClick: (id: string) => {
      console.log(`Partner clicked: ${id}`);
    },
  },
};

// Custom features and partners
export const CustomContent: Story = {
  args: {
    features: [
      {
        icon: "user-check",
        title: "Custom Feature 1",
        description: "This is a custom feature description",
        url: "#custom-1",
      },
      {
        icon: "database",
        title: "Custom Feature 2",
        description: "Another custom feature with longer description text",
        url: "#custom-2",
      },
    ],
    partners: [
      { name: "Partner A", logo: "lido", id: "partner-a" },
      { name: "Partner B", logo: "shape", id: "partner-b" },
    ],
  },
};
