"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BRAND, CHAIN } from "@/config/brand";
import { ASSETS } from "@/config/assets";
import { logLive } from "@/config/contracts";
import { QUESTS, SEASON_STATUS } from "@/config/seasons";
import { storageKey } from "@/config/storage";
import { NEWS, contractNews } from "@/content/news";
import { FarmCanvas } from "@/components/farm/FarmCanvas";
import { PixelIcon, type PixelName } from "@/components/farm/PixelIcon";
import { CheckInPanel, FarmboardPanel, QuestsPanel, SeasonPanel, TokenPanel } from "@/components/farm/panels";
import { useSeason } from "@/components/farm/SeasonProvider";
import { useChain } from "@/components/providers/ChainProvider";
import { CaPill } from "@/components/site/CopyCa";
import { NavWallet, useWalletModal } from "@/components/wallet/WalletButton";
import { useWallet } from "@/components/wallet/WalletProvider";
import { useLocalStore } from "@/components/wallet/useLocalStore";

export type PanelId = "season" | "quests" | "farmboard" | "checkin" | "token";

const PANELS: { id: PanelId; label: string; title: string; icon: PixelName; path: string }[] = [
  { id: "season", label: "Season", title: "Season", icon: "season", path: "/seasons" },
  { id: "quests", label: "Quests", title: "Quest board", icon: "quests", path: "/quests" },
  { id: "farmboard", label: "Farmboard", title: "Farmboard", icon: "board", path: "/farmboard" },
  { id: "checkin", label: "Check in", title: "Daily check-in", icon: "checkin", path: "/checkin" },
  { id: "token", label: "Token", title: `${BRAND.symbol} and ${CHAIN.name}`, icon: "token", path: "/token" },
];

const fmt = (v: number | null | undefined, d = 0) => (v === null || v === undefined || !Number.isFinite(v) ? "—" : v.toLocaleString("en-US", { maximumFractionDigits: d, minimumFractionDigits: d }));

function Hud({ onPanel, titleH1 }: { onPanel: (p: PanelId) => void; titleH1: boolean }) {
  const { season, points, level, farmer, today } = useSeason();
  const { facts } = useChain();
  const pct = season.started ? Math.round(((season.day + 1) / season.days) * 100) : 0;
  const streak = today !== null && farmer.checkIns > 0 && (farmer.lastDay === today || farmer.lastDay + 1 === today) ? farmer.streak : 0;
  return (
    <header className="hud" aria-label="Season status">
      <Link href="/" className="brand" aria-label={`${BRAND.name} home`}>
        <img src={ASSETS.mark} alt="" width={30} height={30} />
        {titleH1 ? (
          <h1 className="m-0 text-[inherit] leading-none">
            <b>{BRAND.name}</b>
          </h1>
        ) : (
          <b>{BRAND.name}</b>
        )}
      </Link>
      <div className="tiles">
        <button type="button" className="tile" onClick={() => onPanel("season")} title="Open the season">
          <span className="tl">Season {season.number}</span>
          <b>
            {season.name} <small>d{season.started ? season.day + 1 : 0}/{season.days}</small>
          </b>
          <span className="bar">
            <i style={{ width: `${pct}%` }} />
          </span>
        </button>
        <button type="button" className="tile" onClick={() => onPanel("farmboard")} title="Open the Farmboard">
          <span className="tl">{level.current.name}</span>
          <b>
            {points} <small>pts</small>
          </b>
        </button>
        <button type="button" className="tile" onClick={() => onPanel("checkin")} title="Open the daily check-in">
          <span className="tl">Streak</span>
          <b>
            {streak} <small>day{streak === 1 ? "" : "s"}</small>
          </b>
        </button>
        <button type="button" className="tile" onClick={() => onPanel("token")} title={`Latest ${CHAIN.name} block`}>
          <span className="tl">{CHAIN.name} block</span>
          <b>{fmt(facts?.block)}</b>
        </button>
        <button type="button" className="tile" onClick={() => onPanel("token")} title="ETH price in US dollars">
          <span className="tl">ETH</span>
          <b>{facts?.ethUsd ? `$${fmt(facts.ethUsd, 0)}` : "—"}</b>
        </button>
        <button type="button" className="tile" onClick={() => onPanel("token")} title={`${CHAIN.name} gas price`}>
          <span className="tl">Gas</span>
          <b>
            {facts?.gasGwei !== null && facts?.gasGwei !== undefined ? fmt(facts.gasGwei, 3) : "—"} <small>gwei</small>
          </b>
        </button>
      </div>
      <div className="who">
        <span className="ca-full">
          <CaPill />
        </span>
        <span className="ca-short">
          <CaPill compact />
        </span>
        <NavWallet label="Connect" className="btn primary" />
      </div>
    </header>
  );
}

