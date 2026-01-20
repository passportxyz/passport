import React, { useRef, useState, useEffect, useCallback } from "react";
import { CampaignCard } from "./CampaignCard";
import { useCustomization } from "../../hooks/useCustomization";

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

// Stack Icon for "Explore all Partners" button
const StackIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
    <path
      d="M4 7H20M4 12H20M4 17H20"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const PartnersSection: React.FC = () => {
  const { featuredCampaigns } = useCustomization();
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  // Calculate visible cards and total pages based on container width
  const updateScrollState = useCallback(() => {
    const container = scrollContainerRef.current;
    if (!container || !featuredCampaigns) return;

    const scrollLeft = container.scrollLeft;
    const scrollWidth = container.scrollWidth;
    const clientWidth = container.clientWidth;
    const cardWidth = 305; // card width + gap
    const visibleCards = Math.max(1, Math.floor(clientWidth / cardWidth));
    const pages = Math.ceil(featuredCampaigns.length / visibleCards);

    setTotalPages(pages);
    setCurrentPage(Math.round(scrollLeft / (cardWidth * visibleCards)));
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
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

  // Return null if no campaigns to display
  if (!featuredCampaigns || featuredCampaigns.length === 0) {
    return null;
  }

  return (
    <div className="col-span-full flex flex-col gap-8 mt-12">
      {/* Header */}
      <div className="px-4 md:px-0">
        <span className="font-heading text-4xl text-gray-800">Partners</span>
      </div>

      {/* Cards container */}
      <div className="w-full">
        <div className="flex flex-col gap-6">
          {/* Scrollable cards */}
          <div
            ref={scrollContainerRef}
            className="flex gap-5 overflow-x-auto scrollbar-hide scroll-smooth snap-x snap-mandatory pb-2"
            style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
          >
            {featuredCampaigns.map((campaign) => (
              <div key={campaign.id} className="flex-shrink-0 w-[285px] snap-start">
                <CampaignCard campaign={campaign} />
              </div>
            ))}
          </div>

          {/* Controls row */}
          <div className="flex items-center justify-between">
            {/* Pagination controls - left side */}
            <div className="flex items-center gap-6">
              {/* Left arrow */}
              <button
                onClick={() => scrollToPage("left")}
                disabled={!canScrollLeft}
                className={`p-3 rounded-lg transition-opacity ${
                  canScrollLeft ? "opacity-100 hover:bg-gray-100" : "opacity-40 cursor-not-allowed"
                }`}
                aria-label="Previous"
              >
                <ChevronLeftIcon />
              </button>

              {/* Dots */}
              <div className="flex items-center gap-2">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <div
                    key={idx}
                    className={`h-[3px] rounded-sm transition-all ${
                      idx === currentPage ? "w-8 bg-gray-900" : "w-8 bg-gray-400"
                    }`}
                  />
                ))}
              </div>

              {/* Right arrow */}
              <button
                onClick={() => scrollToPage("right")}
                disabled={!canScrollRight}
                className={`p-3 rounded-lg transition-opacity ${
                  canScrollRight ? "opacity-100 hover:bg-gray-100" : "opacity-40 cursor-not-allowed"
                }`}
                aria-label="Next"
              >
                <ChevronRightIcon />
              </button>
            </div>

            {/* Explore all Partners button - right side */}
            <a
              href="https://google.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <StackIcon />
              <span className="font-medium text-base text-gray-900">Explore all Partners</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
