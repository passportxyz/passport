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
  GoodDollarCard,
} from "./ProviderCards";
import GithubCard from "./ProviderCards/GithubCard";
import { LoadingCard } from "./LoadingCard";

export type CardListProps = {
  isLoading?: boolean;
};

export const CardList = ({ isLoading }: CardListProps): JSX.Element => {
  return (
    <div className="container mx-auto py-10">
      <div className="flex flex-wrap md:-m-4 md:px-4">
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
            <LinkedinCard />
            <BrightidCard />
            <PoapCard />
            <EnsCard />
            <PohCard />
            <GoodDollarCard />
          </>
        )}
      </div>
    </div>
  );
};