function NewsBox() {
  const [hidden, setHidden] = useLocalStore<boolean>(storageKey("news", "hidden"), false);
  const [i, setI] = useState(0);
  const list = [...NEWS, contractNews(logLive())];
  if (hidden) return null;
  const item = list[i % list.length];
  return (
    <aside className="newsbox" aria-label="News">
      <button type="button" className="x" aria-label="Close news" onClick={() => setHidden(true)}>
        ×
      </button>
      <h3>{item.title}</h3>
      <p>{item.body}</p>
      {list.length > 1 ? (
        <button type="button" className="more" onClick={() => setI((v) => v + 1)}>
          +{list.length - 1} more
        </button>
      ) : null}
    </aside>
  );
}

function StorageNotice() {
  const [ok, setOk] = useLocalStore<boolean>(storageKey("storage-ok"), false);
  if (ok) return null;
  return (
    <div className="notice" role="region" aria-label="Browser storage">
      <h3 className="px">Your browser, your data</h3>
      <p>
        {BRAND.name} sets no cookies and runs no trackers or ads. It keeps a few things in your browser&apos;s own storage so the farm remembers you: the wallet you picked, practice check-ins and your Farmboard history. <Link href="/cookies">Storage notice</Link> · <Link href="/privacy">Privacy</Link>
      </p>
      <div className="btns">
        <Link href="/cookies" className="btn">
          Details
        </Link>
        <button type="button" className="btn primary" onClick={() => setOk(true)}>
          Got it
        </button>
      </div>
    </div>
  );
}

function Toasts() {
  const { notice, clearNotice } = useSeason();
  useEffect(() => {
    if (!notice) return;
    const t = window.setTimeout(clearNotice, 7000);
    return () => window.clearTimeout(t);
  }, [notice, clearNotice]);
  return (
    <div className="toasts" aria-live="polite">
      {notice ? (
        <div className="toast">
          {notice}
          <button type="button" aria-label="Dismiss" onClick={clearNotice}>
            ×
          </button>
        </div>
      ) : null}
    </div>
  );
}

/** The start card over the welcome scene ("/" only). Server-rendered so its text is in the first HTML. */
function Welcome({ onEnter }: { onEnter: () => void }) {
  const { open } = useWalletModal();
  const { address } = useWallet();
  useEffect(() => {
    if (address) onEnter();
  }, [address, onEnter]);
  return (
    <div className="welcome">
      <FarmCanvas mode="welcome" plots={QUESTS.map((_, i) => (i % 3 === 0 ? "done" : "open"))} />
      <h1 className="welcome-title">
        <span className="word">{BRAND.name}</span>
        <span className="sub">Discover · Participate · Grow</span>
      </h1>
      <div className="modal in-welcome">
        <section className="card" aria-labelledby="start-title">
          <h2 id="start-title">Start your season</h2>
          <p>
            {BRAND.name} is a seasonal onchain quest board on {CHAIN.name}. Check in each day, clear quests that are checked against your wallet&apos;s real {CHAIN.name} activity, and watch your plots grow on the Farmboard.
          </p>
          <p className="entry">
            {SEASON_STATUS} No sign-up and no entry fee: you only pay {CHAIN.name} gas, in ETH, when you choose to write a check-in on chain.
          </p>
          <button type="button" className="btn cta wide" onClick={open} data-testid="welcome-connect">
            Connect wallet
          </button>
          <button type="button" className="btn wide" onClick={onEnter} data-testid="welcome-enter">
            Look around first
          </button>
          <p className="meta">Works with Coinbase Wallet, MetaMask, Phantom, Rabby and any wallet that reaches {CHAIN.name}, or a phone wallet over WalletConnect.</p>
          <p className="meta">
            New here? <Link href="/docs">Read the season guide</Link>
          </p>
          <nav className="links" aria-label="Sections">
            <Link href="/seasons">Seasons</Link>·<Link href="/quests">Quests</Link>·<Link href="/farmboard">Farmboard</Link>·<Link href="/checkin">Check-in</Link>·<Link href="/token">{BRAND.symbol}</Link>·<Link href="/docs">Guide</Link>
          </nav>
          <nav className="links legal" aria-label="Legal">
            <Link href="/privacy">Privacy</Link>·<Link href="/cookies">Storage</Link>·<Link href="/terms">Terms</Link>
            {BRAND.x ? (
              <>
                ·
                <a href={BRAND.x} target="_blank" rel="noreferrer">
                  X {BRAND.xHandle}
                </a>
              </>
            ) : null}
          </nav>
        </section>
      </div>
    </div>
  );
}

