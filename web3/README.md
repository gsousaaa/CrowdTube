# CrowdTube smart contracts

Solidity contracts, tests, and Hardhat Ignition deployments for CrowdTube.

The main application contract is `contracts/CrowdTubeCampaigns.sol`. It supports multiple campaigns, ETH donations, pause/resume controls, individual withdrawals, and consolidated creator withdrawals.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run build` | Compile Solidity and generate artifacts |
| `npm test` | Run contract tests on an ephemeral chain |
| `npm run node` | Start a persistent local Hardhat node |
| `npm run deploy:campaigns:local` | Deploy on an ephemeral simulated network |
| `npm run deploy:campaigns:localhost` | Deploy to the running local node |
| `npm run deploy:campaigns:sepolia` | Deploy to Sepolia with the optimized profile |
| `npm run deploy:local` | Deploy the standalone `DonationVault` example locally |
| `npm run deploy:localhost` | Deploy `DonationVault` to the running local node |

## Local workflow

Terminal 1:

```bash
npm ci
npm run node
```

Terminal 2:

```bash
npm run deploy:campaigns:localhost
```

Copy the deployed address into both backend and frontend environment files. Use deployment block `0` for a fresh local chain.

## Sepolia

Store the Sepolia RPC URL and the dedicated deployer key in Hardhat's encrypted keystore:

```bash
npx hardhat keystore set SEPOLIA_RPC_URL
npx hardhat keystore set SEPOLIA_PRIVATE_KEY
```

Then run:

```bash
npm run deploy:campaigns:sepolia
```

The private key is used only to deploy the contract. It must never be copied into the frontend or backend application configuration. See [Hardhat deployment environment](../docs/configuration.md#hardhat-deployment-environment) for value formats, temporary shell configuration, and secret-handling details.

## Documentation

- [Smart contracts and Web3](../docs/web3.md)
- [Complete local setup](../docs/getting-started.md)
- [Configuration reference](../docs/configuration.md)
- [Deployment](../docs/deployment.md)
