import React, { useLayoutEffect } from "react";
import { Theme } from "./types";
import setTheme from "./setTheme";

const ThemeWrapper = ({ children, defaultTheme }: { children: React.ReactNode; defaultTheme: Theme }) => {
  useLayoutEffect(() => setTheme(defaultTheme), [defaultTheme]);

  return <>{children}</>;
};

export default ThemeWrapper;
