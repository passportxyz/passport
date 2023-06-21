import type { ComponentStyleConfig } from "@chakra-ui/theme";

const Modal: ComponentStyleConfig = {
  parts: ["dialog"],
  baseStyle: {
    dialog: {
      bg: "var(--color-background-2)",
      color: "var(--color-text-1)",
      border: "solid 1px var(--color-accent-2)",
    },
  },
};

export default Modal;
