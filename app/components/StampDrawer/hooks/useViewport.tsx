import { useEffect, useState } from "react";

export const useViewport = () => {
  const [viewport, setViewport] = useState({
    isMobile: false,
    isWide: false,
  });

  useEffect(() => {
    const handleResize = () => {
      setViewport({
        isMobile: window.innerWidth < 768,
        isWide: window.innerWidth >= 1200,
      });
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return viewport;
};
