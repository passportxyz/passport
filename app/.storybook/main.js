/** @type { import('@storybook/nextjs').StorybookConfig } */
const config = {
  stories: ["../components/**/*.stories.@(js|jsx|mjs|ts|tsx)"],
  addons: ["@storybook/addon-links"],
  framework: {
    name: "@storybook/nextjs",
    options: {},
  },
  staticDirs: ["../public"],
};

export default config;
