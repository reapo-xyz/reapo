"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { BRAND, CHAIN, hasGithub } from "@/config/brand";
import { ASSETS } from "@/config/assets";
import { seasonAt } from "@/lib/season/clock";

export type DocNav = { group: string; items: { id: string; label: string }[] }[];

/** Guide-style page: sticky contents rail on the left (search + groups), text column on the right. */
export function DocShell({ nav, children }: { nav: DocNav; children: React.ReactNode }) {
  const [q, setQ] = useState("");
  const [on, setOn] = useState<string | null>(null);
  const [label] = useState(() => {
    const cur = seasonAt(Math.floor(Date.now() / 1000));
    return `Season ${cur.number} · ${cur.name}`;
  });

  useEffect(() => {
    const ids = nav.flatMap((g) => g.items.map((i) => i.id));
    const obs = new IntersectionObserver(
      (entries) => {
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setOn(vis[0].target.id);
      },
      { rootMargin: "0px 0px -70% 0px" },
    );
    for (const id of ids) {
      const el = document.getElementById(id);
      if (el) obs.observe(el);
    }
    return () => obs.disconnect();
  }, [nav]);

  const needle = q.trim().toLowerCase();
  const groups = nav.map((g) => ({ ...g, items: g.items.filter((i) => !needle || i.label.toLowerCase().includes(needle)) })).filter((g) => g.items.length);

  return (
    <div className="doc">
      <div className="wrap">
        <aside className="rail">
          <Link href="/" className="logo" aria-label={`${BRAND.name}: back to the farm`}>
            <img src={ASSETS.mark} alt="" width={44} height={44} />
            <b>{BRAND.name}</b>
          </Link>
          <p className="season">{label}</p>
          <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search the guide" aria-label="Search the guide" />
          <details open>
            <summary>Contents</summary>
            <nav aria-label="Contents">
              {groups.map((g) => (
                <div key={g.group} className="contents">
                  <p className="grp">{g.group}</p>
                  {g.items.map((i) => (
                    <a key={i.id} href={`#${i.id}`} className={on === i.id ? "on" : ""}>
                      {i.label}
                    </a>
                  ))}
                </div>
              ))}
              {groups.length === 0 ? <p className="soft" style={{ margin: "10px 8px", fontSize: ".9rem" }}>Nothing matches.</p> : null}
            </nav>
          </details>
        </aside>
        <main>
          {children}
          <footer>
            <p>
              {BRAND.name} reads public data from {CHAIN.name} (chain {CHAIN.id}). It never holds your keys or funds. Points are season labels and have no value.
            </p>
            <p className="btns" style={{ marginTop: 10 }}>
              <Link href="/" className="btn primary">
                Back to the farm
              </Link>
              <Link href="/quests" className="btn">
                Quest board
              </Link>
              <Link href="/token" className="btn">
                {BRAND.symbol}
              </Link>
            </p>
            <p style={{ marginTop: 12 }}>
              <Link href="/privacy">Privacy</Link> · <Link href="/cookies">Storage</Link> · <Link href="/terms">Terms</Link> ·{" "}
              <a href={BRAND.x} target="_blank" rel="noreferrer">
                X {BRAND.xHandle}
              </a>
              {hasGithub ? (
                <>
                  {" "}
                  ·{" "}
                  <a href={BRAND.github} target="_blank" rel="noreferrer">
                    Source code
                  </a>
                </>
              ) : null}
            </p>
          </footer>
        </main>
      </div>
    </div>
  );
}
