import React from "react";
import { useNavigate } from "react-router-dom";

const Palette = () => {
  const navigate = useNavigate();

  const backgroundColors = [
    { name: "background", value: "#F5F5F5", css: "rgb(var(--color-background))", tailwind: "bg-background" },
    { name: "background-2", value: "#08205F", css: "rgb(var(--color-background-2))", tailwind: "bg-background-2" },
    { name: "background-3", value: "#4A47D3", css: "rgb(var(--color-background-3))", tailwind: "bg-background-3" },
    { name: "background-4", value: "#122B33", css: "rgb(var(--color-background-4))", tailwind: "bg-background-4" },
    { name: "background-5", value: "#FF8846", css: "rgb(var(--color-background-5))", tailwind: "bg-background-5" },
  ];

  const foregroundColors = [
    { name: "foreground", value: "#FFFFFF", css: "rgb(var(--color-foreground))", tailwind: "bg-foreground" },
    { name: "foreground-2", value: "#C1F6FF", css: "rgb(var(--color-foreground-2))", tailwind: "bg-foreground-2" },
    { name: "foreground-3", value: "#4B5F65", css: "rgb(var(--color-foreground-3))", tailwind: "bg-foreground-3" },
    { name: "foreground-4", value: "#6CB6AD", css: "rgb(var(--color-foreground-4))", tailwind: "bg-foreground-4" },
    { name: "foreground-5", value: "#22645C", css: "rgb(var(--color-foreground-5))", tailwind: "bg-foreground-5" },
    { name: "foreground-6", value: "#074853", css: "rgb(var(--color-foreground-6))", tailwind: "bg-foreground-6" },
    { name: "foreground-7", value: "#D2DC95", css: "rgb(var(--color-foreground-7))", tailwind: "bg-foreground-7" },
  ];

  const textColors = [
    { name: "color-1", value: "#FFFFFF", css: "rgb(var(--color-text-1))", tailwind: "text-color-1" },
    { name: "color-2", value: "#6CB6AD", css: "rgb(var(--color-text-2))", tailwind: "text-color-2" },
    { name: "color-3", value: "#D2D2D2", css: "rgb(var(--color-text-3))", tailwind: "text-color-3" },
    { name: "color-4", value: "#000000", css: "rgb(var(--color-text-4))", tailwind: "text-color-4" },
    { name: "color-5", value: "#4ABEFF", css: "rgb(var(--color-text-5))", tailwind: "text-color-5" },
    { name: "color-6", value: "#F5F5F5", css: "rgb(var(--color-text-6))", tailwind: "text-color-6" },
    { name: "color-7", value: "#FF8846", css: "rgb(var(--color-text-7))", tailwind: "text-color-7" },
    { name: "color-8", value: "#A0FE7F", css: "rgb(var(--color-text-8))", tailwind: "text-color-8" },
    { name: "color-9", value: "#737373", css: "rgb(var(--color-text-9))", tailwind: "text-color-9" },
    { name: "color-10", value: "#FEA57F", css: "rgb(var(--color-text-10))", tailwind: "text-color-10" },
  ];

  const otherColors = [{ name: "focus", value: "#FF8846", css: "rgb(var(--color-focus))", tailwind: "ring-focus" }];

  const ColorSection = ({ title, colors, prefix }: { title: string; colors: any[]; prefix: string }) => (
    <div className="mb-12">
      <h2 className="text-2xl font-bold text-color-1 mb-6">{title}</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {colors.map((color) => (
          <div key={color.name} className="bg-background-4 rounded-lg p-6 border border-foreground-3">
            <div
              className="w-full h-24 rounded-md mb-4 border border-foreground-3"
              style={{ backgroundColor: color.value }}
            />
            <div className="space-y-2">
              <p className="text-color-1 font-semibold">{color.name}</p>
              <p className="text-color-3 text-sm font-mono">{color.value}</p>
              <div className="space-y-1">
                <p className="text-color-2 text-xs">CSS: {color.css}</p>
                <p className="text-color-2 text-xs">Tailwind: {color.tailwind}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  return (
    <div className="bg-background min-h-screen">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-color-2 hover:text-color-1 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span>Back</span>
          </button>
        </div>

        <div className="mb-12">
          <h1 className="text-4xl font-bold text-color-1 mb-4">Theme Color Palette</h1>
          <p className="text-color-3 text-lg">
            LUNARPUNK_DARK_MODE theme colors used throughout the Gitcoin Passport application
          </p>
        </div>

        <ColorSection title="Background Colors" colors={backgroundColors} prefix="bg-" />
        <ColorSection title="Foreground Colors" colors={foregroundColors} prefix="bg-" />
        <ColorSection title="Text Colors" colors={textColors} prefix="text-" />
        <ColorSection title="Other Theme Colors" colors={otherColors} prefix="" />

        <div className="mt-12 bg-background-4 rounded-lg p-8 border border-foreground-3">
          <h2 className="text-2xl font-bold text-color-1 mb-6">Usage Examples</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-lg font-semibold text-color-2 mb-3">Component Example</h3>
              <div className="bg-background-2 p-4 rounded-md border border-foreground-5">
                <div className="bg-foreground-2 p-3 rounded mb-2">
                  <p className="text-color-4">Card with ice blue background</p>
                </div>
                <button className="bg-background-5 text-color-1 px-4 py-2 rounded hover:opacity-90 transition-opacity">
                  Orange Button
                </button>
              </div>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-color-2 mb-3">Text Variations</h3>
              <div className="space-y-2 bg-background p-4 rounded-md">
                <p className="text-color-1">Primary text (color-1)</p>
                <p className="text-color-2">Secondary text (color-2)</p>
                <p className="text-color-3">Muted text (color-3)</p>
                <p className="text-color-7">Accent text (color-7)</p>
                <p className="text-color-8">Success text (color-8)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Palette;
