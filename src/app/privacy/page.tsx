import { BRAND, CHAIN } from "@/config/brand";
import { DocShell } from "@/components/site/DocShell";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ path: "/privacy", title: `Privacy | ${BRAND.name}`, description: `What ${BRAND.name} reads, what it keeps and what it never collects: no accounts, no cookies, no trackers. Wallet addresses are public on ${CHAIN.name}.` });

const NAV = [{ group: "Privacy", items: [{ id: "short", label: "In short" }, { id: "reads", label: "What the site reads" }, { id: "keeps", label: "What stays in your browser" }, { id: "server", label: "Server logs and limits" }, { id: "never", label: "What we never collect" }] }];

export default function PrivacyPage() {
  return (
    <DocShell nav={NAV}>
      <header className="hero">
        <h1>Privacy</h1>
        <p>{BRAND.name} has no accounts and no sign-up. This page lists everything the site touches.</p>
      </header>
      <section id="short">
        <h2>In short</h2>
        <p>No cookies, no analytics, no ads, no email. Your wallet address is public on {CHAIN.name}; the site uses it to read chain data and nothing else.</p>
      </section>
      <section id="reads">
        <h2>What the site reads</h2>
        <p>When you connect a wallet or paste an address, the page asks {CHAIN.name} for that address&apos;s nonce, ETH balance, a few token balances, recent token transfer events and its season log record. These reads go through this site&apos;s relay and public RPC providers, which see the address in the request like any blockchain read.</p>
      </section>
      <section id="keeps">
        <h2>What stays in your browser</h2>
        <p>Local storage holds the wallet you picked, the address you last looked at, practice check-ins and stamps, your Farmboard history and whether you dismissed a notice. It never leaves your device. Clear this site&apos;s data in your browser settings to remove it.</p>
      </section>
      <section id="server">
        <h2>Server logs and limits</h2>
        <p>To keep the relay fair, the server counts requests per network address for a few minutes. Our hosting provider keeps standard access logs for operations and security. We do not combine either with wallet addresses or build profiles.</p>
      </section>
      <section id="never">
        <h2>What we never collect</h2>
        <p>Seed phrases, private keys, passwords, names, emails or phone numbers. If anyone asks you for these in the name of {BRAND.name}, it is not us.</p>
      </section>
    </DocShell>
  );
}
