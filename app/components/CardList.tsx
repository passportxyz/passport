// --- React Methods
import React from "react";

// --- Identity Providers
import {
  GoogleCard,
  EnsCard,
  PohCard,
  TwitterCard,
  PoapCard,
  FacebookCard,
  BrightidCard,
  LinkedinCard,
} from "./ProviderCards";
import GithubCard from "./ProviderCards/GithubCard";
import { LoadingCard } from "./LoadingCard";

export type CardListProps = {
  isLoading?: boolean;
};

export const CardList = ({ isLoading }: CardListProps): JSX.Element => {
  return (
    <div className="container mx-auto py-10">
      <div className="-m-4 flex flex-wrap">
        {isLoading ? (
          <>
            {[...Array(9)].map((_, i) => (
              <LoadingCard key={i} />
            ))}
          </>
        ) : (
          <>
            <FacebookCard />
            <GoogleCard />
            <TwitterCard />
            <GithubCard />
            <BrightidCard />
            <PoapCard />
            <EnsCard />
            <PohCard />
            <LinkedinCard />
          </>
        )}
      </div>
    </div>
  );
};
