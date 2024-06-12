export const ProgressBar = ({ pointsGained, pointsAvailable }: { pointsGained: number; pointsAvailable: number }) => {
  const percentGained = (pointsGained / (pointsGained + pointsAvailable)) * 100 || 0;

  const pageWidth = window.innerWidth;

  const padding = 80; // 40 px on either side
  const sliderWidth = 332;
  let fullSliderWidth = 332;

  if (pageWidth < sliderWidth + padding) {
    fullSliderWidth = pageWidth - padding;
  }

  const indicatorWidth = fullSliderWidth * (percentGained / 100);

  return (
    <div className="relative h-6">
      <svg className="absolute top-1.5 z-0" viewBox="0 8 104 4">
        <path d="M102,10 L102,10" strokeLinecap="round" strokeWidth={2} stroke="rgb(var(--color-foreground-4))" />
        <path d="M2,10 L102,10" strokeLinecap="butt" strokeWidth={2} stroke="rgb(var(--color-foreground-4))" />
        <path d="M2,10 L2,10" strokeLinecap="round" strokeWidth={2} stroke="rgb(var(--color-foreground-4))" />
      </svg>
      <svg
        className="absolute"
        id="mySvg"
        width="366"
        height="26"
        viewBox="0 0 366 26"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect
          x="2.5"
          y="2.5"
          width={indicatorWidth}
          height="21"
          rx="10.5"
          fill="#C1F6FF"
          stroke="#0E2825"
          strokeWidth="5"
          className="transition-all duration-700 ease-in-out"
        />
      </svg>
    </div>
  );
};
