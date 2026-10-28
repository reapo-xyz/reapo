import "server-only";
import { decodeFunctionResult, encodeFunctionData, type Abi } from "viem";
import { BRAND, CHAIN, ETH_USD_FEED, isAddress } from "@/config/brand";
import { CONTRACTS, logLive } from "@/config/contracts";
import { ERC20_ABI, FEED_ABI, LOG_ABI } from "@/lib/abi";
import { rpcBatch } from "@/lib/feeds/rpc";
import { readCappedResponse } from "@/lib/server/capped";
import { seasonAt } from "@/lib/season/clock";

/*
 * Live facts for the whole site, read from Robinhood Chain: the latest block, block pace, gas price, transactions in the latest block,
 * ETH / USD from the Chainlink feed on chain, the $REAPO token once its address is published (name, symbol, decimals, supply from the token itself,
 * holders from Blockscout, price and liquidity from GeckoTerminal) and the ReapoSeasonLog season totals once deployed.
 * Every number comes from a live source; a source that fails leaves its field null and the site shows "—".
 */

export type ChainSnapshot = {
  at: number;
  block: number | null;
  blockTime: number | null;
  /** Average seconds per block over the last 3,000 blocks. */
  blockPace: number | null;
  gasGwei: number | null;
  txsInBlock: number | null;
  ethUsd: number | null;
  ethUsdSource: string | null;
  token: {
    name: string | null;
    symbol: string | null;
    supply: string | null;
    decimals: number | null;
    holders: number | null;
    priceUsd: number | null;
    liquidityUsd: number | null;
  } | null;
  season: { index: number; farmers: number | null; checkIns: number | null; streakStamps: number | null; selfStamps: number | null } | null;
};

type Read = { to: string; abi: Abi; fn: string; args?: unknown[] };
const call = (r: Read) => ({ method: "eth_call", params: [{ to: r.to, data: encodeFunctionData({ abi: r.abi, functionName: r.fn, args: r.args ?? [] } as never) }, "latest"] });
function decode<T>(r: Read, raw: unknown): T | null {
  if (typeof raw !== "string" || raw.length < 4) return null;
  try {
    return decodeFunctionResult({ abi: r.abi, functionName: r.fn, data: raw as `0x${string}` } as never) as T;
  } catch {
    return null;
  }
}

