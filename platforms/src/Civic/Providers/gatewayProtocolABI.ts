export const GATEWAY_PROTOCOL_ABI = [
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "network",
        type: "uint256",
      },
    ],
    name: "verifyToken",
    outputs: [
      {
        internalType: "bool",
        name: "",
        type: "bool",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "uint256",
        name: "network",
        type: "uint256",
      },
      {
        internalType: "bool",
        name: "onlyActive",
        type: "bool",
      },
    ],
    name: "getTokenIdsByOwnerAndNetwork",
    outputs: [
      {
        internalType: "uint256[]",
        name: "",
        type: "uint256[]",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256",
        name: "tokenId",
        type: "uint256",
      },
    ],
    name: "getToken",
    outputs: [
      {
        internalType: "address",
        name: "owner",
        type: "address",
      },
      {
        internalType: "uint8",
        name: "state",
        type: "uint8",
      },
      {
        internalType: "string",
        name: "identity",
        type: "string",
      },
      {
        internalType: "uint256",
        name: "expiration",
        type: "uint256",
      },
      {
        internalType: "uint256",
        name: "bitmask",
        type: "uint256",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
];
