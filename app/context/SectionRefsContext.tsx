import React, { createContext, useContext, useRef, RefObject } from "react";

interface SectionRefs {
  stampsRef: RefObject<HTMLSpanElement>;
  partnersRef: RefObject<HTMLDivElement>;
}

const SectionRefsContext = createContext<SectionRefs | null>(null);

export const SectionRefsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const stampsRef = useRef<HTMLSpanElement>(null);
  const partnersRef = useRef<HTMLDivElement>(null);

  return <SectionRefsContext.Provider value={{ stampsRef, partnersRef }}>{children}</SectionRefsContext.Provider>;
};

export const useSectionRefs = (): SectionRefs => {
  const context = useContext(SectionRefsContext);
  if (!context) {
    throw new Error("useSectionRefs must be used within a SectionRefsProvider");
  }
  return context;
};
