import { test } from "node:test";
import assert from "node:assert/strict";
import { USDC } from "@/config/brand";
import { checkBatch, runRelay } from "./relay";

const call = (to: string, data = "0x") => ({ method: "eth_call", params: [{ to, data }, "latest"] });

test("reads of known contracts are priced", () => {
  const out = checkBatch([call(USDC.address, "0x18160ddd")]);
  assert.ok("units" in out && out.units === 2);
});

test("unknown targets, signed transactions and wide log scans are refused", () => {
  assert.ok("error" in checkBatch([call("0x000000000000000000000000000000000000dead")]));
  assert.ok("error" in checkBatch([{ method: "eth_sendRawTransaction", params: ["0x02"] }]));
  assert.ok("error" in checkBatch([{ method: "eth_getLogs", params: [{ address: USDC.address, fromBlock: "0x1", toBlock: "latest" }] }]));
  assert.ok("error" in checkBatch([{ method: "eth_getLogs", params: [{ address: USDC.address, fromBlock: "0x1", toBlock: "0x100000" }] }]));
});

test("a refused budget never reaches the RPC", async () => {
  let reached = false;
  const out = await runRelay(call(USDC.address, "0x18160ddd"), {
    charge: async () => "slow down",
    one: async () => {
      reached = true;
      return { result: "0x" };
    },
    many: async () => [],
  });
  assert.equal(out.status, 429);
  assert.equal(reached, false);
});

test("an unknown address is charged, then refused without reaching the RPC", async () => {
  let charged = 0;
  let reached = false;
  const out = await runRelay(call("0x00000000000000000000000000000000000a11ce", "0x18160ddd"), {
    charge: async (u) => {
      charged += u;
      return null;
    },
    one: async () => {
      reached = true;
      return { result: "0x" };
    },
    many: async () => [],
  });
  assert.equal(out.status, 400);
  assert.ok(charged > 0);
  assert.equal(reached, false);
});

test("eth_estimateGas is relayed only for contracts the site reads", () => {
  const est = (tx: Record<string, unknown>) => ({ method: "eth_estimateGas", params: [tx] });
  const known = checkBatch([est({ to: USDC.address, data: "0x18160ddd" })]);
  assert.ok("units" in known && known.units === 3);
  assert.ok("error" in checkBatch([est({ to: "0x000000000000000000000000000000000000dead", data: "0x" })]));
  assert.ok("error" in checkBatch([est({ data: "0x6080" })]));
});

test("inherited object names are not methods", () => {
  for (const method of ["toString", "constructor", "__proto__", "hasOwnProperty", "valueOf"]) {
    assert.ok("error" in checkBatch([{ method, params: [] }]), method);
  }
});

test("eth_getLogs: only the wallet Transfer shape the site issues is relayed", async () => {
  const { TRANSFER_TOPIC } = await import("./relay");
  const me = `0x${"0".repeat(24)}${"ab".repeat(20)}`;
  const logs = (filter: Record<string, unknown>) => checkBatch([{ method: "eth_getLogs", params: [{ fromBlock: "0x100", toBlock: "0x200", ...filter }] }]);
  // the site's own query
  assert.ok("units" in logs({ address: USDC.address, topics: [TRANSFER_TOPIC, me] }));
  // topic-less, wildcard, extra or wrong topics, arrays of addresses, non-quest targets: refused
  assert.ok("error" in logs({ address: USDC.address }));
  assert.ok("error" in logs({ address: USDC.address, topics: [] }));
  assert.ok("error" in logs({ address: USDC.address, topics: [TRANSFER_TOPIC] }));
  assert.ok("error" in logs({ address: USDC.address, topics: [TRANSFER_TOPIC, null] }));
  assert.ok("error" in logs({ address: USDC.address, topics: [null, me] }));
  assert.ok("error" in logs({ address: USDC.address, topics: [TRANSFER_TOPIC, [me, me]] }));
  assert.ok("error" in logs({ address: USDC.address, topics: [TRANSFER_TOPIC, me, me] }));
  assert.ok("error" in logs({ address: USDC.address, topics: [TRANSFER_TOPIC, `0x${"ff".repeat(32)}`] }));
  assert.ok("error" in logs({ address: USDC.address, topics: [`0x${"11".repeat(32)}`, me] }));
  assert.ok("error" in logs({ address: [USDC.address], topics: [TRANSFER_TOPIC, me] }));
  assert.ok("error" in logs({ address: "0x4200000000000000000000000000000000000006", topics: [TRANSFER_TOPIC, me] }));
  // range cap still holds
  assert.ok("error" in checkBatch([{ method: "eth_getLogs", params: [{ address: USDC.address, topics: [TRANSFER_TOPIC, me], fromBlock: "0x1", toBlock: "0x100000" }] }]));
});

test("the site-wide relay budget is always charged, also with trusted proxy headers", async () => {
  const { chargeRelay, BUDGET } = await import("./relay");
  const prev = process.env.TRUST_PROXY_HEADERS;
  process.env.TRUST_PROXY_HEADERS = "1";
  try {
    const seen: string[] = [];
    const ok = await chargeRelay(async (bucket) => (seen.push(bucket), true), "203.0.113.7", 5);
    assert.equal(ok, null);
    assert.deepEqual(seen, ["rpc", "rpc-site"]);
    // site bucket exhausted -> refused even though the caller's own budget is fine
    const refused = await chargeRelay(async (bucket, _k, _u, limit) => bucket !== "rpc-site" || limit !== BUDGET.siteUnits, "203.0.113.8", 5);
    assert.match(String(refused), /busy/);
  } finally {
    if (prev === undefined) delete process.env.TRUST_PROXY_HEADERS;
    else process.env.TRUST_PROXY_HEADERS = prev;
  }
});
