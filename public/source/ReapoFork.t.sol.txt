// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ReapoSeasonLog} from "../../src/ReapoSeasonLog.sol";

/// Runs against a fork of Base mainnet (chain 8453): real block numbers and timestamps, Paris bytecode on the
/// live EVM. ReapoSeasonLog calls no other contract, so the fork checks the clock assumptions and deploy cost.
/// Run: forge test --match-path test/fork/ReapoFork.t.sol --fork-url https://base-rpc.publicnode.com
contract ReapoForkTest is Test {
    function setUp() public {
        if (block.chainid != 8453) vm.skip(true);
    }

    function test_fork_baseClock() public {
        // Base uses normal L2 block numbers and second timestamps: both move forward from the live head.
        assertGt(block.number, 30_000_000);
        assertGt(block.timestamp, 1_790_000_000);
        uint64 genesis = uint64(block.timestamp - (block.timestamp % 1 days)); // today 00:00 UTC
        ReapoSeasonLog book = new ReapoSeasonLog(genesis, 28);
        assertEq(book.today(), 0);
        address w = makeAddr("farmer");
        vm.prank(w);
        assertEq(book.checkIn(), 1);
        vm.warp(block.timestamp + 1 days);
        vm.roll(block.number + 43_200); // ~2 s blocks
        vm.prank(w);
        assertEq(book.checkIn(), 2);
        vm.prank(w);
        book.stampStreak(2);
        assertEq(book.streakStampOf(0, w, 2), uint64(block.number));
    }

    function test_fork_deployedSizeUnderLimit() public {
        ReapoSeasonLog book = new ReapoSeasonLog(uint64(block.timestamp), 28);
        assertLt(address(book).code.length, 24_576);
    }
}
