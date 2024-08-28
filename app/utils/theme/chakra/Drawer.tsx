import { ComponentStyleConfig } from "@chakra-ui/react";

const Drawer: ComponentStyleConfig = {
  parts: ["dialog"],
  baseStyle: {
    dialog: {
      width: { base: "90% !important", md: "100%" },
    },
  },
};

export default Drawer;
