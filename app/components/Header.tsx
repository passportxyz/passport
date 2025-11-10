// --- React methods
import React, { useEffect } from "react";
import { userWarningAtom } from "../context/userState";
import { PAGE_PADDING } from "./PageWidthGrid";
import Warning from "./Warning";
import MinimalHeader from "./MinimalHeader";
import { SupportBanner } from "../components/SupportBanner";
import { useAtom } from "jotai";
import { useSupportBanners } from "../hooks/useSupportBanners";
import { useCustomization } from "../hooks/useCustomization";
import { ScorerContext } from "../context/scorerContext";

export const useRadialBackgroundColorForHeader = (skipCustomisation: Boolean = false): string => {
  const { customizationTheme } = useCustomization();

  const { rawScore, threshold } = React.useContext(ScorerContext);
  const aboveThreshold = threshold && rawScore >= threshold;

  const fallbackBackgroundColor = !skipCustomisation && aboveThreshold ? "#BEFEE2" : "#E5E5E5";
  return (!skipCustomisation && customizationTheme?.colors.customizationBackground1) || fallbackBackgroundColor;
};

const Header = ({
  skipCustomisation,
  showTopNav,
}: {
  skipCustomisation?: Boolean;
  showTopNav?: boolean;
}): JSX.Element => {
  const [userWarning, setUserWarning] = useAtom(userWarningAtom);
  const { banners, loadBanners } = useSupportBanners();
  const backgroundColor = useRadialBackgroundColorForHeader(skipCustomisation === true);

  useEffect(() => {
    loadBanners();
  }, [loadBanners]);

  return (
    <div
      style={{ background: `radial-gradient(ellipse 100vw 200px at 50% 50%, white, ${backgroundColor})` }}
      className="top-0 left-0 w-full fixed z-30"
    >
      <div className={`${PAGE_PADDING}`}>
        <MinimalHeader showTopNav={showTopNav} />
      </div>
      {/* TODO: #3502 : wait for clarification on how to display banners ....
      
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
