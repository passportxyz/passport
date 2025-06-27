import React from "react";
import { GuideSection } from "../types";

interface PlatformGuideProps {
  sections: GuideSection[];
  isMobile?: boolean;
}

export const PlatformGuide = ({ sections, isMobile = false }: PlatformGuideProps) => {
  const containerClass = isMobile ? "mt-8" : "h-full overflow-y-auto";

  return (
    <div className={containerClass}>
      {sections.map((section, sectionIndex) => (
        <div key={sectionIndex} className={sectionIndex > 0 ? "mt-8" : ""}>
          {section.type === "steps" ? (
            <>
              <h3 className="text-xl font-semibold text-color-4 mb-6">{section.title || "Step-by-Step Guide"}</h3>
              <div className="space-y-8">
                {section.items.map((step, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-lg font-semibold text-color-4">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-color-4 mb-2 text-base">{step.title}</h4>
                      <p className="text-sm text-color-9 whitespace-pre-line leading-relaxed">{step.description}</p>

                      {step.actions && step.actions.length > 0 && (
                        <div className="mt-3">
                          {step.actions.map((action, actionIndex) => {
                            const isExternal = "href" in action;
                            return (
                              <a
                                key={actionIndex}
                                href={isExternal ? action.href : "#"}
                                onClick={!isExternal ? action.onClick : undefined}
                                className="inline-flex items-center gap-1 text-sm font-medium text-color-5 hover:underline"
                                target={isExternal && action.href.startsWith("http") ? "_blank" : undefined}
                                rel={isExternal && action.href.startsWith("http") ? "noopener noreferrer" : undefined}
                              >
                                {action.label}
                                {isExternal && action.href.startsWith("http") && (
                                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                                    />
                                  </svg>
                                )}
                              </a>
                            );
                          })}
                        </div>
                      )}

                      {step.image && (
                        <div className="mt-4 flex justify-center">
                          <img
                            src={step.image.src}
                            alt={step.image.alt}
                            className="rounded-lg border border-foreground-3"
                            style={{ maxWidth: "300px", maxHeight: "300px", objectFit: "contain" }}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <>
              <h3 className="text-xl font-semibold text-color-4 mb-6">{section.title || "Important Considerations"}</h3>
              <ul className="space-y-3">
                {section.items.map((item, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="text-color-4 mt-1">•</span>
                    <p className="text-sm text-color-9 leading-relaxed">{item}</p>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      ))}
    </div>
  );
};
