"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BRAND, CHAIN, LAUNCHPAD, TOKEN, buyUrl, chartUrl, explorerAddress, explorerBlock, explorerTx, isAddress, shortAddress } from "@/config/brand";
import { CONTRACTS, CONTRACT_NAMES, GAS, logLive } from "@/config/contracts";
import { CHECK_IN_POINTS, LEVELS, QUESTS, SEASON_STATUS, totalQuestPoints } from "@/config/seasons";
import { useSeason } from "@/components/farm/SeasonProvider";
import { useChain } from "@/components/providers/ChainProvider";
import { useWallet } from "@/components/wallet/WalletProvider";
import { useWalletModal } from "@/components/wallet/WalletButton";
import { CaBlock } from "@/components/site/CopyCa";
import { formatUtcDate, liveStreak, milestoneDates } from "@/lib/season/clock";

const n = (v: number | null | undefined, digits = 0) => (v === null || v === undefined || !Number.isFinite(v) ? "—" : v.toLocaleString("en-US", { maximumFractionDigits: digits, minimumFractionDigits: digits }));
const usd = (v: number | null | undefined, digits = 2) => (v === null || v === undefined ? "—" : `$${n(v, digits)}`);

function ModeNote() {
  const live = logLive();
  return live ? (
    <p className="box good tiny">
      Check-ins and stamps are written to <b>{CONTRACT_NAMES.log}</b> on {CHAIN.name} (<a href={explorerAddress(CONTRACTS.log)} target="_blank" rel="noreferrer">{shortAddress(CONTRACTS.log)}</a>). Each one is a transaction you sign; you pay the gas in ETH.
    </p>
  ) : (
    <p className="box warn tiny">
      <b>Practice mode.</b> The {CONTRACT_NAMES.log} contract is written and tested but not deployed yet, so check-ins and stamps are kept in this browser only. Nothing is sent to {CHAIN.name}.
    </p>
  );
}

/* ---------------------------------------------------------------- season */

export function SeasonPanel() {
  const { season, today } = useSeason();
  const { facts } = useChain();
  const ms = milestoneDates(season);
  const pct = season.started ? Math.round(((season.day + 1) / season.days) * 100) : 0;
  return (
    <>
      <div className="box">
        <p className="px" style={{ fontSize: 18 }}>
          Season {season.number}: {season.name}
        </p>
        <p className="soft tiny">
          {formatUtcDate(season.startsAt)} to {formatUtcDate(season.endsAt - 1)} (UTC) · {season.started ? `day ${season.day + 1} of ${season.days}` : "starts soon"}
        </p>
        <span className="bar big mt-2" aria-label={`${pct}% of the season gone`}>
          <i style={{ width: `${pct}%` }} />
        </span>
      </div>
      <p className="box warn">
        <b>{SEASON_STATUS}</b> This season is for trying the rules: quests, check-ins and points work, but there is nothing to win and points do not turn into tokens.
      </p>
      <div>
        <h3>How a season works</h3>
        <p className="mt-1">
          A season lasts {season.days} days. Each day (UTC) you can check in once; checking in on consecutive days builds a streak. Quests are checked against what your wallet really did on {CHAIN.name}. Your points and level live on the Farmboard. When a season ends, a new one starts the next day with fresh streaks; past check-ins stay readable on chain.
        </p>
      </div>
      <div>
        <h3>Milestones</h3>
        <ul className="ms mt-2">
          {ms.map((m) => (
            <li key={m.title} className={m.reached ? "reached" : ""}>
              <span>
                <b>{m.title}</b> <span className="soft tiny">· {formatUtcDate(m.at)}</span>
                <br />
                <span className="soft">{m.text}</span>
              </span>
            </li>
          ))}
        </ul>
      </div>
      <div>
        <h3>Season totals on chain</h3>
        <dl className="kv mt-2">
          <dt>Wallets checked in</dt>
          <dd>{facts?.season ? n(facts.season.farmers) : "—"}</dd>
          <dt>Check-ins</dt>
          <dd>{facts?.season ? n(facts.season.checkIns) : "—"}</dd>
          <dt>Streak stamps (contract-checked)</dt>
          <dd>{facts?.season ? n(facts.season.streakStamps) : "—"}</dd>
          <dt>Self-claimed stamps</dt>
          <dd>{facts?.season ? n(facts.season.selfStamps) : "—"}</dd>
        </dl>
        {!logLive() ? <p className="soft tiny mt-1">Shown as “—” until the season log contract is live. We do not estimate these numbers.</p> : null}
      </div>
      <div>
        <h3>
          Planned <span className="tag plan">planned</span>
        </h3>
        <p className="mt-1 soft">
          Funded reward pools, partner campaigns and {BRAND.symbol} utility are plans, not features. A reward appears on this page only once it is really funded, with its source, its size and its rules written here before the season starts.
        </p>
      </div>
      <p className="soft tiny">Today is day index {today ?? "—"} since the season clock started.</p>
    </>
  );
}

