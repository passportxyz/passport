import React, { useLayoutEffect, useMemo } from "react";
import { Theme } from "./types";
import setTheme from "./setTheme";

import { ChakraProvider, extendTheme } from "@chakra-ui/react";
import Menu from "./chakra/Menu";
import Modal from "./chakra/Modal";

type ColorKey = keyof Theme["colors"];

// Translates
// { background: "#fff", ... }
// to
// { background: {
//   100: "#fff", 200: "#fff", 300: "#fff", 400: "#fff", 500: "#fff",
//   600: "#fff", 700: "#fff", 800: "#fff", 900: "#fff"
//  }, ... }
const transposeColorsToChakraScheme = (colors: Theme["colors"]) =>
  (Object.keys(colors) as ColorKey[]).reduce(
    (acc, key: ColorKey) => ({
      ...acc,
      [key]: [100, 200, 300, 400, 500, 600, 700, 800, 900].reduce(
        (acc, shade) => ({
          ...acc,
          [shade]: colors[key],
        }),
        {}
      ),
    }),
    {}
  );

const ThemeWrapper = ({
  children,
  defaultTheme,
  initChakra,
}: {
  children: React.ReactNode;
  defaultTheme: Theme;
  initChakra?: boolean;
}) => {
  useLayoutEffect(() => setTheme(defaultTheme), [defaultTheme]);

  const chakraTheme = useMemo(() => {
    if (!initChakra) return undefined;

    const transposedColors = transposeColorsToChakraScheme(defaultTheme.colors);

    return extendTheme({ colors: transposedColors, components: { Menu, Modal }, fonts: defaultTheme.fonts });
  }, [defaultTheme, initChakra]);

  if (chakraTheme) {
    return <ChakraProvider theme={chakraTheme}>{children}</ChakraProvider>;
  } else {
    return <>{children}</>;
  }
};

export default ThemeWrapper;
