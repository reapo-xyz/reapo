// Proves that a deployed address runs exactly this repository's ReapoSeasonLog on Base.
//   (cd contracts && ./setup.sh && forge build --force) && npm run contracts:artifacts -- --check
//   npm run verify-deployment -- --log 0x.. --log-tx 0x..  (the creation tx is required)
// Expected constructor values default to the ones in src/lib/contracts/artifacts.json (constructorArgs);
// override with --genesis <unix seconds> --season-days <n> if the owner deployed with other values.
// Prints OK/FAIL per check and exits non-zero on any FAIL. See scripts/verify-lib.mjs.
// RPC: VERIFY_RPC_URL from your shell, else a public Base endpoint.
import { readFileSync } from "node:fs";
import { verifyDeployment } from "./verify-lib.mjs";

const RPC = process.env.VERIFY_RPC_URL || "https://base-rpc.publicnode.com";
const args = process.argv.slice(2);
const opt = (name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);

async function rpc(method, params) {
  const res = await fetch(RPC, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const body = await res.json();
  if (!body || typeof body !== "object" || !("result" in body || "error" in body)) throw new Error("malformed JSON-RPC answer");
  if (body.error) throw new Error(`${method}: ${body.error.message}`);
  return body.result;
}

if (!opt("--log") || !opt("--log-tx")) {
  console.log("usage: npm run verify-deployment -- --log <address> --log-tx <creation tx hash> [--genesis <unix>] [--season-days <n>]");
  process.exit(2);
}
let FILE;
try {
  FILE = JSON.parse(readFileSync(new URL("../src/lib/contracts/artifacts.json", import.meta.url), "utf8"));
} catch {
  console.log("FAIL src/lib/contracts/artifacts.json is missing. Run: cd contracts && ./setup.sh && forge build --force && cd .. && npm run contracts:artifacts");
  process.exit(1);
}
const [defGenesis, defDays] = FILE.constructorArgs.ReapoSeasonLog;
const genesis = Number(opt("--genesis") ?? defGenesis);
const seasonDays = Number(opt("--season-days") ?? defDays);
const result = await verifyDeployment({ log: opt("--log"), logTx: opt("--log-tx"), genesis, seasonDays, rpc, ART: FILE.contracts });
for (const l of result.lines) console.log(l);
console.log(result.ok ? "MATCH: this address runs the ReapoSeasonLog from this build." : "MISMATCH: do not trust this deployment.");
process.exit(result.ok ? 0 : 1);
