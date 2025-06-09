// --- React methods
import React, { useEffect } from "react";
import { userWarningAtom } from "../context/userState";
import { PAGE_PADDING } from "./PageWidthGrid";
import Warning from "./Warning";
import MinimalHeader from "./MinimalHeader";
import { SupportBanner } from "../components/SupportBanner";
import { useAtom } from "jotai";
import { useSupportBanners } from "../hooks/useSupportBanners";

const Header = (): JSX.Element => {
  const [userWarning, setUserWarning] = useAtom(userWarningAtom);
  const { banners, loadBanners } = useSupportBanners();

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  return (
    <div className="top-0 left-0 w-full fixed z-30">
      <div className={`${PAGE_PADDING}`}>
        <MinimalHeader />
      </div>
      {/* TODO: #3502
      
      {!(userWarning || banners.length) && (
        <div className="h-1 w-full bg-gradient-to-b from-foreground-4 to-background" />
      )} */}
      <div className={`w-full bg-background-3 ${PAGE_PADDING}`}>
        {userWarning && <Warning userWarning={userWarning} onDismiss={() => setUserWarning(undefined)} />}
      </div>
      <div className="w-full bg-foreground-2">
        <SupportBanner banners={banners} />
      </div>
    </div>
  );
};

export default Header;
