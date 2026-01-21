import React, { useState, useEffect, useCallback } from "react";
import { useCustomization } from "../hooks/useCustomization";

type Section = "humanity" | "campaigns";

export const SectionTabs: React.FC = () => {
  const { featuredCampaigns } = useCustomization();
  const [activeSection, setActiveSection] = useState<Section>("humanity");

  // Detect which section is in view based on scroll position
  const updateActiveSection = useCallback(() => {
    const campaignsSection = document.getElementById("partners-section");
    if (!campaignsSection) return;

    const rect = campaignsSection.getBoundingClientRect();
    const viewportHeight = window.innerHeight;

    // If the top of the campaigns section is in the upper half of viewport, it's active
    if (rect.top < viewportHeight / 2) {
      setActiveSection("campaigns");
    } else {
      setActiveSection("humanity");
    }
  }, []);

  useEffect(() => {
    updateActiveSection();
    window.addEventListener("scroll", updateActiveSection);
    return () => window.removeEventListener("scroll", updateActiveSection);
  }, [updateActiveSection]);

  const scrollToSection = (section: Section) => {
    if (section === "humanity") {
      const stampsSection = document.getElementById("add-stamps");
      if (stampsSection) {
        stampsSection.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    } else {
      const campaignsSection = document.getElementById("partners-section");
      if (campaignsSection) {
        campaignsSection.scrollIntoView({ behavior: "smooth", block: "start" });
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