/* ---------------------------------------------------------------- quests */

export function QuestsPanel({ focus }: { focus?: number | null }) {
  const s = useSeason();
  const { address } = useWallet();
  const { open } = useWalletModal();
  const [paste, setPaste] = useState("");
  return (
    <>
      <p>
        {QUESTS.length} quests, {totalQuestPoints()} points in all. Each one is checked against public {CHAIN.name} data for the wallet below, at one block, and shows the exact value it was decided on.
      </p>
      <div className="box grid gap-2">
        {s.subject ? (
          <p className="tiny">
            Checking <b className="mono">{shortAddress(s.subject, 8, 6)}</b> {s.readOnly ? <span className="tag">read-only</span> : <span className="tag leaf">your wallet</span>}
            {s.readings ? (
              <>
                {" "}
                at block{" "}
                <a href={explorerBlock(s.readings.block)} target="_blank" rel="noreferrer">
                  {n(s.readings.block)}
                </a>
              </>
            ) : null}
          </p>
        ) : (
          <p className="tiny">Connect a wallet, or paste any Base address to look at its quests without connecting.</p>
        )}
        <div className="row">
          {!address ? (
            <button type="button" className="btn primary small" onClick={open}>
              Connect wallet
            </button>
          ) : null}
          <button type="button" className="btn small" onClick={() => void s.refresh()} disabled={!s.subject || s.loading}>
            {s.loading ? "Reading Base…" : "Check now"}
          </button>
          {s.readOnly && address ? (
            <button type="button" className="btn small" onClick={() => s.setWatchAddress(null)}>
              Back to my wallet
            </button>
          ) : null}
        </div>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            if (isAddress(paste.trim())) {
              s.setWatchAddress(paste.trim());
              setPaste("");
            }
          }}
        >
          <input className="field" value={paste} onChange={(e) => setPaste(e.target.value)} placeholder="0x… any Base address (read-only)" aria-label="Base address to check" spellCheck={false} />
          <button type="submit" className="btn small" disabled={!isAddress(paste.trim())}>
            Look
          </button>
        </form>
        {s.error ? <p className="alert">{s.error}</p> : null}
      </div>
      <div className="grid gap-2">
        {QUESTS.map((q, i) => {
          const r = s.results[i];
          const stamp = s.stamps[q.id];
          const done = r.status === "done";
          return (
            <article key={q.id} id={`quest-${q.id}`} className={`quest ${done ? "done" : ""}`} style={focus === i ? { outline: "3px solid #f4b62c" } : undefined}>
              <span className="tick" aria-hidden="true">
                {done ? "✓" : i + 1}
              </span>
              <div className="min-w-0 grid gap-1">
                <div className="top">
                  <b>{q.title}</b>
                  <span className={`tag ${q.proof === "contract" ? "leaf" : ""}`}>{q.proof === "contract" ? "contract-checked" : "read from Base"}</span>
                  <span className="pts">+{q.points}</span>
                </div>
                <p>{q.task}</p>
                <p className="rule">Rule: {q.rule}</p>
                <p className="input">
                  {r.status === "done" ? "Done" : r.status === "open" ? "Not yet" : r.status === "waiting" ? "Waiting" : "Not checked"}: {r.input}
                </p>
                {done && !s.readOnly ? (
                  <div className="row">
                    {stamp ? (
                      <span className="tag gold">
                        {stamp.kind === "contract" ? "stamped by the contract" : stamp.kind === "self" ? "stamped (self-claimed)" : "practice stamp"}
                        {stamp.tx ? (
                          <>
                            {" "}
                            ·{" "}
                            <a href={explorerTx(stamp.tx)} target="_blank" rel="noreferrer">
                              tx
                            </a>
                          </>
                        ) : null}
                      </span>
                    ) : q.kind.type === "checkIn" ? null : (
                      <button type="button" className="btn small" disabled={!!s.busy} onClick={() => void s.stamp(q)}>
                        {s.busy === `stamp:${q.id}` ? "Confirm in wallet…" : q.proof === "contract" ? "Stamp on chain" : "Stamp (self-claimed)"}
                      </button>
                    )}
                  </div>
                ) : null}
              </div>
            </article>
          );
        })}
      </div>
      <ModeNote />
      <p className="soft tiny">
        Contract-checked stamps are verified by {CONTRACT_NAMES.log} itself (it reads your streak). Self-claimed stamps are your own public note with a hash of the values above; the contract cannot check them. Points are season labels and never convert into tokens or anything of value.
      </p>
    </>
  );
}

