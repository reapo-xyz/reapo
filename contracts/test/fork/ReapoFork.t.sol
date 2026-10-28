// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ReapoSeasonLog} from "../../src/ReapoSeasonLog.sol";

/// Runs against a fork of Robinhood Chain mainnet (chain 4663): real timestamps, Paris bytecode on the live chain
/// state. ReapoSeasonLog calls no other contract, so the fork checks the clock assumptions, the deploy size and that
/// stamp blocks are the chain's own (L2) block numbers, not the parent chain's.
/// Run: forge test --match-path 'test/fork/*' --fork-url https://robinhood.drpc.org --evm-version cancun
contract ReapoForkTest is Test {
    function setUp() public {
        vm.skip(block.chainid != 4663);
    }

    function test_fork_robinhoodClock() public {
        assertGt(block.number, 90_000_000);
        assertGt(block.timestamp, 1_790_000_000);
        uint64 genesis = uint64(block.timestamp - (block.timestamp % 1 days)); // today 00:00 UTC
        ReapoSeasonLog book = new ReapoSeasonLog(genesis, 28);
        assertEq(book.today(), 0);
        address w = makeAddr("farmer");
        vm.prank(w);
        assertEq(book.checkIn(), 1);
        vm.warp(block.timestamp + 1 days);
        vm.prank(w);
        assertEq(book.checkIn(), 2);
        vm.prank(w);
        book.stampStreak(2);
        assertEq(book.streakStampOf(0, w, 2), book.chainBlock());
        assertGt(book.streakStampOf(0, w, 2), 90_000_000);
    }

    function test_fork_chainBlockIsTheL2Block() public {
        ReapoSeasonLog book = new ReapoSeasonLog(uint64(block.timestamp), 28);
        assertEq(book.chainBlock(), uint64(block.number));
        assertGt(block.number, 90_000_000);
    }

    function test_fork_deployedSizeUnderLimit() public {
        ReapoSeasonLog book = new ReapoSeasonLog(uint64(block.timestamp), 28);
        assertLt(address(book).code.length, 24_576);
    }
}
