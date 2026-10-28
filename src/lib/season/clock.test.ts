import { test } from "node:test";
import assert from "node:assert/strict";
import { applyCheckIn, dayIndex, EMPTY_FARMER, levelFor, liveStreak, replay, seasonAt } from "./clock";

const G = 1792972800;
const clock = { genesis: G, seasonDays: 28 };
const at = (d: number) => G + d * 86_400 + 43_200;

test("clock: before genesis, day boundaries and season rollover", () => {
  assert.equal(dayIndex(G - 1, clock), null);
  assert.equal(dayIndex(G, clock), 0);
  assert.equal(dayIndex(G + 86_399, clock), 0);
  const s = seasonAt(G + 29 * 86_400, clock);
  assert.equal(s.index, 1);
  assert.equal(s.number, 2);
  assert.equal(s.day, 1);
  assert.equal(s.startsAt, G + 28 * 86_400);
  assert.equal(seasonAt(G - 10, clock).started, false);
});

test("streak: consecutive days grow, a gap resets, best is kept", () => {
  let f = EMPTY_FARMER;
  f = applyCheckIn(f, 1);
  f = applyCheckIn(f, 2);
  f = applyCheckIn(f, 3);
  assert.equal(f.streak, 3);
  assert.equal(liveStreak(f, 4), 3);
  assert.equal(liveStreak(f, 5), 0);
  f = applyCheckIn(f, 5);
  assert.equal(f.streak, 1);
  assert.equal(f.bestStreak, 3);
  assert.equal(f.checkIns, 4);
  assert.throws(() => applyCheckIn(f, 5), /AlreadyCheckedInToday/);
});

test("replay: a new season starts a new streak", () => {
  const m = replay([26, 27, 28], clock);
  assert.equal(m.get(0)?.streak, 2);
  assert.equal(m.get(1)?.streak, 1);
  assert.equal(m.get(1)?.checkIns, 1);
  void at;
});

test("levels", () => {
  assert.equal(levelFor(0).current.name, "Seedling");
  assert.equal(levelFor(30).current.name, "Sprout");
  assert.equal(levelFor(29).toNext, 1);
  assert.equal(levelFor(1000).next, null);
});
