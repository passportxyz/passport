import type { ComponentStyleConfig } from "@chakra-ui/theme";

const hoverStyle = {
  bg: "var(--color-accent-2)",
  color: "var(--color-text-1)",
};

const Menu: ComponentStyleConfig = {
  parts: ["item", "list"],
  baseStyle: {
    item: {
      _hover: hoverStyle,
      _focus: hoverStyle,
    },
    list: {
      background: "var(--color-background)",
      borderColor: "var(--color-accent-2)",
    },
  },
};

export default Menu;
