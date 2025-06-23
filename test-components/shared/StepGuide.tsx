import React from "react";
import { TestStep } from "../mockData/variant2Data";

interface StepGuideProps {
  steps: TestStep[];
}

export const StepGuide: React.FC<StepGuideProps> = ({ steps }) => {
  return (
    <div className="mt-8">
      <h3 className="text-lg font-semibold text-color-1 mb-4">Step by step Guide</h3>
      <div className="space-y-6">
        {steps.map((step, index) => (
          <div key={index} className="flex gap-4">
            <span className="text-2xl font-bold text-color-9 flex-shrink-0 w-8">{step.number}</span>
            <div className="flex-1">
              <h4 className="font-semibold text-color-1 mb-1">{step.title}</h4>
              <p className="text-sm text-color-9 whitespace-pre-line">{step.description}</p>

              {step.actions && step.actions.length > 0 && (
                <div className="mt-2 space-x-3">
                  {step.actions.map((action, actionIndex) => (
                    <a
                      key={actionIndex}
                      href={action.href || "#"}
                      onClick={
                        action.onClick
                          ? (e) => {
                              e.preventDefault();
                              action.onClick!();
                            }
                          : undefined
                      }
                      className="inline-flex items-center gap-1 text-sm font-medium text-color-5 hover:text-color-5 hover:underline"
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
                      {action.icon === "arrow" && (
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      )}
                    </a>
                  ))}
                </div>
              )}

              {step.image && (
                <div className="mt-3 rounded-lg border border-foreground-3 overflow-hidden bg-background-4">
                  <div className="p-8 flex items-center justify-center">
                    <div className="text-center">
                      <svg
                        className="w-16 h-16 mx-auto text-color-9 mb-2"
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
                      <p className="text-xs text-color-9">{step.image.alt}</p>
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
