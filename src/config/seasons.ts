import { TOKEN, USDG, WETH } from "@/config/brand";

/*
 * Every season setting in ONE file: the clock, season names, quests, points and milestones.
 * Change a quest here and the quest board, the Farmboard and the guide follow.
 *
 * The clock is also the ReapoSeasonLog constructor (GENESIS, SEASON_DAYS); src/lib/abi.test.ts checks that the
 * deploy arguments in src/lib/contracts/artifacts.json equal it. Changing the clock after deployment would make the
 * site and the contract disagree, so only change it before the contract is deployed.
 */
export const SEASON_CLOCK = {
  /** 2026-10-26 00:00:00 UTC, a Monday. Day 0 of season 1. */
  genesis: 1792972800,
  seasonDays: 28,
} as const;

/** Honest status line, shown on every season surface. */
export const SEASON_STATUS = "Preview season — no reward pool is funded.";

/** Names rotate; season n uses NAMES[(n - 1) % NAMES.length]. */
export const SEASON_NAMES = ["Sprout", "Bloom", "Harvest", "Fallow"] as const;

/**
 * One UTC day in Robinhood Chain blocks (about 0.1 s per block, measured 27 Oct 2026: 100,000 blocks in ~10,300 s);
 * the log quests look back this far. The official RPC serves log queries over this span; drpc (10,000) and publicnode
 * (recent blocks only) do not, so the relay tries the official endpoint first.
 */
export const DAY_BLOCKS = 840_000;

export type QuestKind =
  | { type: "nonce"; min: number }
  | { type: "ethBalance"; minWei: string }
  | { type: "tokenBalance"; token: string; symbol: string; decimals: number; min: string }
  | { type: "sentToken"; token: string; symbol: string; lookbackBlocks: number }
  | { type: "checkIn" }
  | { type: "streak"; days: number }
  | { type: "holdReapo" };

/**
 * How a completed quest is proven:
 *   contract  ReapoSeasonLog checks it itself (check-ins, streaks)
 *   chain     the site reads it from Robinhood Chain for the connected wallet; stamping it on chain is a self-claim
 */
export type QuestProof = "contract" | "chain";

export type Quest = {
  id: string;
  title: string;
  /** One line: what to do. */
  task: string;
  /** What the site reads to check it. */
  rule: string;
  points: number;
  proof: QuestProof;
  kind: QuestKind;
};

export const QUESTS: Quest[] = [
  {
    id: "first-furrow",
    title: "First furrow",
    task: "Have at least one transaction sent from this wallet on Robinhood Chain.",
    rule: "Account nonce on Robinhood Chain is 1 or more.",
    points: 10,
    proof: "chain",
    kind: { type: "nonce", min: 1 },
  },
  {
    id: "worn-boots",
    title: "Worn boots",
    task: "Have 25 or more transactions sent from this wallet on Robinhood Chain.",
    rule: "Account nonce on Robinhood Chain is 25 or more.",
    points: 25,
    proof: "chain",
    kind: { type: "nonce", min: 25 },
  },
  {
    id: "seed-jar",
    title: "Seed jar",
    task: "Keep at least 0.001 ETH on Robinhood Chain for gas.",
    rule: "ETH balance on Robinhood Chain is 0.001 or more.",
    points: 10,
    proof: "chain",
    kind: { type: "ethBalance", minWei: "1000000000000000" },
  },
  {
    id: "steady-stalk",
    title: "Steady stalk",
    task: "Hold at least 1 USDG on Robinhood Chain.",
    rule: "USDG balanceOf(wallet) on Robinhood Chain is 1 or more.",
    points: 15,
    proof: "chain",
    kind: { type: "tokenBalance", token: USDG.address, symbol: "USDG", decimals: 6, min: "1000000" },
  },
  {
    id: "wrapped-grain",
    title: "Wrapped grain",
    task: "Hold any amount of WETH on Robinhood Chain.",
    rule: "WETH balanceOf(wallet) on Robinhood Chain is above 0.",
    points: 10,
    proof: "chain",
    kind: { type: "tokenBalance", token: WETH, symbol: "WETH", decimals: 18, min: "1" },
  },
  {
    id: "market-day",
    title: "Market day",
    task: "Send USDG from this wallet on Robinhood Chain in the last 24 hours (a payment, a swap, a deposit).",
    rule: "A USDG Transfer log with from = wallet in the last 840,000 blocks (about one day).",
    points: 20,
    proof: "chain",
    kind: { type: "sentToken", token: USDG.address, symbol: "USDG", lookbackBlocks: DAY_BLOCKS },
  },
  {
    id: "morning-round",
    title: "Morning round",
    task: "Check in on the Reapo season log today.",
    rule: "ReapoSeasonLog shows a check-in by this wallet on the current UTC day.",
    points: 5,
    proof: "contract",
    kind: { type: "checkIn" },
  },
  {
    id: "three-dawns",
    title: "Three dawns",
    task: "Check in three days in a row this season.",
    rule: "Best streak this season in ReapoSeasonLog is 3 or more.",
    points: 20,
    proof: "contract",
    kind: { type: "streak", days: 3 },
  },
  {
    id: "full-week",
    title: "Full week",
    task: "Check in seven days in a row this season.",
    rule: "Best streak this season in ReapoSeasonLog is 7 or more.",
    points: 40,
    proof: "contract",
    kind: { type: "streak", days: 7 },
  },
  {
    id: "own-plot",
    title: "Own plot",
    task: `Hold any amount of $REAPO on Robinhood Chain${TOKEN.isLive ? "" : " (opens at launch)"}.`,
    rule: `$REAPO balanceOf(wallet) is above 0.${TOKEN.isLive ? "" : " Waits for the token address."}`,
    points: 15,
    proof: "chain",
    kind: { type: "holdReapo" },
  },
];

/** Every check-in this season adds these points on the Farmboard. */
export const CHECK_IN_POINTS = 3;

/** Season levels by points. Labels only: points never convert into tokens or anything of value. */
export const LEVELS = [
  { min: 0, name: "Seedling" },
  { min: 30, name: "Sprout" },
  { min: 80, name: "Grower" },
  { min: 150, name: "Harvester" },
  { min: 230, name: "Steward" },
] as const;

/** Season milestones: the dates are computed from the clock, the text is the plan for that week. */
export const MILESTONES = [
  { day: 0, title: "Gates open", text: "Quests and daily check-ins start. Every rule is public on the quest board." },
  { day: 7, title: "First week", text: "The Full week quest can be cleared from today if you checked in every day." },
  { day: 14, title: "Halfway", text: "A good moment to look at the Farmboard and see which quests are still open." },
  { day: 27, title: "Last day", text: "The final check-in day. Streaks and stamps stay readable on chain after the season ends." },
] as const;

/** Addresses quests read with eth_call / eth_getLogs (the relay serves only these plus the core list). */
export function questTargets(): string[] {
  const out = new Set<string>();
  for (const q of QUESTS) if (q.kind.type === "tokenBalance" || q.kind.type === "sentToken") out.add(q.kind.token);
  return [...out];
}

/** Tokens whose Transfer logs the quest board reads (sentToken quests only). */
export function logTargets(): string[] {
  return [...new Set(QUESTS.flatMap((q) => (q.kind.type === "sentToken" ? [q.kind.token.toLowerCase()] : [])))];
}

export const totalQuestPoints = () => QUESTS.reduce((s, q) => s + q.points, 0);
