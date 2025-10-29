import type { Meta, StoryObj } from "@storybook/react";
import { FeatureCard } from "./FeatureCard";
import { mockNavFeatures } from "../mocks/navData";

const meta: Meta<typeof FeatureCard> = {
  title: "TopNav/FeatureCard",
  component: FeatureCard,
  parameters: {
    layout: "centered",
  },
  tags: ["autodocs"],
  argTypes: {
    onClick: { action: "clicked" },
  },
  decorators: [
    (Story) => (
      <div style={{ width: "300px" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Responsive grid (shows how cards look at different widths)
export const ResponsiveGrid: Story = {
  render: () => (
    <>
      <div className="mb-8">
        <h3 className="mb-2 text-lg font-semibold">Desktop (4 columns)</h3>
        <div className="grid grid-cols-4 gap-3 p-4 bg-white rounded-lg" style={{ width: "900px" }}>
          {mockNavFeatures.map((feature) => (
            <FeatureCard key={feature.id} {...feature} onClick={(id) => console.log(`Clicked: ${id}`)} />
          ))}
        </div>
      </div>

      <div className="mb-8">
        <h3 className="mb-2 text-lg font-semibold">Tablet (2 columns)</h3>
        <div className="grid grid-cols-2 gap-3 p-4 bg-white rounded-lg" style={{ width: "500px" }}>
          {mockNavFeatures.map((feature) => (
            <FeatureCard key={feature.id} {...feature} onClick={(id) => console.log(`Clicked: ${id}`)} />
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-lg font-semibold">Mobile (1 column)</h3>
        <div className="flex flex-col gap-3 p-4 bg-white rounded-lg" style={{ width: "320px" }}>
          {mockNavFeatures.map((feature) => (
            <FeatureCard key={feature.id} {...feature} onClick={(id) => console.log(`Clicked: ${id}`)} />
          ))}
        </div>
      </div>
    </>
  ),
};
