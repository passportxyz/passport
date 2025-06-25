import React from "react";
import { StepGuideProps } from "../types";

export const StepGuide = ({ steps, isMobile = false }: StepGuideProps) => {
  const containerClass = isMobile ? "mt-8" : "h-full overflow-y-auto";

  return (
    <div className={containerClass}>
      <h3 className="text-2xl font-bold text-gray-900 mb-8">Step by step Guide</h3>
      <div className="space-y-6">
        {steps.map((step, index) => (
          <div key={index} className="flex gap-4">
            <div className="flex-shrink-0 w-8 h-8 rounded-full bg-color-5 text-color-1 flex items-center justify-center text-lg font-bold">
              {step.number}
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-gray-900 mb-2 text-lg">{step.title}</h4>
              <p className="text-sm text-gray-600 whitespace-pre-line leading-relaxed">{step.description}</p>

              {step.actions && step.actions.length > 0 && (
                <div className="mt-3">
                  {step.actions.map((action, actionIndex) => (
                    <a
                      key={actionIndex}
                      href={action.href || "#"}
                      onClick={action.onClick}
                      className="inline-flex items-center gap-1 text-sm font-medium text-color-5 hover:underline"
                      target={action.href?.startsWith("http") ? "_blank" : undefined}
                      rel={action.href?.startsWith("http") ? "noopener noreferrer" : undefined}
                    >
                      {action.label}
                      {action.icon === "external" && (
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
                  ))}
                </div>
              )}

              {step.image && (
                <div className="mt-4 rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
                  <div className="p-12 flex items-center justify-center">
                    <div className="text-center">
                      <svg
                        className="w-20 h-20 mx-auto mb-3 text-gray-300"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <p className="text-sm text-gray-500">{step.image.alt}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
