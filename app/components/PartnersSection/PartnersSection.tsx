import React, { useRef, useState, useEffect, useCallback } from "react";
import { CampaignCard } from "./CampaignCard";
import { useCustomization } from "../../hooks/useCustomization";
import { useSectionRefs } from "../../context/SectionRefsContext";

// Chevron Left Icon
const ChevronLeftIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Chevron Right Icon
const ChevronRightIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// Stacked squares icon for "Explore all Partners" button
const StackedSquaresIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M4 10C2.9 10 2 9.1 2 8V4C2 2.9 2.9 2 4 2H8C9.1 2 10 2.9 10 4M10 16C8.9 16 8 15.1 8 14V10C8 8.9 8.9 8 10 8H14C15.1 8 16 8.9 16 10M16 14H20C21.1046 14 22 14.8954 22 16V20C22 21.1046 21.1046 22 20 22H16C14.8954 22 14 21.1046 14 20V16C14 14.8954 14.8954 14 16 14Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const PartnersSection: React.FC = () => {
  const { featuredCampaigns } = useCustomization();
  const { partnersRef } = useSectionRefs();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const trackRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [scrollProgress, setScrollProgress] = useState(0);
  const [thumbWidthPercent, setThumbWidthPercent] = useState(100);
  const [hasOverflow, setHasOverflow] = useState(false);

  // Calculate scroll progress and thumb width based on container scroll state
  const updateScrollState = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || !featuredCampaigns) return;

    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    const maxScroll = scrollWidth - clientWidth;

    // Check if there's overflow
    const overflow = scrollWidth > clientWidth;
    setHasOverflow(overflow);

    if (overflow && maxScroll > 0) {
      // Calculate scroll progress (0 to 1)
      setScrollProgress(scrollLeft / maxScroll);
      // Calculate thumb width as percentage of track (viewport / total content)
      setThumbWidthPercent((clientWidth / scrollWidth) * 100);
    } else {
      setScrollProgress(0);
      setThumbWidthPercent(100);
    }

    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < maxScroll - 10);
  }, [featuredCampaigns]);

  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) return;

    updateScrollState();
    container.addEventListener("scroll", updateScrollState);
    window.addEventListener("resize", updateScrollState);

    return () => {
      container.removeEventListener("scroll", updateScrollState);
      window.removeEventListener("resize", updateScrollState);
    };
  }, [updateScrollState]);

  const scrollToPage = (direction: "left" | "right") => {
    const container = scrollContainerRef.current;
    if (!container) return;

    const cardWidth = 305;
    const visibleCards = Math.max(1, Math.floor(container.clientWidth / cardWidth));
    const scrollAmount = cardWidth * visibleCards;

    container.scrollBy({
      left: direction === "left" ? -scrollAmount : scrollAmount,
      behavior: "smooth",
    });
  };

  // Handle click on track to seek to position
  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const container = scrollContainerRef.current;
    const track = trackRef.current;
    if (!container || !track) return;

    const trackRect = track.getBoundingClientRect();
    const clickX = e.clientX - trackRect.left;
    const clickPercent = clickX / trackRect.width;

    const maxScroll = container.scrollWidth - container.clientWidth;
    const targetScroll = clickPercent * maxScroll;

    container.scrollTo({
      left: targetScroll,
      behavior: "smooth",
    });
  };

  // Return null if no campaigns to display
  if (!featuredCampaigns || featuredCampaigns.length === 0) {
    return null;
  }

  return (
    <div ref={partnersRef} className="col-span-full flex flex-col gap-8 mt-12">
      {/* Header */}
      <div className="px-4 md:px-0">
        <span className="font-heading text-4xl text-gray-800">Featured Campaigns</span>
      </div>

      {/* Cards container */}
      <div className="w-full">
        <div className="flex flex-col gap-6">
          {/* Scrollable cards - negative margins to extend edge-to-edge, padding for content, scroll-padding for snap alignment */}
          <div
            ref={scrollContainerRef}
            className={`flex gap-5 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-2 -mx-4 md:-mx-10 lg:-mx-20 px-4 md:px-10 lg:px-20 scroll-px-4 md:scroll-px-10 lg:scroll-px-20 ${hasOverflow ? "justify-start" : "justify-center"}`}
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {featuredCampaigns.map((campaign) => (
              <div key={campaign.id} className="flex-shrink-0 w-[305px] snap-start">
                <CampaignCard campaign={campaign} />
              </div>
            ))}
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between">
            {/* Pagination controls - left side (only show when there's overflow) */}
            {hasOverflow ? (
              <div className="flex items-center gap-4">
                {/* Left arrow */}
                <button
                  onClick={() => scrollToPage("left")}
                  disabled={!canScrollLeft}
                  className={`p-1 transition-opacity ${
                    canScrollLeft ? "opacity-100" : "opacity-40 cursor-not-allowed"
                  }`}
                  aria-label="Previous"
                >
                  <ChevronLeftIcon className="text-gray-600" />
                </button>

                {/* Track with sliding thumb - outer div for larger click area */}
                <div ref={trackRef} onClick={handleTrackClick} className="relative w-32 py-3 cursor-pointer">
                  {/* Visual track */}
                  <div className="h-[3px] bg-gray-300 rounded-full">
                    {/* Thumb */}
                    <div
                      className="absolute top-1/2 -translate-y-1/2 h-[3px] bg-gray-600 rounded-full"
                      style={{
                        width: `${thumbWidthPercent}%`,
                        left: `${scrollProgress * (100 - thumbWidthPercent)}%`,
                      }}
                    />
                  </div>
                </div>

                {/* Right arrow */}
                <button
                  onClick={() => scrollToPage("right")}
                  disabled={!canScrollRight}
                  className={`p-1 transition-opacity ${
                    canScrollRight ? "opacity-100" : "opacity-40 cursor-not-allowed"
                  }`}
                  aria-label="Next"
                >
                  <ChevronRightIcon className="text-gray-600" />
                </button>
              </div>
            ) : (
              <div /> /* Empty div to maintain justify-between spacing */
            )}

            {/* Explore all Partners button - right side */}
            <a
              href="https://passport.human.tech/ecosystem"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-gray-900"
            >
              <StackedSquaresIcon />
              <span className="font-medium text-base">Explore all Partners</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
