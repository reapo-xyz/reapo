import { BRAND } from "@/config/brand";

/** Short notes for the news box on the farm. Newest first. Plain facts only: no dates we cannot keep. */
export const NEWS = [
  {
    title: "Season 1, Sprout, is open",
    body: `The first ${BRAND.name} season runs for 28 days from 26 October 2026 (UTC). It is a preview season: no reward pool is funded. Quests, check-ins and the Farmboard all work, and every rule is public.`,
  },
  {
    title: "Quests read your real Base activity",
    body: "Each quest names the value it checks (your nonce, a balance, a transfer log) and the block it was read at. Nothing is typed in by hand and nothing is counted from screenshots.",
  },
] as const;

/** Third note depends on whether the season log contract is live. */
export const contractNews = (live: boolean) =>
  live
    ? { title: "Check-ins are on Base", body: "Daily check-ins and quest stamps are written to the ReapoSeasonLog contract on Base. Streak quests are checked by the contract itself." }
    : { title: "Check-ins run in practice mode", body: "The ReapoSeasonLog contract is written and tested but not deployed yet. Until it is, check-ins and stamps are kept in your browser only and nothing is sent to Base." };
