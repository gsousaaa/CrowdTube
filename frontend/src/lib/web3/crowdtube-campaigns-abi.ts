export const crowdTubeCampaignsAbi = [
  {
    inputs: [
      { internalType: "bytes32", name: "metadataId", type: "bytes32" },
      { internalType: "uint256", name: "goal", type: "uint256" },
      { internalType: "uint256", name: "deadline", type: "uint256" },
    ],
    name: "createCampaign",
    outputs: [{ internalType: "uint256", name: "campaignId", type: "uint256" }],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "campaignId", type: "uint256" }],
    name: "donate",
    outputs: [],
    stateMutability: "payable",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "campaignId", type: "uint256" }],
    name: "getAvailableBalance",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [{ internalType: "uint256", name: "campaignId", type: "uint256" }],
    name: "getCampaign",
    outputs: [
      {
        components: [
          { internalType: "address", name: "creator", type: "address" },
          { internalType: "bytes32", name: "metadataId", type: "bytes32" },
          { internalType: "uint256", name: "goal", type: "uint256" },
          { internalType: "uint256", name: "deadline", type: "uint256" },
          { internalType: "uint256", name: "totalRaised", type: "uint256" },
          { internalType: "uint256", name: "totalWithdrawn", type: "uint256" },
          { internalType: "bool", name: "active", type: "bool" },
        ],
        internalType: "struct CrowdTubeCampaigns.Campaign",
        name: "",
        type: "tuple",
      },
    ],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [],
    name: "nextCampaignId",
    outputs: [{ internalType: "uint256", name: "", type: "uint256" }],
    stateMutability: "view",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "campaignId", type: "uint256" },
      { internalType: "bool", name: "active", type: "bool" },
    ],
    name: "setCampaignStatus",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      { internalType: "uint256", name: "campaignId", type: "uint256" },
      { internalType: "uint256", name: "amount", type: "uint256" },
    ],
    name: "withdraw",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
  {
    inputs: [
      {
        internalType: "uint256[]",
        name: "campaignIds",
        type: "uint256[]",
      },
    ],
    name: "withdrawFromCampaigns",
    outputs: [],
    stateMutability: "nonpayable",
    type: "function",
  },
] as const;
