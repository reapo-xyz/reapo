import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { toFunctionSignature, toEventSignature, type AbiFunction, type AbiEvent } from "viem";
import { LOG_ABI } from "./abi";
import { SEASON_CLOCK } from "../config/seasons";

const art = JSON.parse(readFileSync(new URL("./contracts/artifacts.json", import.meta.url), "utf8"));

// The hand-written ABI must describe exactly the compiled ReapoSeasonLog (src/lib/contracts/artifacts.json).
test("LOG_ABI matches the compiled contract", () => {
  const compiled = art.contracts.ReapoSeasonLog.abi as (AbiFunction | AbiEvent | { type: string; name: string })[];
  const sig = (x: (typeof compiled)[number]) =>
    x.type === "function" ? toFunctionSignature(x as AbiFunction) : x.type === "event" ? toEventSignature(x as AbiEvent) : x.type === "constructor" ? "constructor" : `${x.type}:${x.name}`;
  const a = new Set(compiled.filter((x) => x.type !== "constructor").map(sig));
  const b = new Set((LOG_ABI as unknown as (typeof compiled)[number][]).map(sig));
  assert.deepEqual([...b].sort(), [...a].sort());
});

// The deploy arguments baked into the artifacts must be the clock the site computes seasons with.
test("constructor arguments equal the site's season clock", () => {
  assert.deepEqual(art.constructorArgs.ReapoSeasonLog, [SEASON_CLOCK.genesis, SEASON_CLOCK.seasonDays]);
});
