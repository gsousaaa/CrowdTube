// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

contract CrowdTubeCampaigns {
  struct Campaign {
    address creator;
    bytes32 metadataId;
    uint256 goal;
    uint256 deadline;
    uint256 totalRaised;
    uint256 totalWithdrawn;
    bool active;
  }

  uint256 public nextCampaignId = 1;

  mapping(uint256 campaignId => Campaign campaign) private campaigns;

  bool private withdrawing;

  event CampaignCreated(
    uint256 indexed campaignId,
    address indexed creator,
    bytes32 indexed metadataId,
    uint256 goal,
    uint256 deadline
  );
  event DonationReceived(
    uint256 indexed campaignId,
    address indexed donor,
    uint256 amount
  );
  event FundsWithdrawn(
    uint256 indexed campaignId,
    address indexed creator,
    uint256 amount
  );
  event GeneralWithdrawal(address indexed creator, uint256 amount);
  event CampaignStatusChanged(uint256 indexed campaignId, bool active);

  modifier campaignExists(uint256 campaignId) {
    require(campaigns[campaignId].creator != address(0), "Campaign does not exist");
    _;
  }

  modifier onlyCampaignCreator(uint256 campaignId) {
    require(
      msg.sender == campaigns[campaignId].creator,
      "Only campaign creator can perform this action"
    );
    _;
  }

  modifier nonReentrant() {
    require(!withdrawing, "Reentrant call");
    withdrawing = true;
    _;
    withdrawing = false;
  }

  function createCampaign(
    bytes32 metadataId,
    uint256 goal,
    uint256 deadline
  ) external returns (uint256 campaignId) {
    require(metadataId != bytes32(0), "Metadata id is required");
    require(goal > 0, "Goal must be greater than zero");
    require(
      deadline == 0 || deadline > block.timestamp,
      "Deadline must be in the future"
    );

    campaignId = nextCampaignId;
    nextCampaignId += 1;

    campaigns[campaignId] = Campaign({
      creator: msg.sender,
      metadataId: metadataId,
      goal: goal,
      deadline: deadline,
      totalRaised: 0,
      totalWithdrawn: 0,
      active: true
    });

    emit CampaignCreated(campaignId, msg.sender, metadataId, goal, deadline);
  }

  function donate(uint256 campaignId) external payable campaignExists(campaignId) {
    Campaign storage campaign = campaigns[campaignId];

    require(campaign.active, "Campaign is not active");
    require(
      campaign.deadline == 0 || block.timestamp <= campaign.deadline,
      "Campaign deadline has passed"
    );
    require(msg.value > 0, "Donation must be greater than zero");

    campaign.totalRaised += msg.value;

    emit DonationReceived(campaignId, msg.sender, msg.value);
  }

  function withdraw(
    uint256 campaignId,
    uint256 amount
  ) external campaignExists(campaignId) onlyCampaignCreator(campaignId) nonReentrant {
    Campaign storage campaign = campaigns[campaignId];
    uint256 availableBalance = campaign.totalRaised - campaign.totalWithdrawn;

    require(amount > 0, "Withdrawal amount must be greater than zero");
    require(amount <= availableBalance, "Insufficient campaign balance");

    campaign.totalWithdrawn += amount;

    (bool success, ) = payable(campaign.creator).call{value: amount}("");
    require(success, "Withdrawal failed");

    emit FundsWithdrawn(campaignId, campaign.creator, amount);
  }

  function withdrawFromCampaigns(
    uint256[] calldata campaignIds
  ) external nonReentrant {
    require(campaignIds.length > 0, "At least one campaign is required");

    uint256 totalAmount;

    for (uint256 index = 0; index < campaignIds.length; index += 1) {
      uint256 campaignId = campaignIds[index];
      Campaign storage campaign = campaigns[campaignId];

      require(campaign.creator != address(0), "Campaign does not exist");
      require(
        campaign.creator == msg.sender,
        "Only campaign creator can perform this action"
      );

      uint256 availableBalance =
        campaign.totalRaised - campaign.totalWithdrawn;

      if (availableBalance == 0) continue;

      campaign.totalWithdrawn += availableBalance;
      totalAmount += availableBalance;

      emit FundsWithdrawn(campaignId, msg.sender, availableBalance);
    }

    require(totalAmount > 0, "No funds available to withdraw");

    (bool success, ) = payable(msg.sender).call{value: totalAmount}("");
    require(success, "Withdrawal failed");

    emit GeneralWithdrawal(msg.sender, totalAmount);
  }

  function setCampaignStatus(
    uint256 campaignId,
    bool active
  ) external campaignExists(campaignId) onlyCampaignCreator(campaignId) {
    campaigns[campaignId].active = active;

    emit CampaignStatusChanged(campaignId, active);
  }

  function getCampaign(
    uint256 campaignId
  ) external view campaignExists(campaignId) returns (Campaign memory) {
    return campaigns[campaignId];
  }

  function getAvailableBalance(
    uint256 campaignId
  ) external view campaignExists(campaignId) returns (uint256) {
    Campaign storage campaign = campaigns[campaignId];
    return campaign.totalRaised - campaign.totalWithdrawn;
  }
}
