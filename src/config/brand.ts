// Single place to change project identity. Everything on the site reads from here.
// To publish the real contract address, replace the value of CA below. The navbar copy pill, the footer,
// the token page, the buy buttons and every explorer link derive from it. Anything that is not a 0x + 40 hex
// address is treated as "not launched yet".

const CA: string = "TBA";

/**
 * True once the domain points at this deployment. While false, the production *.vercel.app host is served
 * as is (kept out of search with noindex) instead of redirecting to a domain that does not serve the site.
 * 27 Oct 2026: reapo.xyz is registered (Namecheap parking page); flip this once it serves this deployment.
 */
export const DOMAIN_LIVE = false;

export const isAddress = (v: string): v is `0x${string}` => /^0x[0-9a-fA-F]{40}$/.test(v);

const NAME = "Reapo";
const SLUG = "reapo";
/** Shown upper case everywhere; the owner wrote it as $reapo. */
const TICKER = "REAPO";
const DOMAIN = "reapo.xyz";
/** X handle from the owner's order (x.com/reapo). It looks generic; confirm it is the project's account. */
const X_HANDLE = "reapo";

export const BRAND = {
  name: NAME,
  /** Lowercase id for package names and the like. Never used for stored keys (those are neutral). */
  slug: SLUG,
  ticker: TICKER,
  symbol: `$${TICKER}`,
  domain: DOMAIN,
  url: `https://${DOMAIN}`,
  slogan: "Discover. Participate. Grow.",
  tagline: "Seasonal onchain farming, quests & rewards.",
  category: "seasonal onchain quests",
  chainName: "Base",
  description: `${NAME} is a seasonal onchain quest board on Base. Check in daily, clear quests checked against your wallet's real Base activity, and track your season progress on the Farmboard.`,
  x: `https://x.com/${X_HANDLE}`,
  xHandle: `@${X_HANDLE}`,
  // Public source repository. Empty until the owner publishes it; the site hides every GitHub link meanwhile.
  github: "",
  ca: CA,
} as const;

/** True once BRAND.github points at an actual repository, not the bare host. */
export const hasGithub = /^https:\/\/github\.com\/[^/]+/.test(BRAND.github);

// Public endpoints are the default. An operator can point the site at a private RPC with BASE_RPC_URL
// (server) / NEXT_PUBLIC_BASE_RPC_URL (browser). Both are optional.
const PUBLIC_RPC = "https://base-rpc.publicnode.com";

export const CHAIN = {
  id: 8453,
  hex: "0x2105",
  name: "Base",
  nativeSymbol: "ETH",
  decimals: 18,
  /** RPC handed to wallets in wallet_addEthereumChain (the official public endpoint). */
  publicRpc: "https://mainnet.base.org",
  rpc: process.env.NEXT_PUBLIC_BASE_RPC_URL || PUBLIC_RPC,
  /** Second public endpoint, used for reads only when the first one fails. */
  fallbackRpc: "https://mainnet.base.org",
  /** Third read endpoint for server code. */
  spareRpc: "https://base.drpc.org",
  /** Explorer for links. */
  explorer: "https://basescan.org",
  /** Blockscout instance for keyless API reads (holders); may be behind a bot check from some networks. */
  blockscout: "https://base.blockscout.com",
  /** Typical block time in seconds (Base produces a block every 2 s). */
  blockSeconds: 2,
} as const;

/** RPC for server code: the private endpoint when set, else the public one. */
export function serverRpc() {
  return process.env.BASE_RPC_URL || process.env.NEXT_PUBLIC_BASE_RPC_URL || PUBLIC_RPC;
}

export const TOKEN = {
  get isLive() {
    return isAddress(BRAND.ca);
  },
  get explorerUrl() {
    return isAddress(BRAND.ca) ? explorerToken(BRAND.ca) : null;
  },
};

export function explorerAddress(address: string) {
  return `${CHAIN.explorer}/address/${address}`;
}
export function explorerToken(address: string) {
  return `${CHAIN.explorer}/token/${address}`;
}
export function explorerTx(hash: string) {
  return `${CHAIN.explorer}/tx/${hash}`;
}
export function explorerBlock(n: number) {
  return `${CHAIN.explorer}/block/${n}`;
}
export function shortAddress(address: string, head = 6, tail = 4) {
  if (address.length <= head + tail + 2) return address;
  return `${address.slice(0, head)}…${address.slice(-tail)}`;
}

/** Native USDC on Base (Circle). Read on-chain: symbol USDC, 6 decimals. */
export const USDC = {
  address: "0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913",
  symbol: "USDC",
  decimals: 6,
} as const;

/** Wrapped ETH predeploy on Base. */
export const WETH = "0x4200000000000000000000000000000000000006";

/**
 * Own-token launchpad: o1 Launchpad on Base (owner choice). The token-page URL format is not confirmed yet, so
 * there is ONE template below; until the CA is real every buy button opens the launchpad home.
 * After launch the token trades in its o1 Uniswap v4 pool (fixed 1B supply, 18 decimals, permanently locked
 * liquidity, 1% fee in ETH or creator tax). Describe it only in those neutral words.
 */
export const LAUNCHPAD = {
  name: "o1 Launchpad",
  home: "https://launch.o1.exchange/",
  /** `{ca}` is replaced with the token address. Unconfirmed: change here once the owner has the real page. */
  tokenTemplate: "https://launch.o1.exchange/token/{ca}",
  pool: "Uniswap v4",
} as const;

/** Where a buy button goes: the token page once the CA is real, else the launchpad home. Never disabled. */
export function buyUrl(): string {
  return isAddress(BRAND.ca) ? LAUNCHPAD.tokenTemplate.replace("{ca}", BRAND.ca) : LAUNCHPAD.home;
}

/**
 * Chart links: DEXTools only (owner decision 23 Oct 2026). Base is listed on DEXTools under the chain slug "base".
 * The pair explorer accepts a token address and opens its main pool. Change the slug or the pattern here only.
 */
export const DEXTOOLS_CHAIN = "base";
export function chartUrl(address: string): string | null {
  return isAddress(address) ? `https://www.dextools.io/app/en/${DEXTOOLS_CHAIN}/pair-explorer/${address.toLowerCase()}` : null;
}
