// verify-lib against a fake chain built from this build's artifacts: a true deployment matches, and
// a foreign runtime, other immutables, a wrong chain, other arguments or a creation tx for another address each fail.
import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { encodeArgs, expectedRuntime, verifyDeployment } from "./verify-lib.mjs";

const FILE = JSON.parse(readFileSync(new URL("../src/lib/contracts/artifacts.json", import.meta.url), "utf8"));
const ART = FILE.contracts;
const [G, D] = FILE.constructorArgs.ReapoSeasonLog;
const A = (n) => "0x" + n.toString(16).padStart(40, "0");
const LOG = A(0x5ea5);
const TX = "0x" + "01".repeat(32);
const RUNTIME = expectedRuntime(ART, { GENESIS: G, SEASON_DAYS: D });

function chain(over = {}) {
  const codes = { [LOG]: RUNTIME, ...over.codes };
  const tx = { input: over.input ?? ART.ReapoSeasonLog.creation + encodeArgs(G, D), to: over.to ?? null, created: over.created ?? LOG };
  return async (method, params) => {
    if (method === "eth_chainId") return over.chainId ?? "0x2105";
    if (method === "eth_getCode") return codes[params[0].toLowerCase()] ?? "0x";
    if (method === "eth_getTransactionByHash") return params[0] === TX ? { input: tx.input, to: tx.to } : null;
    if (method === "eth_getTransactionReceipt") return params[0] === TX ? { status: over.status ?? "0x1", contractAddress: tx.created } : null;
    throw new Error(`unexpected ${method}`);
  };
}

const args = { log: LOG, logTx: TX, genesis: G, seasonDays: D, ART };

test("a true deployment matches every check", async () => {
  const r = await verifyDeployment({ ...args, rpc: chain() });
  assert.equal(r.ok, true, r.lines.join("\n"));
  assert.ok(r.lines.some((l) => l.includes("creation input is exactly this build")));
});

test("the raw runtime has zeroed immutables and does not match", async () => {
  const r = await verifyDeployment({ ...args, rpc: chain({ codes: { [LOG]: ART.ReapoSeasonLog.runtime } }) });
  assert.equal(r.ok, false);
});

test("other constructor values fail", async () => {
  const r = await verifyDeployment({ ...args, seasonDays: 7, rpc: chain() });
  assert.equal(r.ok, false);
  const r2 = await verifyDeployment({ ...args, rpc: chain({ input: ART.ReapoSeasonLog.creation + encodeArgs(G, 7) }) });
  assert.equal(r2.ok, false);
});

test("appended bytes after the arguments fail", async () => {
  const r = await verifyDeployment({ ...args, rpc: chain({ input: ART.ReapoSeasonLog.creation + encodeArgs(G, D) + "00" }) });
  assert.equal(r.ok, false);
});

test("wrong chain fails before anything else", async () => {
  const r = await verifyDeployment({ ...args, rpc: chain({ chainId: "0x1237" }) });
  assert.equal(r.ok, false);
  assert.equal(r.lines.length, 1);
});

test("a foreign runtime fails", async () => {
  const r = await verifyDeployment({ ...args, rpc: chain({ codes: { [LOG]: "0x6080" } }) });
  assert.equal(r.ok, false);
});

test("no creation tx never matches", async () => {
  const r = await verifyDeployment({ ...args, logTx: undefined, rpc: chain() });
  assert.equal(r.ok, false);
});

test("a creation tx for another address fails", async () => {
  const r = await verifyDeployment({ ...args, rpc: chain({ created: A(0xbeef) }) });
  assert.equal(r.ok, false);
});

test("a failed or call-type tx fails", async () => {
  assert.equal((await verifyDeployment({ ...args, rpc: chain({ status: "0x0" }) })).ok, false);
  assert.equal((await verifyDeployment({ ...args, rpc: chain({ to: A(1) }) })).ok, false);
});

test("an RPC error fails closed", async () => {
  const r = await verifyDeployment({ ...args, rpc: async () => { throw new Error("down"); } });
  assert.equal(r.ok, false);
});
