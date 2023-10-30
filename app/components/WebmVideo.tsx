import React from "react";

// WebmVideo is a component that renders a video element with a fallback & loading image
export const WebmVideo = ({
  src,
  fallbackSrc,
  className,
  alt,
}: {
  src: string;
  fallbackSrc: string;
  alt: string;
  className?: string;
}) => (
  <video autoPlay loop playsInline className={className} poster={fallbackSrc}>
    <source src={src} type="video/webm" />
    <img src={fallbackSrc} alt={alt} />
  </video>
);
