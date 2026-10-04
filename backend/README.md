# CrowdTube backend

The backend provides wallet authentication, creator profiles, off-chain campaign metadata, media authorization, donation history, notifications, analytics, and blockchain event workers.

It is a Node.js application built with Fastify, TypeORM, PostgreSQL, Viem, BullMQ, and Redis.

## Processes

The module produces two independent runtime processes:

- `src/server.ts`: HTTP API.
- `src/workers/index.ts`: campaign and donation recurring workers.

Both use PostgreSQL. The worker additionally requires Redis and a blockchain RPC endpoint.

## Development

```bash
npm ci
npm run infra:up
npm run migration:run
npm run dev
```

Start the workers in another terminal:

```bash
npm run worker:dev
```

Copy `.env.example` to `.env` and update the database, AWS, RPC, chain, contract, and deployment block values before starting.

## Commands

| Command | Purpose |
| --- | --- |
| `npm run dev` | Start the API with TypeScript file watching |
| `npm run worker:dev` | Start both workers with file watching |
| `npm run build` | Compile to `dist` |
| `npm start` | Run the compiled API |
| `npm run worker:start` | Run the compiled workers |
| `npm test` | Compile and run all backend tests |
| `npm run lint` | Run ESLint |
| `npm run infra:up` | Start PostgreSQL and Redis in Docker |
| `npm run db:up` | Start only PostgreSQL |
| `npm run db:down` | Stop Docker Compose services |
| `npm run db:logs` | Follow PostgreSQL logs |
| `npm run migration:run` | Apply pending TypeORM migrations |
| `npm run migration:revert` | Revert the most recent migration |

## Local URLs

- API: <http://localhost:3333>
- Swagger UI: <http://localhost:3333/docs>
- Health check: <http://localhost:3333/health>

## Documentation

- [Complete local setup](../docs/getting-started.md)
- [Backend architecture](../docs/architecture.md)
- [Configuration reference](../docs/configuration.md)
- [Database](../docs/database.md)
- [Campaign indexing](../docs/flows/campaign-indexing.md)
- [Donation indexing](../docs/flows/donation-indexing.md)

