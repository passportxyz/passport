import { useMediaQuery } from "react-responsive";
import tailwindConfig from "../tailwind.config";

const breakpoints = tailwindConfig.theme.screens;

type BreakpointKey = keyof typeof breakpoints;

// Example: const isMd = useBreakpoint("md");
export const useBreakpoint = (breakpointKey: BreakpointKey) =>
  useMediaQuery({
    query: `(min-width: ${breakpoints[breakpointKey]})`,
  });
