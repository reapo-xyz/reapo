// Checks behind scripts/verify-deployment.mjs, free of I/O so they can be tested with a fake chain.
//
// How it decides that an address runs this repository's ReapoSeasonLog:
//   - Runtime code is compared byte for byte with src/lib/contracts/artifacts.json
//     (`npm run contracts:artifacts -- --check` proves that file is a fresh forge build), after the two
//     immutable slots (GENESIS, SEASON_DAYS) are filled with the expected constructor values. Every
//     immutable range must hold exactly those values; nothing else may differ.
//   - The creation transaction is required (no tx => FAIL, never MATCH). It must have succeeded, created exactly
//     the address checked, have no recipient, and its input must be exactly this build's creation code followed
//     by the ABI-encoded (GENESIS, SEASON_DAYS) and nothing more.
// Every check fails closed: an RPC error, an empty or malformed answer is a FAIL, never a skip.

export const CHAIN_ID = 8453;
const NAME = "ReapoSeasonLog";

const isAddr = (v) => typeof v === "string" && /^0x[0-9a-fA-F]{40}$/.test(v);
const isHex = (v) => typeof v === "string" && /^0x([0-9a-fA-F]{2})*$/.test(v);
const same = (a, b) => String(a).toLowerCase() === String(b).toLowerCase();
const word = (n) => BigInt(n).toString(16).padStart(64, "0");

/** ABI encoding of the constructor arguments (two static words), without 0x. */
export function encodeArgs(genesis, seasonDays) {
  return word(genesis) + word(seasonDays);
}

/** This build's runtime with the immutables filled in, lowercase with 0x. */
export function expectedRuntime(ART, values) {
  const a = ART[NAME];
  let hex = a.runtime.slice(2);
  for (const r of a.immutables) {
    if (!(r.name in values)) throw new Error(`no value for immutable ${r.name}`);
    const w = word(values[r.name]);
    hex = hex.slice(0, r.start * 2) + w + hex.slice((r.start + r.length) * 2);
  }
  return `0x${hex}`;
}

/** True when `code` is exactly this build's runtime with the given immutable values. */
export function match(ART, code, values) {
  return String(code).toLowerCase() === expectedRuntime(ART, values);
}

/** input: { log, logTx, genesis, seasonDays, rpc, ART }. rpc(method, params) -> result (may throw). Returns { ok, lines }. */
export async function verifyDeployment({ log, logTx, genesis, seasonDays, rpc, ART }) {
  const lines = [];
  let failed = false;
  const ok = (m) => lines.push(`OK   ${m}`);
  const fail = (m) => {
    failed = true;
    lines.push(`FAIL ${m}`);
  };
  const done = () => ({ ok: !failed, lines });

  try {
    const id = await rpc("eth_chainId", []);
    if (Number(BigInt(id)) !== CHAIN_ID) {
      fail(`chain id ${id}, expected ${CHAIN_ID}`);
      return done();
    }
    ok(`chain id ${CHAIN_ID} (Base)`);
  } catch (e) {
    fail(`chain id unreadable: ${e.message}`);
    return done();
  }
  if (!log) {
    fail("give --log");
    return done();
  }
  if (!isAddr(log)) {
    fail("--log is not an address");
    return done();
  }
  if (!Number.isSafeInteger(genesis) || genesis < 0 || !Number.isSafeInteger(seasonDays) || seasonDays < 1 || seasonDays > 365) {
    fail("expected constructor values are invalid");
    return done();
  }
  const values = { GENESIS: genesis, SEASON_DAYS: seasonDays };
  try {
    const c = await rpc("eth_getCode", [log, "latest"]);
    if (!isHex(c) || c.length <= 2) throw new Error(`no code at ${log}`);
    if (match(ART, c, values)) ok(`${NAME} at ${log}: runtime matches this build with GENESIS=${genesis}, SEASON_DAYS=${seasonDays} (no owner)`);
    else fail(`${NAME} at ${log}: runtime differs from this build with GENESIS=${genesis}, SEASON_DAYS=${seasonDays}`);
  } catch (e) {
    fail(`${NAME}: ${e.message}`);
  }
  if (!logTx) {
    fail(`${NAME}: no creation tx given (pass --log-tx); runtime alone is not a full match`);
    return done();
  }
  if (typeof logTx !== "string" || !/^0x[0-9a-fA-F]{64}$/.test(logTx)) {
    fail(`${NAME}: --log-tx is not a 32-byte transaction hash`);
    return done();
  }
  try {
    const [tx, rc] = await Promise.all([rpc("eth_getTransactionByHash", [logTx]), rpc("eth_getTransactionReceipt", [logTx])]);
    if (!tx || !rc) fail(`${NAME}: creation tx ${logTx} not found`);
    else if (rc.status !== "0x1") fail(`${NAME}: creation tx failed`);
    else if (!same(rc.contractAddress, log)) fail(`${NAME}: tx created ${rc.contractAddress}, not ${log}`);
    else if (tx.to) fail(`${NAME}: tx has a recipient, not a deployment`);
    else if (String(tx.input).toLowerCase() === ART[NAME].creation + encodeArgs(genesis, seasonDays)) ok(`${NAME}: creation input is exactly this build + (${genesis}, ${seasonDays})`);
    else fail(`${NAME}: creation input differs from this build + expected constructor arguments`);
  } catch (e) {
    fail(`${NAME}: creation tx unreadable: ${e.message}`);
  }
  return done();
}
