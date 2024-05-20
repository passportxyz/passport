export const getIamSecrets = (PASSPORT_VC_SECRETS_ARN: string, IAM_SERVER_SSM_ARN: string) => [
  {
    name: "IAM_JWK",
    valueFrom: `${PASSPORT_VC_SECRETS_ARN}:IAM_JWK::`,
  },
  {
    name: "GOOGLE_CLIENT_ID",
    valueFrom: `${IAM_SERVER_SSM_ARN}:GOOGLE_CLIENT_ID::`,
  },
  {
    name: "GOOGLE_CLIENT_SECRET",
    valueFrom: `${IAM_SERVER_SSM_ARN}:GOOGLE_CLIENT_SECRET::`,
  },
  {
    name: "GOOGLE_CALLBACK",
    valueFrom: `${IAM_SERVER_SSM_ARN}:GOOGLE_CALLBACK::`,
  },
  {
    name: "TWITTER_CALLBACK",
    valueFrom: `${IAM_SERVER_SSM_ARN}:TWITTER_CALLBACK::`,
  },
  {
    name: "RPC_URL",
    valueFrom: `${IAM_SERVER_SSM_ARN}:MAINNET_RPC_URL::`,
  },
  {
    name: "ALCHEMY_API_KEY",
    valueFrom: `${IAM_SERVER_SSM_ARN}:ALCHEMY_API_KEY::`,
  },
  {
    name: "TWITTER_CLIENT_ID",
    valueFrom: `${IAM_SERVER_SSM_ARN}:TWITTER_CLIENT_ID::`,
  },
  {
    name: "TWITTER_CLIENT_SECRET",
    valueFrom: `${IAM_SERVER_SSM_ARN}:TWITTER_CLIENT_SECRET::`,
  },
  {
    name: "BRIGHTID_PRIVATE_KEY",
    valueFrom: `${IAM_SERVER_SSM_ARN}:BRIGHTID_PRIVATE_KEY::`,
  },
  {
    name: "GITHUB_CLIENT_ID",
    valueFrom: `${IAM_SERVER_SSM_ARN}:GITHUB_CLIENT_ID::`,
  },
  {
    name: "GITHUB_CLIENT_SECRET",
    valueFrom: `${IAM_SERVER_SSM_ARN}:GITHUB_CLIENT_SECRET::`,
  },
  {
    name: "GRANT_HUB_GITHUB_CLIENT_ID",
    valueFrom: `${IAM_SERVER_SSM_ARN}:GRANT_HUB_GITHUB_CLIENT_ID::`,
  },
  {
    name: "GRANT_HUB_GITHUB_CLIENT_SECRET",
    valueFrom: `${IAM_SERVER_SSM_ARN}:GRANT_HUB_GITHUB_CLIENT_SECRET::`,
  },
  {
    name: "LINKEDIN_CLIENT_ID",
    valueFrom: `${IAM_SERVER_SSM_ARN}:LINKEDIN_CLIENT_ID::`,
  },
  {
    name: "LINKEDIN_CLIENT_SECRET",
    valueFrom: `${IAM_SERVER_SSM_ARN}:LINKEDIN_CLIENT_SECRET::`,
  },
  {
    name: "LINKEDIN_CALLBACK",
    valueFrom: `${IAM_SERVER_SSM_ARN}:LINKEDIN_CALLBACK::`,
  },
  {
    name: "DISCORD_CLIENT_ID",
    valueFrom: `${IAM_SERVER_SSM_ARN}:DISCORD_CLIENT_ID::`,
  },
  {
    name: "DISCORD_CLIENT_SECRET",
    valueFrom: `${IAM_SERVER_SSM_ARN}:DISCORD_CLIENT_SECRET::`,
  },
  {
    name: "DISCORD_CALLBACK",
    valueFrom: `${IAM_SERVER_SSM_ARN}:DISCORD_CALLBACK::`,
  },
  {
    name: "ETHERSCAN_API_KEY",
    valueFrom: `${IAM_SERVER_SSM_ARN}:ETHERSCAN_API_KEY::`,
  },
  {
    name: "POLYGON_RPC_URL",
    valueFrom: `${IAM_SERVER_SSM_ARN}:POLYGON_RPC_URL::`,
  },
  {
    name: "CGRANTS_API_TOKEN",
    valueFrom: `${IAM_SERVER_SSM_ARN}:CGRANTS_API_TOKEN::`,
  },
  {
    name: "CGRANTS_API_URL",
    valueFrom: `${IAM_SERVER_SSM_ARN}:CGRANTS_API_URL::`,
  },
  {
    name: "GTC_STAKING_GRAPH_API_KEY",
    valueFrom: `${IAM_SERVER_SSM_ARN}:GTC_STAKING_GRAPH_API_KEY::`,
  },
  {
    name: "GTC_STAKING_ROUNDS",
    valueFrom: `${IAM_SERVER_SSM_ARN}:GTC_STAKING_ROUNDS::`,
  },
  {
    name: "COINBASE_CLIENT_ID",
    valueFrom: `${IAM_SERVER_SSM_ARN}:COINBASE_CLIENT_ID::`,
  },
  {
    name: "COINBASE_CLIENT_SECRET",
    valueFrom: `${IAM_SERVER_SSM_ARN}:COINBASE_CLIENT_SECRET::`,
  },
  {
    name: "COINBASE_CALLBACK",
    valueFrom: `${IAM_SERVER_SSM_ARN}:COINBASE_CALLBACK::`,
  },
  {
    name: "ATTESTATION_SIGNER_PRIVATE_KEY",
    valueFrom: `${IAM_SERVER_SSM_ARN}:ATTESTATION_SIGNER_PRIVATE_KEY::`,
  },
  {
    name: "TESTNET_ATTESTATION_SIGNER_PRIVATE_KEY",
    valueFrom: `${IAM_SERVER_SSM_ARN}:TESTNET_ATTESTATION_SIGNER_PRIVATE_KEY::`,
  },
  {
    name: "GITCOIN_VERIFIER_CHAIN_ID",
    valueFrom: `${IAM_SERVER_SSM_ARN}:GITCOIN_VERIFIER_CHAIN_ID::`,
  },
  {
    name: "ALLO_SCORER_ID",
    valueFrom: `${IAM_SERVER_SSM_ARN}:ALLO_SCORER_ID::`,
  },
  {
    name: "SCORER_ENDPOINT",
    valueFrom: `${IAM_SERVER_SSM_ARN}:SCORER_ENDPOINT::`,
  },
  {
    name: "SCORER_API_KEY",
    valueFrom: `${IAM_SERVER_SSM_ARN}:SCORER_API_KEY::`,
  },
  {
    name: "EAS_GITCOIN_STAMP_SCHEMA",
    valueFrom: `${IAM_SERVER_SSM_ARN}:EAS_GITCOIN_STAMP_SCHEMA::`,
  },
  {
    name: "INCLUDE_TESTNETS",
    valueFrom: `${IAM_SERVER_SSM_ARN}:INCLUDE_TESTNETS::`,
  },
  {
    name: "ZKSYNC_ERA_MAINNET_ENDPOINT",
    valueFrom: `${IAM_SERVER_SSM_ARN}:ZKSYNC_ERA_MAINNET_ENDPOINT::`,
  },
  {
    name: "PASSPORT_SCORER_BACKEND",
    valueFrom: `${IAM_SERVER_SSM_ARN}:PASSPORT_SCORER_BACKEND::`,
  },
  {
    name: "TRUSTA_LABS_ACCESS_TOKEN",
    valueFrom: `${IAM_SERVER_SSM_ARN}:TRUSTA_LABS_ACCESS_TOKEN::`,
  },
  {
    name: "MORALIS_API_KEY",
    valueFrom: `${IAM_SERVER_SSM_ARN}:MORALIS_API_KEY::`,
  },
  {
    name: "IAM_JWK_EIP712",
    valueFrom: `${PASSPORT_VC_SECRETS_ARN}:IAM_JWK_EIP712::`,
  },
  {
    name: "OUTDID_API_KEY",
    valueFrom: `${IAM_SERVER_SSM_ARN}:OUTDID_API_KEY::`,
  },
  {
    name: "OUTDID_API_SECRET",
    valueFrom: `${PASSPORT_VC_SECRETS_ARN}:OUTDID_API_SECRET::`,
  },
];
