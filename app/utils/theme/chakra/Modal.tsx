import type { ComponentStyleConfig } from "@chakra-ui/theme";

const Modal: ComponentStyleConfig = {
  parts: ["dialog"],
  baseStyle: {
    dialog: {
      bg: "var(--color-background)",
      color: "var(--color-text-1)",
      border: "solid 1px var(--color-foreground-6)",
    },
  },
};

export default Modal;
