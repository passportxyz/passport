import React from "react";
import { CredentialGridProps } from "../types";
import { CredentialCard } from "./CredentialCard";

export const CredentialGrid = ({ credentialGroups, columns }: CredentialGridProps) => {
  const gridCols = {
    1: "grid-cols-1",
    2: "grid-cols-2",
    3: "grid-cols-3",
  };

  return (
    <div>
      {credentialGroups.map((group, groupIndex) => (
        <div key={groupIndex} className="mb-8">
          <h3 className="text-base font-semibold text-color-9 mb-4">{group.title}</h3>
          <div className={`grid ${gridCols[columns]} gap-2`}>
            {group.credentials.map((credential) => (
              <CredentialCard
                key={credential.id}
                name={credential.name}
                description={credential.description}
                verified={credential.verified}
                points={credential.points}
                flags={credential.flags}
                isBeta={credential.isBeta}
              />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};
