import React from "react";
import type { Preview } from "@storybook/react";
import { ChakraProvider } from "@chakra-ui/react";
import { LUNARPUNK_DARK_MODE } from "../utils/theme/themes";
import "../styles/globals.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
  },
  decorators: [
    (Story) => {
      // Apply the theme CSS variables to the root
      React.useEffect(() => {
        Object.entries(LUNARPUNK_DARK_MODE.colors).forEach(([key, value]) => {
          document.documentElement.style.setProperty(`--color-${key}`, value);
        });
      }, []);

      return (
        <ChakraProvider>
          <div style={{ padding: "20px" }}>
            <Story />
          </div>
        </ChakraProvider>
      );
    },
  ],
};

export default preview;
