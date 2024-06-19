import React from "react";

export const Hyperlink = ({
  href,
  children,
  className,
}: {
  href: string;
  children: React.ReactNode;
  className?: string;
}) => (
  <a href={href} target="_blank" rel="noopener noreferrer" className={`underline font-bold text-color-5 ${className}`}>
    {children}
  </a>
);
