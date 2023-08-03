// --- React methods
import React, { useContext } from "react";
import { UserContext } from "../context/userContext";
import { PAGE_PADDING, CONTENT_MAX_WIDTH_INCLUDING_PADDING } from "./PageWidthGrid";
import Warning from "./Warning";
import MinimalHeader from "./MinimalHeader";
import { SupportBanner } from "../components/SupportBanner";

type HeaderProps = {
  subheader?: React.ReactNode;
};

const Header = ({ subheader }: HeaderProps): JSX.Element => {
  const { userWarning, setUserWarning } = useContext(UserContext);

  return (
    <div className={"border-b border-accent-2"}>
      <div className={`w-full bg-background ${PAGE_PADDING}`}>
        <MinimalHeader className={`${subheader ? "border-b border-b-accent-2" : ""}`} />
      </div>
      <div className={`w-full bg-red-100 ${PAGE_PADDING}`}>
        {userWarning && <Warning userWarning={userWarning} onDismiss={() => setUserWarning()} />}
      </div>
      <div className="w-full bg-red-100">
        <SupportBanner />
      </div>
      <div className={`mx-auto w-full ${PAGE_PADDING} ${CONTENT_MAX_WIDTH_INCLUDING_PADDING}`}>{subheader}</div>
    </div>
  );
};

export default Header;
