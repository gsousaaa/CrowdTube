# CrowdTube frontend

The frontend is a Next.js 16 application for creators, supporters, and public visitors. It combines backend API data with direct smart-contract reads and wallet-approved writes through thirdweb.

## Main routes

| Route | Purpose |
| --- | --- |
| `/` | Wallet login and first-profile onboarding |
| `/campaigns` | Public campaign search and pagination |
| `/campaigns/[id]` | Public campaign details, donation form, and history |
| `/admin` | Creator campaign dashboard |
| `/admin/campaigns/[id]` | Campaign management, withdrawal, and history |
| `/admin/profile` | Creator profile management |
| `/admin/wallet` | Consolidated campaign balances and withdrawal |
| `/admin/analytics` | Donation analytics dashboard |

## Development

```bash
npm ci
npm run dev
```

Copy `.env.example` to `.env` and configure:

- Thirdweb client ID.
- `hardhat` or `sepolia` network.
- Address of `CrowdTubeCampaigns` on that network.
- Backend API URL.

Open <http://localhost:3000>.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start Next.js in development mode |
| `npm run build` | Create a production build |
| `npm start` | Run the production build |
| `npm run lint` | Run ESLint |

## Data access

- `src/lib/api` contains backend HTTP calls and always sends session cookies.
- `src/lib/web3` selects the chain and creates the contract client.
- Contract reads show authoritative financial state.
- Contract writes are signed by the connected browser wallet.
- English and Portuguese messages live in `src/i18n/messages`.

## Documentation

- [Complete local setup](../docs/getting-started.md)
- [Project structure](../docs/project-structure.md)
- [Architecture](../docs/architecture.md)
- [Wallet authentication](../docs/flows/authentication.md)
- [Campaign creation](../docs/flows/campaign-creation.md)
- [Donation flow](../docs/flows/donation.md)
- [Withdrawal flow](../docs/flows/withdrawal.md)
