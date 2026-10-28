# Reapo — Seasonal onchain farming, quests & rewards.

**Discover. Participate. Grow.** Reapo is a seasonal onchain quest board on Base, shown as a small pixel farm.

## The problem

Onchain "quest" and "points" campaigns are often opaque: rules change mid-season, progress is counted from
screenshots or forms, and nobody can check why one wallet qualified and another did not. Rewards get announced
before anyone knows where they come from.

## The solution

Reapo keeps every part checkable:

- **Seasons** with a fixed clock (28 days, UTC days) that is built into the contract, so the site and the chain agree.
- **Quests** that read public Base data for a wallet at one block (nonce, ETH balance, token balances, transfer
  logs) and print the exact value each tick was decided on.
- **Daily check-ins** and streaks recorded by a tiny contract with no owner, which can verify streak quests itself.
- **Farmboard** points and levels that are labels only. The current season is a preview: no reward pool is funded.

## How it works

1. Connect a wallet (Coinbase Wallet, MetaMask, Phantom, Rabby, WalletConnect) or paste any Base address read-only.
2. The quest board reads the wallet through the site's rate-limited relay and applies the published rules in
   `src/config/seasons.ts`.
3. Check in once per UTC day. `ReapoSeasonLog` keeps your streak; `stampStreak` lets the contract confirm streak
   quests, `stampSelfClaimed` records a self-claimed stamp with an evidence hash (clearly labelled as such).
4. Until the contract address is set, check-ins and stamps run in practice mode in your browser.

## What you can try

Live now: the farm and HUD with live Base data (block, block time, gas, transactions per block, ETH/USD), the quest
board for any address, practice check-ins, the Farmboard, the season guide.
Coming later (planned, not live): the on-chain season log once deployed, funded reward pools, partner campaigns and
$REAPO utility.

## Run it locally

Requires Node 20+.

```sh
npm install
npm run build
npm start          # http://localhost:5700
npm test           # unit tests (quests, clock, relay, verify-deployment logic)
npm run typecheck
```

Environment variables (all optional; set them in your shell or your host's dashboard, never commit them):

| Name | Purpose |
| --- | --- |
| `BASE_RPC_URL` | Server-side Base RPC (default: public endpoints) |
| `NEXT_PUBLIC_BASE_RPC_URL` | Browser Base RPC (default: public endpoints) |
| `NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID` | Enables WalletConnect (id from cloud.reown.com) |
| `BLOCKSCOUT_API_KEY` | Holder count via Blockscout PRO API (`proapi_…`) |
| `KV_REDIS_URL` / `REDIS_URL` or `KV_REST_API_URL` + `KV_REST_API_TOKEN` | Shared rate-limit store for the relay |
| `TRUST_PROXY_HEADERS` | `1` behind a trusted proxy that sets client IP headers |

### Contracts

```sh
cd contracts && ./setup.sh             # fetches forge-std into contracts/lib
forge test                             # unit, fuzz and invariant tests
forge test --match-path test/fork/ReapoFork.t.sol --fork-url https://base-rpc.publicnode.com
forge build --force && cd .. && npm run contracts:artifacts -- --check
```

### Verify a deployment

```sh
npm run verify-deployment -- --log <address> --log-tx <creation tx>
```

It checks the chain id, that the runtime code equals this build with the expected immutables, and that the creation
input is exactly this build plus `(GENESIS, SEASON_DAYS)`.

## Network

Base mainnet, chain id 8453, native ETH, explorer https://basescan.org. The site adds Base to your wallet on connect.

## Project layout

```
src/app/            routes (farm panels, guide, legal pages, API: /api/chain, /api/rpc)
src/components/farm game shell, pixel farm canvas, panels, season state
src/config/         brand.ts (name, CA, launchpad), seasons.ts (clock, quests, levels), contracts.ts, wallets.ts
src/lib/season/     clock + quest rules (pure, tested), wallet reader
contracts/          ReapoSeasonLog + tests (Foundry)
scripts/            artifact export and verify-deployment
```

## Contracts and token

- `ReapoSeasonLog` — constructor `(1792972800, 28)`; no owner, no fee, no payable function, no upgrade.
  Address: not deployed yet.
- `$REAPO` — launches on o1 Launchpad on Base. Contract address: TBA (published on the token page first).

## Security and status

Contracts are small and fully tested (unit, fuzz, invariant, Base fork, browser end-to-end on a local chain). They hold
no funds. Points and levels have no value and never convert into tokens. Nothing here is financial advice.

## Contributing

Issues and pull requests are welcome. Download the ZIP or fork the repository, run the tests above, and keep copy
honest: no promises of rewards or returns.

## License

MIT, see `LICENSE`.
