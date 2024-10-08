import dotenv from "dotenv";
dotenv.config();

const badgeEasSchemaUid = "0xd57de4f41c3d3cc855eadef68f98c0d4edd22d57161d96b7c06d2f4336cc3b49";

// Example:
// [
//   {
//     badgeContractAddress: "0x...",
//     title: "zk Privacy Talent",
//     providers: [
//       {
//         level: 1,
//         name: "ZKPrivacyDevLevel1",
//         image: "/assets/image1.svg",
//       },
//       {
//         level: 2,
//         name: "ZKPrivacyDevLevel2",
//         image: "/assets/image2.svg",
//       },
//       {
//         level: 3,
//         name: "ZKPrivacyDevLevel3",
//         image: "/assets/image3.svg",
//       },
//     ],
//   },
// ]
const ScrollBadgeInfo: {
  badgeContractAddress: string;
  title: string;
  providers: {
    name: string;
    image: string;
    level: number;
  }[];
}[] = [
  {
    badgeContractAddress: "0x71A848A38fFCcA5c7A431F2BB411Ab632Fa0c456",
    title: "zk Privacy Talent",
    providers: [
      {
        level: 1,
        name: "DeveloperList#PassportContributor#25ee55d8",
        image: "/assets/scrollDevZKPrivacy1.svg",
      },
    ],
  },
  // {
  //   badgeContractAddress: "0x42f6C29a86df2c5fD776A2cb9b57cE408Ff95a55",
  //   title: "zk Gaming Talent",
  //   providers: [
  //     {
  //       level: 1,
  //       name: "githubContributionActivityGte#120",
  //       image: "/assets/scrollDevZKPrivacy2.svg",
  //     },
  //   ],
  // },
  // {
  //   badgeContractAddress: "0x998ffCeb5b7fCf980e06Cc0E6ee7358a88AfB012",
  //   title: "zk Bla Talent",
  //   providers: [
  //     {
  //       level: 1,
  //       name: "TrustaLabs",
  //       image: "/assets/scrollDevZKPrivacy3.svg",
  //     },
  //   ],
  // },
];

const iamEnvVars = {
  SCROLL_BADGE_PROVIDER_INFO:
    "'" +
    JSON.stringify(
      ScrollBadgeInfo.reduce(
        (acc, { badgeContractAddress, providers }) => {
          providers.forEach(({ name, level }) => {
            acc[name] = {
              contractAddress: badgeContractAddress,
              level,
            };
          });
          return acc;
        },
        {} as Record<string, { contractAddress: string; level: number }>
      )
    ) +
    "'",
  SCROLL_BADGE_ATTESTATION_SCHEMA_UID: badgeEasSchemaUid,
};

const appEnvVars = {
  NEXT_PUBLIC_SCROLL_BADGE_PROVIDER_INFO: "'" + JSON.stringify(ScrollBadgeInfo) + "'",
};

console.log("===== iam/.env =====");
Object.entries(iamEnvVars).forEach(([key, value]) => {
  console.log(`${key}=${value}`);
});

console.log("\n===== app/.env =====");
Object.entries(appEnvVars).forEach(([key, value]) => {
  console.log(`${key}=${value}`);
});
