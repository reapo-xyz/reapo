// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ReapoSeasonLog} from "../src/ReapoSeasonLog.sol";

/// Returns a fixed L2 block, like the ArbSys precompile on Robinhood Chain.
contract FakeArbSys {
    function arbBlockNumber() external pure returns (uint256) {
        return 99_000_123;
    }
}

/// Burns all gas it is given, like broken code at 0x64.
contract GasBurner {
    fallback() external {
        while (true) {}
    }
}

/// Answers with zero, like a chain where 0x64 is an empty stub.
contract ZeroArbSys {
    function arbBlockNumber() external pure returns (uint256) {
        return 0;
    }
}

contract ReapoSeasonLogTest is Test {
    ReapoSeasonLog book;
    uint64 constant GENESIS = 1792972800; // 2026-10-26 00:00 UTC
    uint32 constant SEASON = 28;
    address alice = address(0xA11CE);
    address bob = address(0xB0B);

    event CheckedIn(uint256 indexed season, address indexed wallet, uint256 day, uint16 streak, uint16 checkIns);
    event StreakStamped(uint256 indexed season, address indexed wallet, uint16 required, uint16 bestStreak);
    event SelfClaimStamped(uint256 indexed season, address indexed wallet, bytes32 indexed questId, bytes32 evidence);

    function setUp() public {
        book = new ReapoSeasonLog(GENESIS, SEASON);
        vm.warp(GENESIS + 1 days + 3 hours); // day 1, season 0
    }

    function _day(uint256 d) internal {
        vm.warp(GENESIS + d * 1 days + 12 hours);
    }

    function test_constructor() public view {
        assertEq(book.GENESIS(), GENESIS);
        assertEq(book.SEASON_DAYS(), SEASON);
    }

    function test_constructor_rejectsBadLength() public {
        vm.expectRevert(ReapoSeasonLog.InvalidSeasonLength.selector);
        new ReapoSeasonLog(GENESIS, 0);
        vm.expectRevert(ReapoSeasonLog.InvalidSeasonLength.selector);
        new ReapoSeasonLog(GENESIS, 366);
    }

    function test_beforeGenesis() public {
        vm.warp(GENESIS - 1);
        assertFalse(book.started());
        vm.expectRevert(ReapoSeasonLog.NotStarted.selector);
        book.today();
        vm.prank(alice);
        vm.expectRevert(ReapoSeasonLog.NotStarted.selector);
        book.checkIn();
        assertFalse(book.checkedInToday(alice));
        assertEq(book.liveStreak(alice), 0);
    }

    function test_clock() public {
        vm.warp(GENESIS);
        assertEq(book.today(), 0);
        vm.warp(GENESIS + 1 days - 1);
        assertEq(book.today(), 0);
        vm.warp(GENESIS + 29 days);
        (uint256 s, uint256 d) = book.currentSeason();
        assertEq(s, 1);
        assertEq(d, 1);
    }

    function test_checkIn_first() public {
        vm.expectEmit(true, true, false, true);
        emit CheckedIn(0, alice, 1, 1, 1);
        vm.prank(alice);
        uint16 streak = book.checkIn();
        assertEq(streak, 1);
        ReapoSeasonLog.Farmer memory f = book.farmerOf(0, alice);
        assertEq(f.lastDay, 1);
        assertEq(f.streak, 1);
        assertEq(f.bestStreak, 1);
        assertEq(f.checkIns, 1);
        assertTrue(book.checkedInToday(alice));
        assertEq(book.totalsOf(0).farmers, 1);
        assertEq(book.totalsOf(0).checkIns, 1);
    }

    function test_checkIn_twiceSameDayReverts() public {
        vm.startPrank(alice);
        book.checkIn();
        vm.warp(block.timestamp + 5 hours);
        vm.expectRevert(ReapoSeasonLog.AlreadyCheckedInToday.selector);
        book.checkIn();
        vm.stopPrank();
    }

    function test_streak_consecutiveAndBreak() public {
        vm.startPrank(alice);
        _day(1);
        book.checkIn();
        _day(2);
        assertEq(book.checkIn(), 2);
        _day(3);
        assertEq(book.checkIn(), 3);
        assertEq(book.liveStreak(alice), 3);
        _day(4);
        assertEq(book.liveStreak(alice), 3); // still alive the next day
        _day(5);
        assertEq(book.liveStreak(alice), 0); // missed day 4
        assertEq(book.checkIn(), 1);
        ReapoSeasonLog.Farmer memory f = book.farmerOf(0, alice);
        assertEq(f.bestStreak, 3);
        assertEq(f.checkIns, 4);
        vm.stopPrank();
        assertEq(book.totalsOf(0).farmers, 1);
    }

    function test_newSeasonResetsStreak() public {
        vm.startPrank(alice);
        _day(26);
        book.checkIn();
        _day(27);
        assertEq(book.checkIn(), 2);
        _day(28); // season 1, day 0
        assertEq(book.checkIn(), 1);
        vm.stopPrank();
        assertEq(book.farmerOf(1, alice).checkIns, 1);
        assertEq(book.farmerOf(0, alice).bestStreak, 2);
        assertEq(book.totalsOf(1).farmers, 1);
    }

    function test_stampStreak() public {
        vm.startPrank(alice);
        for (uint256 d = 1; d <= 3; d++) {
            _day(d);
            book.checkIn();
        }
        vm.expectEmit(true, true, false, true);
        emit StreakStamped(0, alice, 3, 3);
        book.stampStreak(3);
        assertEq(book.streakStampOf(0, alice, 3), uint64(block.number));
        vm.expectRevert(ReapoSeasonLog.AlreadyStamped.selector);
        book.stampStreak(3);
        vm.expectRevert(abi.encodeWithSelector(ReapoSeasonLog.StreakTooShort.selector, uint16(3), uint16(7)));
        book.stampStreak(7);
        vm.stopPrank();
        assertEq(book.totalsOf(0).streakStamps, 1);
    }

    function test_stampStreak_keepsBestAfterBreak() public {
        vm.startPrank(alice);
        _day(1);
        book.checkIn();
        _day(2);
        book.checkIn();
        _day(6);
        book.checkIn();
        book.stampStreak(2); // best streak 2 earlier in the season still counts
        vm.stopPrank();
    }

    function test_stampStreak_invalid() public {
        vm.startPrank(alice);
        vm.expectRevert(ReapoSeasonLog.InvalidStreak.selector);
        book.stampStreak(0);
        vm.expectRevert(ReapoSeasonLog.InvalidStreak.selector);
        book.stampStreak(uint16(SEASON + 1));
        vm.expectRevert(abi.encodeWithSelector(ReapoSeasonLog.StreakTooShort.selector, uint16(0), uint16(1)));
        book.stampStreak(1);
        vm.stopPrank();
    }

    function test_selfClaim() public {
        bytes32 q = keccak256("quest.first-furrow");
        bytes32 ev = keccak256("nonce=5@block=123");
        vm.expectEmit(true, true, true, true);
        emit SelfClaimStamped(0, alice, q, ev);
        vm.prank(alice);
        book.stampSelfClaimed(q, ev);
        ReapoSeasonLog.SelfStamp memory s = book.selfStampOf(0, alice, q);
        assertEq(s.blockNumber, uint64(block.number));
        assertEq(s.evidence, ev);
        vm.prank(alice);
        vm.expectRevert(ReapoSeasonLog.AlreadyStamped.selector);
        book.stampSelfClaimed(q, ev);
        // another wallet, same quest: fine
        vm.prank(bob);
        book.stampSelfClaimed(q, ev);
        assertEq(book.totalsOf(0).selfStamps, 2);
        // next season, same wallet: fine
        _day(SEASON + 1);
        vm.prank(alice);
        book.stampSelfClaimed(q, ev);
        assertEq(book.totalsOf(1).selfStamps, 1);
    }

    function test_selfClaim_empty() public {
        vm.startPrank(alice);
        vm.expectRevert(ReapoSeasonLog.EmptyQuest.selector);
        book.stampSelfClaimed(bytes32(0), bytes32(uint256(1)));
        vm.expectRevert(ReapoSeasonLog.EmptyEvidence.selector);
        book.stampSelfClaimed(bytes32(uint256(1)), bytes32(0));
        vm.stopPrank();
    }

    function test_noValueAccepted() public {
        (bool ok, ) = address(book).call{value: 1}("");
        assertFalse(ok);
        (ok, ) = address(book).call{value: 1}(abi.encodeWithSelector(book.checkIn.selector));
        assertFalse(ok);
    }

    function test_walletsAreIndependent() public {
        vm.prank(alice);
        book.checkIn();
        vm.prank(bob);
        book.checkIn();
        assertEq(book.totalsOf(0).farmers, 2);
        assertEq(book.totalsOf(0).checkIns, 2);
    }

    // ---------------------------------------------------------------- fuzz

    /// Any sequence of check-in days gives the streak the plain rule says.
    function testFuzz_streakMatchesModel(uint8[12] memory gaps) public {
        uint256 d = 0;
        uint16 model;
        uint16 best;
        uint256 lastDay;
        uint16 count;
        vm.startPrank(alice);
        for (uint256 i = 0; i < gaps.length; i++) {
            d += 1 + (gaps[i] % 3); // gaps of 1..3 days
            if (d >= SEASON) break;
            _day(d);
            uint16 s = book.checkIn();
            model = (count > 0 && lastDay + 1 == d) ? model + 1 : 1;
            if (model > best) best = model;
            lastDay = d;
            count++;
            assertEq(s, model);
        }
        vm.stopPrank();
        ReapoSeasonLog.Farmer memory f = book.farmerOf(0, alice);
        assertEq(f.bestStreak, best);
        assertEq(f.checkIns, count);
    }

    function testFuzz_seasonMath(uint32 offset) public {
        uint256 t = uint256(GENESIS) + uint256(offset) * 7; // spreads over ~45 years
        vm.warp(t);
        (uint256 s, uint256 d) = book.currentSeason();
        uint256 day = (t - GENESIS) / 1 days;
        assertEq(s, day / SEASON);
        assertEq(d, day % SEASON);
        assertLt(d, SEASON);
    }

    function testFuzz_selfClaimOncePerQuest(bytes32 q, bytes32 ev, address who) public {
        vm.assume(q != bytes32(0) && ev != bytes32(0));
        vm.startPrank(who);
        book.stampSelfClaimed(q, ev);
        vm.expectRevert(ReapoSeasonLog.AlreadyStamped.selector);
        book.stampSelfClaimed(q, ev);
        vm.stopPrank();
    }

    function test_chainBlock_usesArbSysWhenItAnswers() public {
        vm.etch(address(0x64), address(new FakeArbSys()).code);
        assertEq(book.chainBlock(), 99_000_123);
        vm.startPrank(alice);
        for (uint256 d = 1; d <= 2; d++) {
            _day(d);
            book.checkIn();
        }
        book.stampStreak(2);
        book.stampSelfClaimed(keccak256("q"), keccak256("ev"));
        vm.stopPrank();
        assertEq(book.streakStampOf(0, alice, 2), 99_000_123);
        assertEq(book.selfStampOf(0, alice, keccak256("q")).blockNumber, 99_000_123);
    }

    function test_chainBlock_fallsBackOnBrokenPrecompile() public {
        vm.roll(500);
        vm.etch(address(0x64), address(new GasBurner()).code);
        assertEq(book.chainBlock(), 500);
        uint256 g = gasleft();
        vm.prank(alice);
        book.stampSelfClaimed(keccak256("q"), keccak256("ev"));
        assertLt(g - gasleft(), 300_000, "broken 0x64 burns at most its 30k cap, not the call");
        assertEq(book.selfStampOf(0, alice, keccak256("q")).blockNumber, 500);
        vm.etch(address(0x64), address(new ZeroArbSys()).code);
        assertEq(book.chainBlock(), 500);
    }
}
