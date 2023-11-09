// --- React methods
import React from "react";
import { userWarningAtom } from "../context/userState";
import { PAGE_PADDING } from "./PageWidthGrid";
import Warning from "./Warning";
import MinimalHeader from "./MinimalHeader";
import { SupportBanner } from "../components/SupportBanner";
import { useAtom } from "jotai";

const Header = (): JSX.Element => {
  const [userWarning, setUserWarning] = useAtom(userWarningAtom);

  return (
    <div>
      <div className={`w-full bg-background ${PAGE_PADDING}`}>
        <MinimalHeader />
      </div>
      <div className="h-1 w-full bg-gradient-to-b from-foreground-4 to-background" />
      <div className={`w-full bg-background-3 ${PAGE_PADDING}`}>
        {userWarning && <Warning userWarning={userWarning} onDismiss={() => setUserWarning(undefined)} />}
      </div>
      <div className="w-full bg-background-3">
        <SupportBanner />
      </div>
    </div>
  );
};

export default Header;
