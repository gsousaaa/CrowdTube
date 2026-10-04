# Wallet authentication flow

CrowdTube authenticates creators by proving ownership of an Ethereum wallet. Signing the login message is free: it is not a blockchain transaction and does not spend gas.

## Sequence

```mermaid
sequenceDiagram
    actor Creator
    participant Frontend
    participant Wallet
    participant API
    participant Database

    Creator->>Frontend: Connect wallet
    Frontend->>API: GET /auth/me
    alt Existing valid session for this wallet
        API->>Database: Validate hashed session token
        Database-->>API: Active session and wallet
        API-->>Frontend: Current user profile
    else No valid matching session
        Frontend->>API: POST /auth/challenge with wallet address
        API->>Database: Store expiring single-use nonce
        API-->>Frontend: Challenge ID and login message
        Frontend->>Frontend: Verify challenge chain ID
        Frontend->>Wallet: Request message signature
        Creator->>Wallet: Approve signature
        Wallet-->>Frontend: Signature
        Frontend->>API: POST /auth/verify
        API->>API: Recover and verify signer
        API->>Database: Lock and consume nonce
        alt First login for this wallet
            API->>Database: Create user and primary wallet
        end
        API->>Database: Store hashed session token
        API-->>Frontend: Set HttpOnly session cookie
        Frontend->>API: GET /auth/me
        API-->>Frontend: Current user profile
    end

    alt New user or missing display name
        Frontend-->>Creator: Show profile onboarding
    else Profile already configured
        Frontend-->>Creator: Open creator dashboard
    end
```

## Challenge message

The backend creates a structured message containing:

- Authentication domain and URI.
- Wallet address.
- Chain ID.
- Random nonce.
- Issue and expiration timestamps.

The frontend checks the chain ID before asking the wallet to sign. The backend reconstructs the expected message rather than trusting message text supplied by the browser.

## Session security

- A nonce is single-use and expires after `AUTH_NONCE_TTL_SECONDS`.
- Verification locks the nonce in a database transaction to prevent concurrent reuse.
- Only a hash of the session token is stored in PostgreSQL.
- The raw token is returned as an HttpOnly cookie.
- Production cookies are marked `Secure`.
- Logout revokes the server-side session and clears the cookie.
- Every `/admin` API route validates the session and resolves its linked wallet.

## User and wallet identity

The user profile is independent from a wallet address. A `user_wallets` row links a verified address to a user. The current MVP creates one primary wallet on first login, while the data model allows multiple linked wallets in the future.

## Common failures

| Failure | Result |
| --- | --- |
| Frontend and backend chain IDs differ | Frontend reports a network mismatch before signing |
| User rejects signature | Authentication remains incomplete |
| Nonce expired | API returns an authentication error; request a new challenge |
| Nonce already used | API rejects replay with a conflict response |
| Signature belongs to another address | API rejects the signature |
| Cookie expired or revoked | Protected API returns `401 UNAUTHENTICATED` |

