// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {Test} from "forge-std/Test.sol";
import {ReapoSeasonLog} from "../src/ReapoSeasonLog.sol";

/// Drives random check-ins, time jumps and stamps from a small set of wallets and tracks a plain model.
contract SeasonHandler is Test {
    ReapoSeasonLog public book;
    address[4] public wallets = [address(0x1001), address(0x1002), address(0x1003), address(0x1004)];
    mapping(uint256 => uint256) public checkInsPerSeason;
    mapping(uint256 => uint256) public farmersPerSeason;
    mapping(uint256 => mapping(address => bool)) public seen;
    uint256 public maxSeason;

    constructor(ReapoSeasonLog l) {
        book = l;
    }

    function warp(uint8 hoursAhead) external {
        vm.warp(block.timestamp + uint256(hoursAhead) * 1 hours);
        vm.roll(block.number + 1);
    }

    function checkIn(uint8 who) external {
        address w = wallets[who % 4];
        (uint256 s, ) = book.currentSeason();
        vm.prank(w);
        try book.checkIn() {
            checkInsPerSeason[s] += 1;
            if (!seen[s][w]) {
                seen[s][w] = true;
                farmersPerSeason[s] += 1;
            }
            if (s > maxSeason) maxSeason = s;
        } catch {}
    }

    function stampStreak(uint8 who, uint8 req) external {
        vm.prank(wallets[who % 4]);
        try book.stampStreak(uint16(req % 10)) {} catch {}
    }

    function selfClaim(uint8 who, bytes32 q) external {
        vm.prank(wallets[who % 4]);
        try book.stampSelfClaimed(q, keccak256(abi.encode(q))) {} catch {}
    }
}

contract ReapoSeasonLogInvariantTest is Test {
    ReapoSeasonLog book;
    SeasonHandler handler;

    function setUp() public {
        book = new ReapoSeasonLog(1792972800, 7);
        vm.warp(1792972800 + 1 hours);
        handler = new SeasonHandler(book);
        targetContract(address(handler));
    }

    /// Totals equal the model; per-wallet numbers stay consistent.
    function invariant_totalsAndFarmers() public view {
        for (uint256 s = 0; s <= handler.maxSeason(); s++) {
            ReapoSeasonLog.SeasonTotals memory t = book.totalsOf(s);
            assertEq(t.checkIns, handler.checkInsPerSeason(s));
            assertEq(t.farmers, handler.farmersPerSeason(s));
            uint256 sum;
            for (uint256 i = 0; i < 4; i++) {
                ReapoSeasonLog.Farmer memory f = book.farmerOf(s, handler.wallets(i));
                sum += f.checkIns;
                assertLe(f.streak, f.bestStreak);
                assertLe(f.bestStreak, f.checkIns);
                assertLe(f.bestStreak, book.SEASON_DAYS());
                if (f.checkIns > 0) assertEq(f.lastDay / book.SEASON_DAYS(), s);
            }
            assertEq(sum, t.checkIns);
        }
    }

    /// The contract never holds ETH.
    function invariant_noBalance() public view {
        assertEq(address(book).balance, 0);
    }
}
