// --- React components/methods
import React, { useEffect, useState } from "react";

const shouldMinimize = () => {
  return window.scrollY > 120 || (window.screenY > 50 && window.innerWidth < 1024);
};

export const AccountCenter = () => {
  const [minimized, setMinimized] = useState(false);

  useEffect(() => {
    const onEvent = () => {
      setMinimized(shouldMinimize());
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
  }, []);

  return (
    <div className="fixed right-2 md:right-10 lg:right-20 top-3 rounded-2xl w-fit h-fit bg-background z-10 flex justify-end">
      <div className="hidden xl:block">
        <w3m-button balance={minimized ? "hide" : "show"} size="sm" />
      </div>
      <div className="xl:hidden block">
        <w3m-button balance="hide" size="sm" />
      </div>
    </div>
  );
};