/* ---------------------------------------------------------------- check-in */

function untilUtcMidnight() {
  const now = Date.now();
  const next = Math.ceil(now / 86_400_000) * 86_400_000;
  const m = Math.max(0, Math.round((next - now) / 60_000));
  return `${Math.floor(m / 60)} h ${m % 60} min`;
}

/** Countdown to the next UTC day; empty on the server so the static HTML never disagrees with the browser. */
function NextDay() {
  const [text, setText] = useState("—");
  useEffect(() => {
    const tick = () => setText(untilUtcMidnight());
    const first = window.setTimeout(tick, 0);
    const t = window.setInterval(tick, 30_000);
    return () => {
      window.clearTimeout(first);
      window.clearInterval(t);
    };
  }, []);
  return <>{text}</>;
}

export function CheckInPanel() {
  const s = useSeason();
  const { address } = useWallet();
  const { open } = useWalletModal();
  const streakNow = s.today === null ? 0 : liveStreak(s.farmer, s.today);
  return (
    <>
      <div className="box grid gap-2">
        <p className="px" style={{ fontSize: 18 }}>
          {s.checkedInToday ? "Checked in for today" : "Today is open"}
        </p>
        <dl className="kv">
          <dt>Streak right now</dt>
          <dd>{streakNow} day{streakNow === 1 ? "" : "s"}</dd>
          <dt>Best streak this season</dt>
          <dd>{s.farmer.bestStreak}</dd>
          <dt>Check-ins this season</dt>
          <dd>{s.farmer.checkIns}</dd>
          <dt>Next UTC day in</dt>
          <dd>
            <NextDay />
          </dd>
          <dt>Gas (estimate)</dt>
          <dd>{logLive() ? `~${n(s.farmer.checkIns ? GAS.checkIn : GAS.checkInFirst)} gas` : "none (practice)"}</dd>
        </dl>
        {!address && logLive() ? (
          <button type="button" className="btn primary big wide" onClick={open}>
            Connect to check in
          </button>
        ) : (
          <button type="button" className="btn primary big wide" disabled={s.checkedInToday || !!s.busy || !s.subject || (logLive() && s.readOnly)} onClick={() => void s.checkIn()} data-testid="checkin">
            {s.busy === "checkin" ? "Confirm in wallet…" : s.checkedInToday ? "Done for today" : logLive() ? "Check in on Base" : "Practice check-in"}
          </button>
        )}
        {!s.subject ? <p className="tiny soft">Connect a wallet (or paste an address on the Quests board) first.</p> : null}
      </div>
      <p>
        One check-in per wallet per UTC day. Checking in on consecutive days builds your streak; missing a day starts it again at 1. Every check-in adds {CHECK_IN_POINTS} points on the Farmboard, and the streak quests (3 and 7 days) are checked by the contract itself.
      </p>
      <ModeNote />
    </>
  );
}

/* ---------------------------------------------------------------- farmboard */

export function FarmboardPanel() {
  const s = useSeason();
  const span = s.level.next ? s.level.next.min - s.level.current.min : 1;
  const pct = s.level.next ? Math.round(((s.points - s.level.current.min) / span) * 100) : 100;
  return (
    <>
      <div className="box grid gap-2">
        <div className="row" style={{ justifyContent: "space-between" }}>
          <p className="px" style={{ fontSize: 20 }}>
            {s.level.current.name}
          </p>
          <p className="px" style={{ fontSize: 20 }}>
            {s.points} pts
          </p>
        </div>
        <span className="bar big gold">
          <i style={{ width: `${pct}%` }} />
        </span>
        <p className="tiny soft">{s.level.next ? `${s.level.toNext} points to ${s.level.next.name}` : "Top level for this season"}</p>
      </div>
      <dl className="kv">
        <dt>Quests cleared</dt>
        <dd>
          {s.done} / {QUESTS.length}
        </dd>
        <dt>Quest points</dt>
        <dd>{s.questPoints}</dd>
        <dt>Check-in points</dt>
        <dd>
          {s.farmer.checkIns} × {CHECK_IN_POINTS}
        </dd>
        <dt>Best streak</dt>
        <dd>{s.farmer.bestStreak}</dd>
        <dt>Wallet</dt>
        <dd className="mono">{s.subject ? shortAddress(s.subject) : "—"}</dd>
      </dl>
      <div>
        <h3>Levels</h3>
        <p className="tiny soft mt-1">{LEVELS.map((l) => `${l.name} ${l.min}+`).join(" · ")}</p>
      </div>
      <div>
        <h3>History</h3>
        {s.history.length ? (
          <ul className="hist mt-2">
            {s.history.slice(0, 12).map((h) => (
              <li key={`${h.at}-${h.block}`}>
                <span>
                  {new Date(h.at).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })} · block {n(h.block)}
                </span>
                <b>
                  {h.points} pts · {h.done} quests
                </b>
              </li>
            ))}
          </ul>
        ) : (
          <p className="tiny soft mt-1">Every check of the quest board adds a row here (kept in this browser).</p>
        )}
      </div>
      <p className="box tiny">Points and levels are labels for this season. They are not a token, not a balance and not a claim on any reward, and they never convert into anything of value.</p>
    </>
  );
}