export function GameShell({ initialPanel = null, welcome = false }: { initialPanel?: PanelId | null; welcome?: boolean }) {
  const [panel, setPanel] = useState<PanelId | null>(initialPanel);
  const [focus, setFocus] = useState<number | null>(null);
  const [entered, setEntered] = useLocalStore<boolean>(storageKey("entered"), false);
  const [dismissed, setDismissed] = useState(false);
  const showWelcome = welcome && !entered && !dismissed;
  const season = useSeason();

  useEffect(() => {
    document.body.classList.toggle("panel-open", panel !== null);
    document.body.style.overflow = "hidden";
    return () => {
      document.body.classList.remove("panel-open");
      document.body.style.overflow = "";
    };
  }, [panel]);

  const openPanel = (p: PanelId | null) => {
    setPanel(p);
    const path = p ? PANELS.find((x) => x.id === p)!.path : "/";
    if (window.location.pathname !== path) window.history.replaceState(null, "", path);
  };

  const enter = () => {
    setEntered(true);
    setDismissed(true);
  };

  const plots = season.results.map((r) => r.status);
  const meta = PANELS.find((p) => p.id === panel);
  const TitleTag = initialPanel && panel === initialPanel ? "h1" : "h2";

  return (
    <>
      <a href="#panel" className="skip">
        Skip to the panel
      </a>
      <div className="app">
        <Hud onPanel={openPanel} titleH1={!showWelcome && !(initialPanel && panel === initialPanel)} />
        <main className="stage">
          <FarmCanvas
            mode="play"
            plots={plots}
            onPlot={(i) => {
              setFocus(i);
              openPanel("quests");
              window.setTimeout(() => document.getElementById(`quest-${QUESTS[i].id}`)?.scrollIntoView({ block: "center", behavior: "smooth" }), 280);
            }}
          />
          <div className="banner" role="status">
            <b>
              Season {season.season.number}: {season.season.name}
            </b>{" "}
            <span>
              · {season.done}/{QUESTS.length} quests · {season.liveMode ? "check-ins on Base" : "practice check-ins"} · {SEASON_STATUS}
            </span>
          </div>
          <nav className="dock" aria-label="Menu">
            {PANELS.map((p) => (
              <button key={p.id} type="button" className={`dock-btn ${panel === p.id ? "on" : ""}`} aria-pressed={panel === p.id} onClick={() => openPanel(panel === p.id ? null : p.id)} data-testid={`dock-${p.id}`}>
                <PixelIcon name={p.icon} />
                {p.label}
              </button>
            ))}
            <Link href="/docs" className="dock-btn" data-testid="dock-guide">
              <PixelIcon name="guide" />
              Guide
            </Link>
          </nav>
          <section id="panel" className={`panel ${panel ? "open" : ""}`} aria-label={meta?.title ?? "Panel"} aria-hidden={!panel}>
            {meta ? (
              <>
                <div className="panel-head">
                  <PixelIcon name={meta.icon} size={22} />
                  <TitleTag>{meta.title}</TitleTag>
                  <button type="button" className="panel-close" aria-label="Close panel" onClick={() => openPanel(null)}>
                    ×
                  </button>
                </div>
                <div className="panel-body">
                  {panel === "season" ? <SeasonPanel /> : null}
                  {panel === "quests" ? <QuestsPanel focus={focus} /> : null}
                  {panel === "farmboard" ? <FarmboardPanel /> : null}
                  {panel === "checkin" ? <CheckInPanel /> : null}
                  {panel === "token" ? <TokenPanel /> : null}
                </div>
              </>
            ) : null}
          </section>
        </main>
      </div>
      {!showWelcome && !panel ? <NewsBox /> : null}
      <Toasts />
      {showWelcome ? <Welcome onEnter={enter} /> : null}
      <StorageNotice />
    </>
  );
}
