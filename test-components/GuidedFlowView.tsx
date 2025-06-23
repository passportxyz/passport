import React from "react";
import { TestStampDataVariant2 } from "./mockData/variant2Data";
import { PointsModule } from "./shared/PointsModule";
import { CredentialCard } from "./shared/CredentialCard";
import { StepGuide } from "./shared/StepGuide";

interface GuidedFlowViewProps {
  data: TestStampDataVariant2;
  onVerify: () => void;
  onUpdateScore: () => void;
  onClose: () => void;
}

export const GuidedFlowView: React.FC<GuidedFlowViewProps> = ({ data, onVerify, onUpdateScore, onClose }) => {
  const { platformInfo, verificationState, steps, credentials } = data;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 pb-0">
        {/* Platform info */}
        <div className="flex items-center gap-3 mb-6">
          <div className="text-4xl">{platformInfo.icon}</div>
          <h2 className="text-2xl font-bold text-color-1">{platformInfo.name}</h2>
        </div>

        {/* Points Module */}
        <PointsModule
          variant={verificationState.isVerified ? "post-verification" : "pre-verification"}
          timeToGet={verificationState.timeToGet}
          price={verificationState.price}
          pointsGained={verificationState.pointsGained}
          totalPossiblePoints={verificationState.totalPossiblePoints}
        />

        {/* Description */}
        <div className="mt-6">
          <p className="text-color-9">{platformInfo.description}</p>
        </div>
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Step by Step Guide */}
        {!verificationState.isVerified && steps.length > 0 && <StepGuide steps={steps} />}

        {/* Stamps section */}
        <div className={`${!verificationState.isVerified ? "mt-8" : ""}`}>
          <h3 className="text-lg font-semibold text-color-1 mb-4">Stamp</h3>
          <div className="space-y-3">
            {credentials.map((credential) => (
              <CredentialCard
                key={credential.id}
                name={credential.name}
                description={credential.description}
                verified={credential.verified}
                points={credential.points}
                pointsDisplay={credential.pointsDisplay}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Bottom action button */}
      <div className="p-6 pt-0">
        <button
          onClick={onUpdateScore}
          className="w-full py-3 px-4 bg-background-4 text-color-1 rounded-lg 
                     hover:bg-opacity-90 transition-all flex items-center justify-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Update Score
        </button>
      </div>
    </div>
  );
};
