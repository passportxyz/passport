import React, { useState, useEffect, useCallback } from "react";
import { useCustomization } from "../hooks/useCustomization";
import { useSectionRefs } from "../context/SectionRefsContext";

type Section = "humanity" | "campaigns";

const scrollToElement = (element: HTMLElement, duration = 550) => {
  const start = window.scrollY;
  const target = element.getBoundingClientRect().top + start;
  const startTime = performance.now();

  const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);

  const animate = (currentTime: number) => {
    const elapsed = currentTime - startTime;
    const progress = Math.min(elapsed / duration, 1);

    window.scrollTo(0, start + (target - start) * easeOutCubic(progress));

    if (progress < 1) requestAnimationFrame(animate);
  };

  requestAnimationFrame(animate);
};

export const SectionTabs: React.FC = () => {
  const { featuredCampaigns } = useCustomization();
  const { stampsRef, partnersRef } = useSectionRefs();
  const [activeSection, setActiveSection] = useState<Section>("humanity");

  // Detect which section is in view based on scroll position
  const updateActiveSection = useCallback(() => {
    const partnersElement = partnersRef.current;
    if (!partnersElement) return;

    const rect = partnersElement.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // If the top of the campaigns section is in the upper half of viewport, it's active
    if (rect.top < viewportHeight / 2) {
      setActiveSection("campaigns");
    } else {
      setActiveSection("humanity");
    }
  }, [partnersRef]);

  useEffect(() => {
    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection);
    return () => window.removeEventListener("scroll", updateActiveSection);
  }, [updateActiveSection]);

  // Handle ?section=featured query param on mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get("section") === "featured" && partnersRef.current) {
      // Small delay to ensure layout is complete
      setTimeout(() => {
        if (partnersRef.current) {
          scrollToElement(partnersRef.current);
        }
      }, 100);
    }
  }, [partnersRef]);

  const scrollToSection = (section: Section) => {
    if (section === "humanity") {
      const stampsElement = stampsRef.current;
      if (stampsElement) {
        scrollToElement(stampsElement);
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      const partnersElement = partnersRef.current;
      if (partnersElement) {
        scrollToElement(partnersElement);
      }
    }
  };

  // Don't render if there are no featured campaigns
  if (!featuredCampaigns || featuredCampaigns.length === 0) {
    return null;
  }

  return (
    <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40">
      <div
        className="flex items-center p-1.5 gap-1 rounded-xl border border-[#EBEBEB] bg-white/60 backdrop-blur-[20px]"
        style={{ boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
      >
        <button
          onClick={() => scrollToSection("humanity")}
          className={`px-5 py-2 rounded-lg font-medium text-sm transition-colors ${
            activeSection === "humanity"
              ? "bg-[#0A0A0A] text-white"
              : "bg-transparent text-[#737373] hover:text-[#525252]"
          }`}
        >
          Prove Humanity
        </button>
        <button
          onClick={() => scrollToSection("campaigns")}
          className={`px-5 py-2 rounded-lg font-medium text-sm transition-colors ${
            activeSection === "campaigns"
              ? "bg-[#0A0A0A] text-white"
              : "bg-transparent text-[#737373] hover:text-[#525252]"
          }`}
        >
          Protected Campaigns
        </button>
      </div>
    </div>
  );
};
