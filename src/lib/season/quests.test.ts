import { test } from "node:test";
import assert from "node:assert/strict";
import { QUESTS, USDG_QUEST_TOKEN } from "./fixtures";
import { evaluate, score, type Readings } from "./quests";

const base: Readings = {
  address: "0x0000000000000000000000000000000000000001",
  block: 100,
  nonce: 30,
  ethWei: 2_000_000_000_000_000n,
  tokens: { [USDG_QUEST_TOKEN]: 5_000_000n, "0x0bd7d308f8e1639fab988df18a8011f41eacad73": 0n },
  sent: { [USDG_QUEST_TOKEN]: { count: 2, lastBlock: 99, lastTx: "0xab", fromBlock: 1 } },
  farmer: { lastDay: 3, streak: 3, bestStreak: 3, checkIns: 3 },
  today: 3,
  checkInSource: "practice",
};

const byId = (id: string) => QUESTS.find((q) => q.id === id)!;

test("chain quests decide on the reading and show it", () => {
  assert.deepEqual(evaluate(byId("first-furrow"), base), { status: "done", input: "nonce 30" });
  assert.equal(evaluate(byId("worn-boots"), base).status, "done");
  assert.equal(evaluate(byId("worn-boots"), { ...base, nonce: 24 }).status, "open");
  assert.equal(evaluate(byId("seed-jar"), base).status, "done");
  assert.equal(evaluate(byId("seed-jar"), { ...base, ethWei: 999_999_999_999_999n }).status, "open");
  assert.equal(evaluate(byId("steady-stalk"), base).input, "5 USDG");
  assert.equal(evaluate(byId("wrapped-grain"), base).status, "open");
  assert.equal(evaluate(byId("market-day"), base).status, "done");
});

test("missing readings are unknown, never done", () => {
  const empty: Readings = { ...base, nonce: null, ethWei: null, tokens: {}, sent: {} };
  for (const id of ["first-furrow", "seed-jar", "steady-stalk", "market-day"]) assert.equal(evaluate(byId(id), empty).status, "unknown");
});

test("check-in quests follow the farmer state", () => {
  assert.equal(evaluate(byId("morning-round"), base).status, "done");
  assert.equal(evaluate(byId("morning-round"), { ...base, today: 4 }).status, "open");
  assert.equal(evaluate(byId("three-dawns"), base).status, "done");
  assert.equal(evaluate(byId("full-week"), base).status, "open");
  assert.equal(evaluate(byId("three-dawns"), { ...base, today: null }).status, "waiting");
});

test("the token quest waits for the address", () => {
  assert.equal(evaluate(byId("own-plot"), base).status, "waiting");
  assert.equal(evaluate(byId("own-plot"), { ...base, reapo: 1n }).status, "done");
});

test("score adds points of done quests only", () => {
  const results = QUESTS.map((q) => evaluate(q, base));
  const s = score(QUESTS, results);
  const expected = QUESTS.filter((q, i) => results[i].status === "done").reduce((a, q) => a + q.points, 0);
  assert.equal(s.points, expected);
  assert.ok(s.done > 0 && s.done < QUESTS.length);
});
