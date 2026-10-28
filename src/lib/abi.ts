import { parseAbi } from "viem";

/*
 * ABIs the site needs. LOG_ABI mirrors contracts/src/ReapoSeasonLog.sol (src/lib/abi.test.ts checks it
 * against the compiled artifact so the two cannot drift apart).
 */
export const ERC20_ABI = parseAbi([
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address) view returns (uint256)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
]);

export const FEED_ABI = parseAbi([
  "function latestRoundData() view returns (uint80 roundId, int256 answer, uint256 startedAt, uint256 updatedAt, uint80 answeredInRound)",
]);

export const LOG_ABI = parseAbi([
  "struct Farmer { uint32 lastDay; uint16 streak; uint16 bestStreak; uint16 checkIns; }",
  "struct SeasonTotals { uint32 farmers; uint32 checkIns; uint32 streakStamps; uint32 selfStamps; }",
  "struct SelfStamp { uint64 blockNumber; bytes32 evidence; }",
  "function GENESIS() view returns (uint64)",
  "function SEASON_DAYS() view returns (uint32)",
  "function MAX_STREAK_STAMP() view returns (uint16)",
  "function started() view returns (bool)",
  "function today() view returns (uint256)",
  "function currentSeason() view returns (uint256 season, uint256 dayInSeason)",
  "function checkIn() returns (uint16 streak)",
  "function stampStreak(uint16 required)",
  "function stampSelfClaimed(bytes32 questId, bytes32 evidence)",
  "function farmerOf(uint256 season, address wallet) view returns (Farmer)",
  "function totalsOf(uint256 season) view returns (SeasonTotals)",
  "function streakStampOf(uint256 season, address wallet, uint16 required) view returns (uint64)",
  "function selfStampOf(uint256 season, address wallet, bytes32 questId) view returns (SelfStamp)",
  "function checkedInToday(address wallet) view returns (bool)",
  "function liveStreak(address wallet) view returns (uint16)",
  "function chainBlock() view returns (uint64)",
  "event CheckedIn(uint256 indexed season, address indexed wallet, uint256 day, uint16 streak, uint16 checkIns)",
  "event StreakStamped(uint256 indexed season, address indexed wallet, uint16 required, uint16 bestStreak)",
  "event SelfClaimStamped(uint256 indexed season, address indexed wallet, bytes32 indexed questId, bytes32 evidence)",
  "error InvalidSeasonLength()",
  "error NotStarted()",
  "error AlreadyCheckedInToday()",
  "error InvalidStreak()",
  "error StreakTooShort(uint16 bestStreak, uint16 required)",
  "error AlreadyStamped()",
  "error EmptyQuest()",
  "error EmptyEvidence()",
]);

export const ALL_ERRORS = LOG_ABI.filter((x) => x.type === "error");

/** Plain words for each custom error, shown instead of a selector. */
export const ERROR_WORDS: Record<string, string> = {
  InvalidSeasonLength: "Season length must be 1 to 365 days.",
  NotStarted: "The season clock has not started yet.",
  AlreadyCheckedInToday: "This wallet already checked in today (UTC). Come back after midnight UTC.",
  InvalidStreak: "That streak length is not a valid quest.",
  StreakTooShort: "Your best streak this season is shorter than this quest needs.",
  AlreadyStamped: "This quest is already stamped for this wallet this season.",
  EmptyQuest: "Missing quest id.",
  EmptyEvidence: "Missing evidence hash.",
};
