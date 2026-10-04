# Withdrawal flow

Withdrawals are direct contract transactions. The backend does not approve, relay, or custody creator funds.

## Single-campaign withdrawal

```mermaid
sequenceDiagram
    actor Creator
    participant Frontend
    participant Contract
    participant Wallet

    Frontend->>Contract: getCampaign and getAvailableBalance
    Contract-->>Frontend: Creator and available balance
    Frontend->>Frontend: Compare connected wallet with creator
    Creator->>Frontend: Enter amount or select maximum
    Frontend->>Wallet: Request withdraw transaction
    Creator->>Wallet: Approve transaction
    Wallet->>Contract: withdraw campaignId, amount
    Contract->>Contract: Validate owner and balance
    Contract->>Contract: Increase totalWithdrawn
    Contract->>Creator: Transfer ETH
    Contract-->>Wallet: Emit FundsWithdrawn
    Wallet-->>Frontend: Confirmed receipt
    Frontend->>Contract: Refresh campaign and balance
```

Available balance is:

```text
totalRaised - totalWithdrawn
```

The contract rejects zero amounts, amounts above the available balance, and callers who are not the campaign creator.

## Consolidated withdrawal

The creator wallet page loads all published campaigns associated with the authenticated creator, verifies their on-chain creator addresses, and reads each available balance.

```mermaid
sequenceDiagram
    actor Creator
    participant Frontend
    participant Wallet
    participant Contract

    Frontend->>Contract: Read creator campaigns and balances
    Contract-->>Frontend: Available balance per campaign
    Creator->>Frontend: Withdraw total balance
    Frontend->>Wallet: withdrawFromCampaigns with funded campaign IDs
    Creator->>Wallet: Approve transaction
    Wallet->>Contract: Submit batch withdrawal
    loop Every campaign ID
        Contract->>Contract: Verify existence and creator
        Contract->>Contract: Move available balance to withdrawn accounting
        Contract->>Contract: Emit FundsWithdrawn
    end
    Contract->>Creator: Transfer combined ETH once
    Contract->>Contract: Emit GeneralWithdrawal
    Contract-->>Frontend: Confirmed receipt
    Frontend->>Contract: Refresh every balance
```

The entire consolidated transaction reverts if any supplied campaign does not exist or belongs to another wallet. Campaigns with a zero balance are skipped, but the final combined amount must be greater than zero.

## Reentrancy protection

Both withdrawal functions use a contract-wide non-reentrancy lock. Accounting is updated before the external ETH transfer, following the checks-effects-interactions pattern.

## Analytics behavior

Withdrawals do not reduce historical donation totals. Analytics reports gross contributions. The creator wallet reads the current withdrawable amount directly from the contract.

