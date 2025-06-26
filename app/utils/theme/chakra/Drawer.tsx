import { ComponentStyleConfig } from "@chakra-ui/react";

const Drawer: ComponentStyleConfig = {
  parts: ["dialog"],
  baseStyle: {
    dialog: {
      width: { base: "90% !important", md: "100%" },
    },
  },
  sizes: {
    xs: {
      dialog: { maxW: "xs" },
    },
    sm: {
      dialog: { maxW: "sm" },
    },
    md: {
      dialog: { maxW: "md" },
    },
    lg: {
      dialog: { maxW: "870px" },
    },
    xl: {
      dialog: { maxW: "1100px" },
    },
    full: {
      dialog: { maxW: "100vw", w: "100vw" },
    },
  },
};

export default Drawer;
