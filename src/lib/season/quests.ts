import type { Quest } from "@/config/seasons";
import type { FarmerState } from "@/lib/season/clock";

/*
 * Quest checks as pure functions over readings taken from Robinhood Chain at one block. Each result carries the exact input
 * it was decided on, so the board can show "nonce 31 at block 53,144,686" next to the tick.
 */

export type Readings = {
  address: string;
  /** Block every chain value was read at. */
  block: number;
  nonce: number | null;
  ethWei: bigint | null;
  /** balanceOf(address) per token, keyed by lowercase token address. */
  tokens: Record<string, bigint | null>;
  /** ERC-20 Transfer logs sent by the wallet in the look-back window, keyed by lowercase token. */
  sent: Record<string, { count: number; lastBlock: number | null; lastTx: string | null; fromBlock: number } | null>;
  /** $REAPO balance; undefined while the token has no address. */
  reapo?: bigint | null;
  /** Check-in state for the current season; from the contract, or from this browser in practice mode. */
  farmer: FarmerState | null;
  today: number | null;
  checkInSource: "contract" | "practice";
};

export type QuestResult = {
  status: "done" | "open" | "waiting" | "unknown";
  /** The value the rule was decided on, in words. */
  input: string;
};

const fmtUnits = (v: bigint, decimals: number, digits = 4) => {
  const base = 10n ** BigInt(decimals);
  const whole = v / base;
  const frac = (v % base).toString().padStart(decimals, "0").slice(0, digits).replace(/0+$/, "");
  return frac ? `${whole.toLocaleString("en-US")}.${frac}` : whole.toLocaleString("en-US");
};

export function evaluate(q: Quest, r: Readings): QuestResult {
  const k = q.kind;
  switch (k.type) {
    case "nonce":
      if (r.nonce === null) return { status: "unknown", input: "nonce could not be read" };
      return { status: r.nonce >= k.min ? "done" : "open", input: `nonce ${r.nonce.toLocaleString("en-US")}` };
    case "ethBalance":
      if (r.ethWei === null) return { status: "unknown", input: "balance could not be read" };
      return { status: r.ethWei >= BigInt(k.minWei) ? "done" : "open", input: `${fmtUnits(r.ethWei, 18, 5)} ETH` };
    case "tokenBalance": {
      const v = r.tokens[k.token.toLowerCase()];
      if (v === null || v === undefined) return { status: "unknown", input: `${k.symbol} balance could not be read` };
      return { status: v >= BigInt(k.min) ? "done" : "open", input: `${fmtUnits(v, k.decimals)} ${k.symbol}` };
    }
    case "sentToken": {
      const s = r.sent[k.token.toLowerCase()];
      if (!s) return { status: "unknown", input: `${k.symbol} transfers could not be read` };
      return {
        status: s.count > 0 ? "done" : "open",
        input: s.count > 0 ? `${s.count} ${k.symbol} transfer${s.count === 1 ? "" : "s"} out since block ${s.fromBlock.toLocaleString("en-US")}` : `no ${k.symbol} sent since block ${s.fromBlock.toLocaleString("en-US")}`,
      };
    }
    case "checkIn": {
      if (r.today === null) return { status: "waiting", input: "season clock not started" };
      const f = r.farmer;
      const done = !!f && f.checkIns > 0 && f.lastDay === r.today;
      return { status: done ? "done" : "open", input: `${done ? "checked in" : "not checked in"} on day ${r.today} (${r.checkInSource})` };
    }
    case "streak": {
      if (r.today === null) return { status: "waiting", input: "season clock not started" };
      const best = r.farmer?.bestStreak ?? 0;
      return { status: best >= k.days ? "done" : "open", input: `best streak ${best} day${best === 1 ? "" : "s"} (${r.checkInSource})` };
    }
    case "holdReapo":
      if (r.reapo === undefined) return { status: "waiting", input: "opens when the token address is published" };
      if (r.reapo === null) return { status: "unknown", input: "balance could not be read" };
      return { status: r.reapo > 0n ? "done" : "open", input: `${fmtUnits(r.reapo, 18)} REAPO` };
  }
}

export function score(quests: Quest[], results: QuestResult[]) {
  let points = 0;
  let done = 0;
  quests.forEach((q, i) => {
    if (results[i]?.status === "done") {
      points += q.points;
      done += 1;
    }
  });
  return { points, done };
}
