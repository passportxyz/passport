import type { ComponentStyleConfig } from "@chakra-ui/theme";

const Modal: ComponentStyleConfig = {
  parts: ["dialog"],
  baseStyle: {
    dialog: {
      bg: "rgb(var(--color-background))",
      color: "rgb(var(--color-text-1))",
      border: "solid 1px rgb(var(--color-foreground-6))",
    },
  },
};

export default Modal;
