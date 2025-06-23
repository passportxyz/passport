import React from "react";
import { TestStampDataVariant1 } from "./mockData/variant1Data";
import { PointsModule } from "./shared/PointsModule";
import { CredentialCard } from "./shared/CredentialCard";

interface MultiCredentialViewProps {
  data: TestStampDataVariant1;
  onVerify: () => void;
  onUpdateScore: () => void;
  onClose: () => void;
}

export const MultiCredentialView: React.FC<MultiCredentialViewProps> = ({ data, onVerify, onUpdateScore, onClose }) => {
  const { platformInfo, verificationState, credentialGroups } = data;

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-6 pb-0">
        <div className="flex items-start gap-4 mb-4">
          <div className="text-4xl">{platformInfo.icon}</div>
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-color-1">{platformInfo.name}</h2>
            <p className="text-sm text-color-9 mt-1">{platformInfo.description}</p>

            {/* Learn More link */}
            <a href="#" className="inline-flex items-center gap-1 text-sm text-color-9 hover:text-color-1 mt-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Learn More
            </a>
          </div>
        </div>

        {/* Verify/Close button */}
        <div className="mt-4">
          {!verificationState.isVerified ? (
            <button
              onClick={onVerify}
              className="w-full py-3 px-4 bg-background text-color-1 rounded-lg border border-foreground-3 
                         hover:bg-foreground-3 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Verify
            </button>
          ) : (
            <button
              onClick={onClose}
              className="w-full py-3 px-4 bg-background text-color-1 rounded-lg border border-foreground-3 
                         hover:bg-foreground-3 transition-colors"
            >
              Close
            </button>
          )}
        </div>

        {/* Points Module (shown when verified) */}
        {verificationState.isVerified && (
          <div className="mt-4">
            <PointsModule
              variant="post-verification"
              pointsGained={verificationState.pointsGained}
              totalPossiblePoints={verificationState.totalPossiblePoints}
              validityDays={verificationState.validityDays}
            />
          </div>
        )}
      </div>

      {/* Scrollable content area */}
      <div className="flex-1 overflow-y-auto p-6">
        {/* Credential Groups */}
        {credentialGroups.map((group, groupIndex) => (
          <div key={groupIndex} className="mb-8">
            <h3 className="text-lg font-semibold text-color-1 mb-4">{group.title}</h3>
            <div className="space-y-3">
              {group.credentials.map((credential) => (
                <CredentialCard
                  key={credential.id}
                  name={credential.name}
                  description={credential.description}
                  verified={credential.verified}
                  points={credential.points}
                  pointsDisplay={credential.pointsDisplay}
                  flags={credential.flags}
                />
              ))}
            </div>
          </div>
        ))}
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
