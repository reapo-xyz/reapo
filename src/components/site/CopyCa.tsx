"use client";

import { useState } from "react";
import { BRAND, TOKEN, explorerToken, isAddress, shortAddress } from "@/config/brand";
import { ArrowUpRight, CheckIcon, CopyIcon } from "@/components/site/Icons";

/* Contract address of the token from BRAND.ca. Until it is a real address every copy button says "At launch". */

export function useCopy(value: string = BRAND.ca) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    if (!isAddress(value)) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1600);
    } catch {
      // Clipboard refused; the address stays visible.
    }
  };
  return { copied, copy };
}

/** Navbar pill: "$REAPO 0x12…abcd [Copy]"; on phones only the short "CA" button. */
export function CaPill({ compact = false }: { compact?: boolean }) {
  const { copied, copy } = useCopy();
  const live = TOKEN.isLive;
  return (
    <span className={`ca ${compact ? "compact" : ""}`} data-testid={compact ? "ca-chip" : "ca-pill"}>
      {compact ? null : (
        <>
          <b>{BRAND.symbol}</b>
          <span className="mono">{live ? shortAddress(BRAND.ca, 4, 4) : "TBA"}</span>
        </>
      )}
      <button type="button" onClick={copy} disabled={!live} aria-label={live ? `Copy the ${BRAND.symbol} contract address` : `${BRAND.symbol} contract address: at launch`} title={live ? BRAND.ca : "The contract address is published at launch"}>
        {live && !compact ? copied ? <CheckIcon /> : <CopyIcon /> : null}
        {compact ? (live && copied ? "Copied" : "CA") : live ? (copied ? "Copied" : "Copy") : "At launch"}
      </button>
    </span>
  );
}

/** Full address row (footer, token page). */
export function CaBlock({ label = "Contract address", compact = false }: { label?: string; compact?: boolean }) {
  const { copied, copy } = useCopy();
  const live = TOKEN.isLive;
  return (
    <div className={`flex flex-wrap items-center justify-between gap-3 ${compact ? "flex-col items-start" : ""}`} data-testid="ca-block">
      <div className="min-w-0 max-w-full">
        <p className="text-[12px] leading-[18px] text-ink-soft">{label}</p>
        {live ? (
          <a href={explorerToken(BRAND.ca)} target="_blank" rel="noreferrer" className="mt-1 inline-flex max-w-full items-center gap-2 font-mono text-[12.5px] break-all hover:underline">
            {BRAND.ca} <ArrowUpRight size={13} />
          </a>
        ) : (
          <p className="mt-1 text-[14px] text-ink">Contract address coming soon</p>
        )}
      </div>
      <button type="button" className="btn small" onClick={copy} disabled={!live} data-testid="ca-copy">
        {live ? copied ? <CheckIcon /> : <CopyIcon /> : null}
        {live ? (copied ? "Copied" : "Copy CA") : "At launch"}
      </button>
    </div>
  );
}
