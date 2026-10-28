"use client";

import { useMemo, useState } from "react";
import { encodeAbiParameters } from "viem";
import { useLocalStore } from "@/components/wallet/useLocalStore";
import { useWalletModal } from "@/components/wallet/WalletButton";
import { useWallet } from "@/components/wallet/WalletProvider";
import { CHAIN, explorerAddress, explorerTx } from "@/config/brand";
import { storageKey } from "@/config/storage";
import { explain, waitForReceipt } from "@/lib/client";

type Art = { creation: string; sha256: string; args: [number, number] };
type Progress = { log?: string; logTx?: string; logBlock?: number };

/** Owner tool: deploys ReapoSeasonLog (GENESIS, SEASON_DAYS from the build) from the connected wallet. */
export function DeployPanel({ art }: { art: Art }) {
  const { address, onChain, sendTransaction, switchNetwork } = useWallet();
  const { open } = useWalletModal();
  const [p, setP] = useLocalStore<Progress>(storageKey("deploy", String(CHAIN.id)), {});
  const [busy, setBusy] = useState(false);
  const [lines, setLines] = useState<string[]>([]);
  const say = (s: string) => setLines((l) => [`${new Date().toLocaleTimeString()} ${s}`, ...l]);

  const snippet = useMemo(() => `const DEPLOYED = {\n  log: "${p.log ?? ""}",\n  logBlock: ${p.logBlock ?? 0},\n};`, [p]);

  async function deploy() {
    setBusy(true);
    try {
      const args = encodeAbiParameters([{ type: "uint64" }, { type: "uint32" }], [BigInt(art.args[0]), art.args[1]]).slice(2);
      const data = `${art.creation}${args}` as `0x${string}`;
      say(`ReapoSeasonLog: confirm in the wallet (${(data.length - 2) / 2} bytes)`);
      const hash = await sendTransaction({ data });
      say(`ReapoSeasonLog: sent ${hash}`);
      const r = await waitForReceipt(hash, 300_000);
      if (!r.ok || !r.contractAddress) throw new Error("ReapoSeasonLog deployment reverted");
      say(`ReapoSeasonLog: deployed at ${r.contractAddress} (block ${r.blockNumber})`);
      setP({ log: r.contractAddress, logTx: hash, logBlock: r.blockNumber });
    } catch (e) {
      say(`failed: ${explain(e)}`);
    } finally {
      setBusy(false);
    }
  }

  if (!address)
    return (
      <button type="button" className="btn primary" onClick={open}>
        Connect the deployer wallet
      </button>
    );
  if (!onChain)
    return (
      <button type="button" className="btn primary" onClick={switchNetwork}>
        Switch to {CHAIN.name}
      </button>
    );

  return (
    <div className="grid gap-4" data-testid="deploy-panel">
      <section className="plot" style={{ padding: 16 }}>
        <h2>1 · ReapoSeasonLog</h2>
        <p className="mono" style={{ fontSize: 12 }}>
          Constructor: GENESIS = {art.args[0]} ({new Date(art.args[0] * 1000).toISOString()}), SEASON_DAYS = {art.args[1]} · build sha256 {art.sha256.slice(0, 16)}…
        </p>
        {p.log ? (
          <p>
            Deployed at{" "}
            <a href={explorerAddress(p.log)} target="_blank" rel="noreferrer" className="mono">
              {p.log}
            </a>{" "}
            (block {p.logBlock},{" "}
            <a href={explorerTx(p.logTx ?? "")} target="_blank" rel="noreferrer">
              tx
            </a>
            )
          </p>
        ) : (
          <button type="button" className="btn primary" disabled={busy} data-testid="deploy-log" onClick={deploy}>
            {busy ? "Deploying…" : "Deploy ReapoSeasonLog"}
          </button>
        )}
      </section>
      <section className="plot" style={{ padding: 16 }}>
        <h2>2 · Paste into src/config/contracts.ts</h2>
        <pre className="mono" style={{ fontSize: 12.5, overflowX: "auto", background: "#efdcb1", padding: 12 }} data-testid="deploy-snippet">
          {snippet}
        </pre>
        <p style={{ fontSize: 13 }}>
          Then run <code>npm run verify-deployment -- --log {p.log ?? "0x…"} --log-tx {p.logTx ?? "0x…"}</code>, verify the source on Blockscout (referensi/explorer kit) and remove this page.
        </p>
      </section>
      {lines.length ? (
        <ul className="mono" style={{ fontSize: 12 }} data-testid="deploy-lines">
          {lines.map((l, i) => (
            <li key={i}>{l}</li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}
