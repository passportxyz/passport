import React from "react";
import { useAccount, useSignMessage, useSendTransaction, useSwitchChain } from "wagmi";
import { GuideSection } from "../types";

interface PlatformGuideProps {
  sections: GuideSection[];
  isMobile?: boolean;
}

export const PlatformGuide = ({ sections, isMobile = false }: PlatformGuideProps) => {
  const { address } = useAccount();
  const { signMessageAsync } = useSignMessage();
  const { sendTransactionAsync } = useSendTransaction();
  const { switchChainAsync } = useSwitchChain();

  const containerClass = isMobile ? "mt-8" : "h-full overflow-y-auto";

  return (
    <div className={containerClass}>
      {sections.map((section, sectionIndex) => (
        <div key={sectionIndex} className={sectionIndex > 0 ? "mt-8" : ""}>
          {section.type === "steps" ? (
            <>
              <h3 className="text-xl font-semibold text-black mb-6">{section.title || "Step-by-step guide"}</h3>
              <div className="space-y-8">
                {section.items.map((step, index) => (
                  <div key={index} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center">
                      <span className="text-lg font-semibold text-black">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <p className="text-sm text-black whitespace-pre-line leading-relaxed">{step.description}</p>

                      {step.actions && step.actions.length > 0 && (
                        <div className="mt-4 space-y-2">
                          {step.actions.map((action, actionIndex) => {
                            const isExternal = "href" in action;
                            return (
                              <a
                                key={actionIndex}
                                href={isExternal ? action.href : "#"}
                                onClick={
                                  !isExternal && address
                                    ? (e) => {
                                        e.preventDefault();
                                        action.onClick({
                                          address,
                                          signMessageAsync,
                                          sendTransactionAsync,
                                          switchChainAsync,
                                        });
                                      }
                                    : undefined
                                }
                                className="inline-flex items-center gap-2 px-4 py-2 bg-white border border-gray-200 rounded-lg text-sm font-medium text-black hover:bg-gray-50 transition-colors"
                                target={isExternal && action.href.startsWith("http") ? "_blank" : undefined}
                                rel={isExternal && action.href.startsWith("http") ? "noopener noreferrer" : undefined}
                              >
                                {isExternal && action.href.startsWith("http") && (
                                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      strokeWidth={2}
                                      d="M7 7H17M17 7V17M17 7L7 17"
                                    />
                                  </svg>
                                )}
                                {action.label}
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
              <h3 className="text-xl font-semibold text-black mb-6">{section.title || "Important Considerations"}</h3>
              <ul className="space-y-1.5">
                {section.items.map((item, index) => (
                  <li key={index} className="flex gap-3">
                    <span className="text-black text-sm leading-relaxed">•</span>
                    <p className="text-sm text-black leading-relaxed">{item}</p>
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
