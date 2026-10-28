import { CHECK_IN_POINTS, LEVELS, MILESTONES, SEASON_CLOCK, SEASON_NAMES } from "@/config/seasons";

/*
 * Season clock and the check-in rules, as pure functions. They follow ReapoSeasonLog exactly (whole UTC days from
 * GENESIS, seasons of SEASON_DAYS days, streak = consecutive days, reset each season) so practice mode and the
 * contract agree; src/lib/season/clock.test.ts replays the same cases as the Solidity tests.
 */

const DAY = 86_400;

export type Clock = { genesis: number; seasonDays: number };

export type SeasonInfo = {
  /** Contract index (0-based). */
  index: number;
  /** Shown number (1-based). */
  number: number;
  name: string;
  /** Day inside the season, 0-based. */
  day: number;
  days: number;
  startsAt: number;
  endsAt: number;
  started: boolean;
};

export function dayIndex(unixSeconds: number, clock: Clock = SEASON_CLOCK): number | null {
  if (unixSeconds < clock.genesis) return null;
  return Math.floor((unixSeconds - clock.genesis) / DAY);
}

export function seasonOfDay(day: number, clock: Clock = SEASON_CLOCK) {
  return Math.floor(day / clock.seasonDays);
}

export function seasonAt(unixSeconds: number, clock: Clock = SEASON_CLOCK): SeasonInfo {
  const d = dayIndex(unixSeconds, clock);
  const index = d === null ? 0 : seasonOfDay(d, clock);
  const startsAt = clock.genesis + index * clock.seasonDays * DAY;
  return {
    index,
    number: index + 1,
    name: SEASON_NAMES[index % SEASON_NAMES.length],
    day: d === null ? 0 : d % clock.seasonDays,
    days: clock.seasonDays,
    startsAt,
    endsAt: startsAt + clock.seasonDays * DAY,
    started: d !== null,
  };
}

export function milestoneDates(season: SeasonInfo) {
  return MILESTONES.map((m) => ({ ...m, at: season.startsAt + m.day * DAY, reached: season.started && season.day >= m.day }));
}

export type FarmerState = { lastDay: number; streak: number; bestStreak: number; checkIns: number };
export const EMPTY_FARMER: FarmerState = { lastDay: 0, streak: 0, bestStreak: 0, checkIns: 0 };

/** Applies one check-in on `day` to a farmer's state for the season of that day. Throws like the contract. */
export function applyCheckIn(f: FarmerState, day: number): FarmerState {
  if (f.checkIns > 0 && f.lastDay === day) throw new Error("AlreadyCheckedInToday");
  if (f.checkIns > 0 && day < f.lastDay) throw new Error("Day before the last check-in");
  const streak = f.checkIns > 0 && f.lastDay + 1 === day ? f.streak + 1 : 1;
  return { lastDay: day, streak, bestStreak: Math.max(f.bestStreak, streak), checkIns: f.checkIns + 1 };
}

/** Replays a list of check-in days (any order) into per-season farmer states. */
export function replay(days: number[], clock: Clock = SEASON_CLOCK): Map<number, FarmerState> {
  const out = new Map<number, FarmerState>();
  for (const day of [...new Set(days)].sort((a, b) => a - b)) {
    const s = seasonOfDay(day, clock);
    out.set(s, applyCheckIn(out.get(s) ?? EMPTY_FARMER, day));
  }
  return out;
}

/** Streak still alive on `today` (checked in today or yesterday), else 0. Same rule as liveStreak(). */
export function liveStreak(f: FarmerState, today: number): number {
  if (f.checkIns === 0) return 0;
  return f.lastDay === today || f.lastDay + 1 === today ? f.streak : 0;
}

export function levelFor(points: number) {
  let current: (typeof LEVELS)[number] = LEVELS[0];
  for (const l of LEVELS) if (points >= l.min) current = l;
  const next = LEVELS.find((l) => l.min > points) ?? null;
  return { current, next, toNext: next ? next.min - points : 0 };
}

export const checkInPoints = (checkIns: number) => checkIns * CHECK_IN_POINTS;

export function formatUtcDate(unixSeconds: number) {
  return new Date(unixSeconds * 1000).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}
