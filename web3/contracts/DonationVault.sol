// SPDX-License-Identifier: MIT
pragma solidity ^0.8.34;

contract DonationVault {
  address public immutable owner;
  uint256 public immutable campaignId;
  uint256 public totalDonated;

  mapping(address donor => uint256 amount) public donations;

  event DonationReceived(
    uint256 indexed campaignId,
    address indexed donor,
    uint256 amount
  );
  event Withdrawal(address indexed owner, uint256 amount);

  constructor(uint256 _campaignId) {
    owner = msg.sender;
    campaignId = _campaignId;
  }

  function donate() external payable {
    require(msg.value > 0, "Donation must be greater than zero");

    donations[msg.sender] += msg.value;
    totalDonated += msg.value;

    emit DonationReceived(campaignId, msg.sender, msg.value);
  }

  function withdraw() external {
    require(msg.sender == owner, "Only owner can withdraw");

    uint256 balance = address(this).balance;
    require(balance > 0, "No funds to withdraw");

    (bool success, ) = payable(owner).call{value: balance}("");
    require(success, "Withdrawal failed");

    emit Withdrawal(owner, balance);
  }
}
