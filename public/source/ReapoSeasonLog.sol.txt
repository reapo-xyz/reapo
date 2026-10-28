// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

/// @title ReapoSeasonLog
/// @notice Public season log for Reapo on Base. A wallet checks in once per UTC day; the contract keeps its
///         streak per season. Streak quests are stamped only when the contract itself sees the streak
///         (contract-checked). Other quests can be stamped as self-claimed with an evidence hash; those stamps
///         are a public note by the wallet, not a proof, and the site labels them that way.
/// @dev No owner, no admin, no fees, no payable function, no upgrade path, no token. Season and day
///      boundaries come from two constructor values that never change: GENESIS (unix seconds, start of
///      day 0 and season 0) and SEASON_DAYS. Days are counted in whole 86,400 second steps from GENESIS.
contract ReapoSeasonLog {
    /// @notice Unix time of day 0 / season 0.
    uint64 public immutable GENESIS;
    /// @notice Length of every season in days.
    uint32 public immutable SEASON_DAYS;

    /// @notice Highest streak length a streak stamp can ask for.
    uint16 public constant MAX_STREAK_STAMP = 365;

    struct Farmer {
        uint32 lastDay; // day index of the latest check-in (valid only when checkIns > 0)
        uint16 streak; // consecutive days ending at lastDay
        uint16 bestStreak; // longest streak this season
        uint16 checkIns; // check-ins this season
    }

    struct SeasonTotals {
        uint32 farmers; // wallets with at least one check-in
        uint32 checkIns; // all check-ins
        uint32 streakStamps; // contract-checked stamps
        uint32 selfStamps; // self-claimed stamps
    }

    struct SelfStamp {
        uint64 blockNumber;
        bytes32 evidence;
    }

    mapping(uint256 season => mapping(address wallet => Farmer)) private _farmers;
    mapping(uint256 season => SeasonTotals) private _totals;
    /// season => wallet => required streak => block number of the stamp (0 = none)
    mapping(uint256 season => mapping(address wallet => mapping(uint16 required => uint64))) private _streakStamps;
    mapping(uint256 season => mapping(address wallet => mapping(bytes32 questId => SelfStamp))) private _selfStamps;

    event CheckedIn(uint256 indexed season, address indexed wallet, uint256 day, uint16 streak, uint16 checkIns);
    event StreakStamped(uint256 indexed season, address indexed wallet, uint16 required, uint16 bestStreak);
    event SelfClaimStamped(uint256 indexed season, address indexed wallet, bytes32 indexed questId, bytes32 evidence);

    error InvalidSeasonLength();
    error NotStarted();
    error AlreadyCheckedInToday();
    error InvalidStreak();
    error StreakTooShort(uint16 bestStreak, uint16 required);
    error AlreadyStamped();
    error EmptyQuest();
    error EmptyEvidence();

    constructor(uint64 genesis, uint32 seasonDays) {
        if (seasonDays == 0 || seasonDays > 365) revert InvalidSeasonLength();
        GENESIS = genesis;
        SEASON_DAYS = seasonDays;
    }

    // ---------------------------------------------------------------- clock

    /// @notice True once GENESIS has passed.
    function started() public view returns (bool) {
        return block.timestamp >= GENESIS;
    }

    /// @notice Day index since GENESIS. Reverts before GENESIS.
    function today() public view returns (uint256) {
        if (block.timestamp < GENESIS) revert NotStarted();
        return (block.timestamp - GENESIS) / 1 days;
    }

    /// @notice Current season number and the day inside it (0-based). Reverts before GENESIS.
    function currentSeason() public view returns (uint256 season, uint256 dayInSeason) {
        uint256 d = today();
        season = d / SEASON_DAYS;
        dayInSeason = d % SEASON_DAYS;
    }

    // ---------------------------------------------------------------- writes

    /// @notice Daily check-in for the current season. One per wallet per UTC day.
    /// @return streak The wallet's streak after this check-in.
    function checkIn() external returns (uint16 streak) {
        uint256 d = today();
        uint256 season = d / SEASON_DAYS;
        Farmer storage f = _farmers[season][msg.sender];
        SeasonTotals storage t = _totals[season];
        if (f.checkIns == 0) {
            t.farmers += 1;
            streak = 1;
        } else {
            if (f.lastDay == d) revert AlreadyCheckedInToday();
            streak = f.lastDay + 1 == d ? f.streak + 1 : 1;
        }
        f.lastDay = uint32(d);
        f.streak = streak;
        if (streak > f.bestStreak) f.bestStreak = streak;
        f.checkIns += 1;
        t.checkIns += 1;
        emit CheckedIn(season, msg.sender, d, streak, f.checkIns);
    }

    /// @notice Stamps a streak quest for the current season. The contract checks the wallet's best streak
    ///         this season itself, so this stamp needs no trust in the wallet.
    function stampStreak(uint16 required) external {
        if (required == 0 || required > MAX_STREAK_STAMP || required > SEASON_DAYS) revert InvalidStreak();
        (uint256 season, ) = currentSeason();
        uint16 best = _farmers[season][msg.sender].bestStreak;
        if (best < required) revert StreakTooShort(best, required);
        if (_streakStamps[season][msg.sender][required] != 0) revert AlreadyStamped();
        _streakStamps[season][msg.sender][required] = uint64(block.number);
        _totals[season].streakStamps += 1;
        emit StreakStamped(season, msg.sender, required, best);
    }

    /// @notice Self-claimed quest stamp for the current season: the wallet states it completed `questId` and
    ///         leaves a hash of its evidence (for example the rule inputs and the block they were read at).
    ///         The contract cannot check it; anyone reading it should treat it as the wallet's own claim.
    function stampSelfClaimed(bytes32 questId, bytes32 evidence) external {
        if (questId == bytes32(0)) revert EmptyQuest();
        if (evidence == bytes32(0)) revert EmptyEvidence();
        (uint256 season, ) = currentSeason();
        SelfStamp storage s = _selfStamps[season][msg.sender][questId];
        if (s.blockNumber != 0) revert AlreadyStamped();
        s.blockNumber = uint64(block.number);
        s.evidence = evidence;
        _totals[season].selfStamps += 1;
        emit SelfClaimStamped(season, msg.sender, questId, evidence);
    }

    // ---------------------------------------------------------------- reads

    function farmerOf(uint256 season, address wallet) external view returns (Farmer memory) {
        return _farmers[season][wallet];
    }

    function totalsOf(uint256 season) external view returns (SeasonTotals memory) {
        return _totals[season];
    }

    /// @notice Block number of a streak stamp, 0 when none.
    function streakStampOf(uint256 season, address wallet, uint16 required) external view returns (uint64) {
        return _streakStamps[season][wallet][required];
    }

    function selfStampOf(uint256 season, address wallet, bytes32 questId) external view returns (SelfStamp memory) {
        return _selfStamps[season][wallet][questId];
    }

    /// @notice True when the wallet already checked in on the current day. False before GENESIS.
    function checkedInToday(address wallet) external view returns (bool) {
        if (block.timestamp < GENESIS) return false;
        uint256 d = (block.timestamp - GENESIS) / 1 days;
        Farmer storage f = _farmers[d / SEASON_DAYS][wallet];
        return f.checkIns > 0 && f.lastDay == d;
    }

    /// @notice Streak that is still alive right now: the stored streak if the last check-in was today or
    ///         yesterday, otherwise 0. Reads the current season only.
    function liveStreak(address wallet) external view returns (uint16) {
        if (block.timestamp < GENESIS) return 0;
        uint256 d = (block.timestamp - GENESIS) / 1 days;
        Farmer storage f = _farmers[d / SEASON_DAYS][wallet];
        if (f.checkIns == 0) return 0;
        return f.lastDay == d || f.lastDay + 1 == d ? f.streak : 0;
    }
}
