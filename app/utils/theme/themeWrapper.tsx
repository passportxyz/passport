import React, { useLayoutEffect, useMemo } from "react";
import { Theme } from "./types";
import setTheme from "./setTheme";

import { ChakraProvider, extendTheme } from "@chakra-ui/react";

type ColorKey = keyof Theme["colors"];

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

    return extendTheme({ colors: transposedColors });
  }, [defaultTheme, initChakra]);

  if (chakraTheme) {
    return <ChakraProvider theme={chakraTheme}>{children}</ChakraProvider>;
  } else {
    return <>{children}</>;
  }
};

export default ThemeWrapper;
