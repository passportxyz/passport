import React from "react";

const BACKGROUND_TEXTURE = "bg-[url('/assets/backgroundTexture.svg')] bg-[top_-500px_center] bg-repeat-y";

// TODO useLegacyBackground is just here to support the non-updated home/onboarding pages
// while we transition to the new UI design. This should be removed once those are updated

const PageRoot = ({
  children,
  className,
  useLegacyBackground,
}: {
  children: React.ReactNode;
  className?: string;
  useLegacyBackground?: boolean;
}) => (
  <div className={`bg-background font-body ${className} ${useLegacyBackground ? BACKGROUND_TEXTURE : ""}`}>
    {children}
  </div>
);

export default PageRoot;