/* ---------------------------------------------------------------- token + network */

export function TokenPanel() {
  const { facts } = useChain();
  const t = facts?.token;
  const chart = chartUrl(BRAND.ca);
  return (
    <>
      <div className="box grid gap-2">
        <p className="px" style={{ fontSize: 18 }}>
          {BRAND.symbol} on {CHAIN.name}
        </p>
        <CaBlock compact />
        <div className="btns">
          <a className="btn primary" href={buyUrl()} target="_blank" rel="noreferrer" data-testid="buy">
            {TOKEN.isLive ? `Buy ${BRAND.symbol}` : `Open ${LAUNCHPAD.name}`}
          </a>
          {chart ? (
            <a className="btn" href={chart} target="_blank" rel="noreferrer">
              Chart on DEXTools
            </a>
          ) : null}
        </div>
        {!TOKEN.isLive ? <p className="tiny soft">At launch: the token address is published here first. Until then the button opens the launchpad home.</p> : null}
      </div>
      <dl className="kv">
        <dt>Name / symbol (from the token)</dt>
        <dd>{t ? `${t.name ?? "—"} / ${t.symbol ?? "—"}` : "At launch"}</dd>
        <dt>Supply</dt>
        <dd>{t?.supply && t.decimals !== null ? n(Number(BigInt(t.supply) / 10n ** BigInt(t.decimals))) : "—"}</dd>
        <dt>Holders</dt>
        <dd>{n(t?.holders)}</dd>
        <dt>Price</dt>
        <dd>{t?.priceUsd ? `$${t.priceUsd.toPrecision(4)}` : "—"}</dd>
        <dt>Pool liquidity</dt>
        <dd>{usd(t?.liquidityUsd, 0)}</dd>
      </dl>
      <p className="tiny soft">
        Launch venue: {LAUNCHPAD.name}. After launch the token trades in its {LAUNCHPAD.pool} pool: fixed supply of 1 billion, 18 decimals, liquidity locked permanently, and a 1% fee taken in ETH or as creator tax. That describes how the pool is set up, not what the price will do.
      </p>
      <div>
        <h3>
          {BRAND.symbol} utility <span className="tag plan">planned</span>
        </h3>
        <ul className="mt-1 tiny" style={{ paddingLeft: 18 }}>
          <li>Access to selected season features</li>
          <li>Paying for campaign services</li>
          <li>Platform benefits, only where they are really funded and backed by a working product</li>
        </ul>
        <p className="tiny soft">None of these is live. Holding {BRAND.symbol} does not give rewards, income or a share of anything.</p>
      </div>
      <NetworkPanel />
    </>
  );
}

export function NetworkPanel() {
  const { facts, failed } = useChain();
  return (
    <div>
      <h3>
        {CHAIN.name} right now <span className={`tag ${failed ? "bad" : "leaf"}`}>{failed ? "offline" : "live"}</span>
      </h3>
      <dl className="kv mt-2">
        <dt>Latest block</dt>
        <dd>{facts?.block ? <a href={explorerBlock(facts.block)} target="_blank" rel="noreferrer">{n(facts.block)}</a> : "—"}</dd>
        <dt>Block time (last 1,000)</dt>
        <dd>{facts?.blockPace ? `${n(facts.blockPace, 2)} s` : "—"}</dd>
        <dt>Gas price</dt>
        <dd>{facts?.gasGwei !== null && facts?.gasGwei !== undefined ? `${n(facts.gasGwei, 4)} gwei` : "—"}</dd>
        <dt>Transactions in latest block</dt>
        <dd>{n(facts?.txsInBlock)}</dd>
        <dt>ETH / USD</dt>
        <dd>{usd(facts?.ethUsd)}</dd>
      </dl>
      <p className="tiny soft mt-1">
        Read from {CHAIN.name} (chain {CHAIN.id}) through public RPC endpoints{facts?.ethUsdSource ? `; ETH price from ${facts.ethUsdSource}` : ""}. A dash means the source did not answer.
      </p>
      <p className="tiny mt-1">
        <Link href="/docs">Read the season guide</Link>
      </p>
    </div>
  );
}
