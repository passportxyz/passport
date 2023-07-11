// --- React components/methods
import React, { useEffect } from "react";

import { useAccountCenter } from "@web3-onboard/react";

const shouldMinimize = () => {
  return window.innerWidth < 640 || window.pageYOffset > 120 || (window.pageYOffset > 50 && window.innerWidth < 1024);
};

const ManageAccountCenter = ({ children }: { children: React.ReactNode }) => {
  const updateAccountCenter = useAccountCenter();
  const position = "topRight";

  useEffect(() => {
    const onEvent = () => {
      if (shouldMinimize()) {
        updateAccountCenter({ minimal: true, position });
      } else {
        updateAccountCenter({ minimal: false, position });
      }
    };

    // run on mount to set initial state
    onEvent();

    // remove existing event listeners
    window.removeEventListener("resize", onEvent);
    window.removeEventListener("scroll", onEvent);

    // add listeners
    // passive stops the browser from waiting to see if the event
    // listener will call preventDefault() -- better for performance
    window.addEventListener("scroll", onEvent, { passive: true });
    window.addEventListener("resize", onEvent, { passive: true });

    // clean up on dismount
    return () => {
      window.removeEventListener("scroll", onEvent);
      window.removeEventListener("resize", onEvent);
    };
  }, [updateAccountCenter]);

  return <>{children}</>;
};

export default ManageAccountCenter;
