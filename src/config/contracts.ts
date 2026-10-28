import { isAddress } from "@/config/brand";

/*
 * Reapo contract address on Base.
 *   log  ReapoSeasonLog. Constructor (GENESIS, SEASON_DAYS) = SEASON_CLOCK in src/config/seasons.ts.
 *        No owner, no fee, does not need the $REAPO token, so it can be deployed before the token launches
 *        (from /deploy on localhost).
 * Empty => daily check-ins and quest stamps run in practice mode (kept in this browser, nothing sent).
 * Filled => "Check in" and "Stamp" send real transactions from the user's wallet and the Farmboard reads the chain.
 * Check a deployment any time: `npm run verify-deployment -- --log <address> --log-tx <tx>`.
 */
const DEPLOYED = {
  log: "",
  /** Block of the ReapoSeasonLog deployment (first block worth reading its events from). */
  logBlock: 0,
};

/**
 * Local fork tests only: NEXT_PUBLIC_REAPO_TEST_CONTRACTS='{"log":"0x…","logBlock":1}' at build time
 * points a second build at a contract deployed on an anvil chain. Never set it on Vercel.
 */
function testOverride(): typeof DEPLOYED | null {
  const raw = process.env.NEXT_PUBLIC_REAPO_TEST_CONTRACTS;
  if (!raw) return null;
  try {
    const v = { ...DEPLOYED, ...(JSON.parse(raw) as Partial<typeof DEPLOYED>) };
    return isAddress(v.log) ? v : null;
  } catch {
    return null;
  }
}

export const CONTRACTS = testOverride() ?? DEPLOYED;

export const logLive = () => isAddress(CONTRACTS.log);

export const CONTRACT_NAMES = { log: "ReapoSeasonLog" } as const;

/** Gas measured in tests (forge gas report, median), shown as estimates. */
export const GAS = {
  deploy: 927_930,
  checkInFirst: 70_550,
  checkIn: 36_183,
  stampStreak: 54_646,
  stampSelfClaimed: 75_085,
} as const;
