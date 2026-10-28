import { decodeFunctionResult, encodeFunctionData, keccak256, pad, toBytes, toEventSelector, type Abi } from "viem";
import { BRAND, isAddress } from "@/config/brand";
import { CONTRACTS, logLive } from "@/config/contracts";
import { QUESTS } from "@/config/seasons";
import { ERC20_ABI, LOG_ABI } from "@/lib/abi";
import { rpcBatchLoose, rpcCall } from "@/lib/client";
import type { FarmerState } from "@/lib/season/clock";
import type { Readings } from "@/lib/season/quests";

/*
 * Reads everything the quest board needs for one wallet from Base, all at ONE block so the inputs agree:
 * nonce, ETH balance, balanceOf for the quest tokens (and $REAPO once live), Transfer logs sent by the wallet in
 * each quest's look-back window, and the ReapoSeasonLog farmer record once the contract is deployed.
 * Goes through the site's relay first (src/lib/client.ts).
 */

const TRANSFER = toEventSelector("Transfer(address,address,uint256)");
const hex = (n: number | bigint) => `0x${BigInt(n).toString(16)}`;
const balanceOf = (token: string, who: string) => ({
  method: "eth_call",
  params: [{ to: token, data: encodeFunctionData({ abi: ERC20_ABI as Abi, functionName: "balanceOf", args: [who] }) }],
});

export type ChainReadings = Omit<Readings, "farmer" | "today" | "checkInSource"> & {
  chainFarmer: FarmerState | null;
  /** Quest ids already stamped on ReapoSeasonLog this season, with the kind of stamp. */
  chainStamps: Record<string, "contract" | "self">;
};

/** On-chain id of a self-claimed quest stamp. */
export const questKey = (id: string) => keccak256(toBytes(`reapo.quest.${id}`));

export async function readWallet(address: string, seasonIndex: number): Promise<ChainReadings> {
  if (!isAddress(address)) throw new Error("Not a 0x address.");
  const head = await rpcCall<string>("eth_blockNumber", []);
  const block = Number(BigInt(head));
  const tag = hex(block);
  const tokens = [...new Set(QUESTS.flatMap((q) => (q.kind.type === "tokenBalance" ? [q.kind.token.toLowerCase()] : [])))];
  const sentQuests = QUESTS.flatMap((q) => (q.kind.type === "sentToken" ? [q.kind] : []));
  const reapoLive = isAddress(BRAND.ca);
  const calls: { method: string; params: unknown[] }[] = [
    { method: "eth_getTransactionCount", params: [address, tag] },
    { method: "eth_getBalance", params: [address, tag] },
    ...tokens.map((t) => {
      const c = balanceOf(t, address);
      return { method: c.method, params: [...c.params, tag] };
    }),
  ];
  if (reapoLive) calls.push({ method: "eth_call", params: [...balanceOf(BRAND.ca, address).params, tag] });
  const logStart = calls.length;
  for (const s of sentQuests) {
    const from = Math.max(0, block - s.lookbackBlocks + 1);
    calls.push({ method: "eth_getLogs", params: [{ address: s.token, fromBlock: hex(from), toBlock: tag, topics: [TRANSFER, pad(address as `0x${string}`).toLowerCase()] }] });
  }
  const farmerAt = calls.length;
  const stampAt = farmerAt + 1;
  if (logLive()) {
    calls.push({ method: "eth_call", params: [{ to: CONTRACTS.log, data: encodeFunctionData({ abi: LOG_ABI as Abi, functionName: "farmerOf", args: [BigInt(seasonIndex), address] }) }, tag] });
    for (const q of QUESTS) {
      const data =
        q.kind.type === "streak"
          ? encodeFunctionData({ abi: LOG_ABI as Abi, functionName: "streakStampOf", args: [BigInt(seasonIndex), address, q.kind.days] })
          : encodeFunctionData({ abi: LOG_ABI as Abi, functionName: "selfStampOf", args: [BigInt(seasonIndex), address, questKey(q.id)] });
      calls.push({ method: "eth_call", params: [{ to: CONTRACTS.log, data }, tag] });
    }
  }

  const raw = await rpcBatchLoose(calls);
  const big = (v: unknown) => (typeof v === "string" && /^0x[0-9a-fA-F]+$/.test(v) ? BigInt(v) : null);
  const word = (v: unknown) => (typeof v === "string" && v.length >= 66 ? BigInt(v.slice(0, 66)) : null);
  const tokenOut: Record<string, bigint | null> = {};
  tokens.forEach((t, i) => (tokenOut[t] = word(raw[2 + i])));
  const sent: Readings["sent"] = {};
  sentQuests.forEach((s, i) => {
    const logs = raw[logStart + i];
    const from = Math.max(0, block - s.lookbackBlocks + 1);
    if (!Array.isArray(logs)) {
      sent[s.token.toLowerCase()] = null;
      return;
    }
    const last = logs[logs.length - 1] as { blockNumber?: string; transactionHash?: string } | undefined;
    sent[s.token.toLowerCase()] = { count: logs.length, lastBlock: last?.blockNumber ? Number(BigInt(last.blockNumber)) : null, lastTx: last?.transactionHash ?? null, fromBlock: from };
  });
  let chainFarmer: FarmerState | null = null;
  if (logLive() && typeof raw[farmerAt] === "string") {
    try {
      const f = decodeFunctionResult({ abi: LOG_ABI as Abi, functionName: "farmerOf", data: raw[farmerAt] as `0x${string}` }) as { lastDay: number; streak: number; bestStreak: number; checkIns: number };
      chainFarmer = { lastDay: Number(f.lastDay), streak: Number(f.streak), bestStreak: Number(f.bestStreak), checkIns: Number(f.checkIns) };
    } catch {
      chainFarmer = null;
    }
  }
  const chainStamps: ChainReadings["chainStamps"] = {};
  if (logLive())
    QUESTS.forEach((q, i) => {
      const w = word(raw[stampAt + i]);
      if (w !== null && w > 0n) chainStamps[q.id] = q.kind.type === "streak" ? "contract" : "self";
    });
  const nonce = big(raw[0]);
  return {
    address,
    block,
    nonce: nonce === null ? null : Number(nonce),
    ethWei: big(raw[1]),
    tokens: tokenOut,
    sent,
    ...(reapoLive ? { reapo: word(raw[2 + tokens.length]) } : {}),
    chainFarmer,
    chainStamps,
  };
}