async function getJson(url: string, headers: Record<string, string> = {}): Promise<unknown> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 6000);
  try {
    const res = await fetch(url, { headers: { accept: "application/json", "user-agent": "Mozilla/5.0 (compatible; site-reader)", ...headers }, cache: "no-store", signal: ctrl.signal });
    if (!res.ok || !res.body) return null;
    const text = await readCappedResponse(res, 300_000);
    return text ? JSON.parse(text) : null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** ETH / USD from the Chainlink ETH / USD feed on Robinhood Chain (8 decimals). */
const FEED_READ: Read = { to: ETH_USD_FEED, abi: FEED_ABI as Abi, fn: "latestRoundData" };
const ETH_USD_SOURCE = "Chainlink ETH / USD on Robinhood Chain";

/** Holder count from Blockscout: the PRO API when BLOCKSCOUT_API_KEY is set, else the public instance (may refuse bots). */
async function holders(ca: string): Promise<number | null> {
  const key = process.env.BLOCKSCOUT_API_KEY;
  const url = key ? `https://api.blockscout.com/${CHAIN.id}/api/v2/tokens/${ca}/counters?apikey=${encodeURIComponent(key)}` : `${CHAIN.blockscout}/api/v2/tokens/${ca}/counters`;
  const j = (await getJson(url)) as { token_holders_count?: string } | null;
  const n = Number(j?.token_holders_count);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

/** Price and pool liquidity of the token on Robinhood Chain from GeckoTerminal (keyless). */
async function market(ca: string): Promise<{ priceUsd: number | null; liquidityUsd: number | null }> {
  const j = (await getJson(`https://api.geckoterminal.com/api/v2/networks/robinhood/tokens/${ca.toLowerCase()}`)) as { data?: { attributes?: { price_usd?: string; total_reserve_in_usd?: string } } } | null;
  const p = Number(j?.data?.attributes?.price_usd);
  const l = Number(j?.data?.attributes?.total_reserve_in_usd);
  return { priceUsd: Number.isFinite(p) && p > 0 ? p : null, liquidityUsd: Number.isFinite(l) && l > 0 ? l : null };
}

export async function readSnapshot(): Promise<ChainSnapshot> {
  const ca = isAddress(BRAND.ca) ? BRAND.ca : null;
  const season = seasonAt(Math.floor(Date.now() / 1000));
  const reads: Read[] = [FEED_READ];
  if (ca) for (const fn of ["name", "symbol", "totalSupply", "decimals"]) reads.push({ to: ca, abi: ERC20_ABI as Abi, fn });
  if (logLive()) reads.push({ to: CONTRACTS.log, abi: LOG_ABI as Abi, fn: "totalsOf", args: [BigInt(season.index)] });
  const head = [
    { method: "eth_getBlockByNumber", params: ["latest", false] },
    { method: "eth_gasPrice", params: [] },
  ];
  const [h, results, extra] = await Promise.all([
    rpcBatch<unknown>(head).catch(() => [null, null]),
    rpcBatch<unknown>(reads.map(call)).catch(() => reads.map(() => null)),
    ca ? Promise.all([holders(ca), market(ca)]) : Promise.resolve(null),
  ]);
  const block = h[0] && typeof h[0] === "object" ? (h[0] as { number: string; timestamp: string; transactions?: unknown[] }) : null;
  const gas = typeof h[1] === "string" ? h[1] : null;
  let pace: number | null = null;
  if (block) {
    const back = await rpcBatch<{ timestamp: string }>([{ method: "eth_getBlockByNumber", params: [`0x${(BigInt(block.number) - 3000n).toString(16)}`, false] }]).catch(() => [null]);
    if (back[0]) pace = (Number(BigInt(block.timestamp)) - Number(BigInt(back[0].timestamp))) / 3000;
  }
  const feed = decode<readonly [bigint, bigint, bigint, bigint, bigint]>(FEED_READ, results[0]);
  const ethUsd = feed && feed[1] > 0n ? Number(feed[1]) / 1e8 : null;
  let i = 1;
  let token: ChainSnapshot["token"] = null;
  if (ca) {
    const v = reads.slice(i, i + 4).map((r, k) => decode<string | bigint | number>(r, results[i + k]));
    i += 4;
    token = {
      name: typeof v[0] === "string" ? v[0] : null,
      symbol: typeof v[1] === "string" ? v[1] : null,
      supply: typeof v[2] === "bigint" ? v[2].toString() : null,
      decimals: v[3] === null ? null : Number(v[3]),
      holders: extra ? extra[0] : null,
      priceUsd: extra ? extra[1].priceUsd : null,
      liquidityUsd: extra ? extra[1].liquidityUsd : null,
    };
  }
  let seasonTotals: ChainSnapshot["season"] = null;
  if (logLive()) {
    const t = decode<{ farmers: number; checkIns: number; streakStamps: number; selfStamps: number }>(reads[i], results[i]);
    seasonTotals = { index: season.index, farmers: t ? Number(t.farmers) : null, checkIns: t ? Number(t.checkIns) : null, streakStamps: t ? Number(t.streakStamps) : null, selfStamps: t ? Number(t.selfStamps) : null };
  }
  return {
    at: Date.now(),
    block: block ? Number(BigInt(block.number)) : null,
    blockTime: block ? Number(BigInt(block.timestamp)) : null,
    blockPace: pace,
    gasGwei: gas ? Number(BigInt(gas)) / 1e9 : null,
    txsInBlock: block && Array.isArray(block.transactions) ? block.transactions.length : null,
    ethUsd,
    ethUsdSource: ethUsd === null ? null : ETH_USD_SOURCE,
    token,
    season: seasonTotals,
  };
}
