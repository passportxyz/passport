import type { ComponentStyleConfig } from "@chakra-ui/theme";

const hoverStyle = {
  bg: "rgb(var(--color-background-3))",
  color: "rgb(var(--color-text-1))",
};

const Menu: ComponentStyleConfig = {
  parts: ["item", "list"],
  baseStyle: {
    item: {
      _hover: hoverStyle,
      _focus: hoverStyle,
    },
    list: {
      background: "rgb(var(--color-background))",
      borderColor: "rgb(var(--color-background-3))",
    },
  },
};

export default Menu;
