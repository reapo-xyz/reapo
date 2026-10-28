import { BRAND, CHAIN } from "@/config/brand";
import { DocShell } from "@/components/site/DocShell";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ path: "/terms", title: `Terms | ${BRAND.name}`, description: `Terms of use for ${BRAND.name}: a free quest board on ${CHAIN.name}, provided as is, with no rewards promised and no custody of funds.` });

const NAV = [{ group: "Terms", items: [{ id: "use", label: "Using the site" }, { id: "points", label: "Points and seasons" }, { id: "chain", label: "Transactions" }, { id: "token", label: "The token" }, { id: "changes", label: "Changes" }] }];

export default function TermsPage() {
  return (
    <DocShell nav={NAV}>
      <header className="hero">
        <h1>Terms of use</h1>
        <p>Plain terms for a free tool. Using {BRAND.name} means you accept them.</p>
      </header>
      <section id="use">
        <h2>Using the site</h2>
        <p>{BRAND.name} is provided as is, without warranties. It reads public {CHAIN.name} data and offers transactions that you choose to sign in your own wallet. You are responsible for your wallet, your keys and the transactions you approve.</p>
      </section>
      <section id="points">
        <h2>Points and seasons</h2>
        <p>Points, levels, streaks and stamps are labels inside a season. They have no monetary value, cannot be sold or transferred and do not entitle anyone to a reward, a token or a payment. A season&apos;s rules can be adjusted for later seasons; the rules of a running season are not changed in a way that removes progress already shown.</p>
      </section>
      <section id="chain">
        <h2>Transactions</h2>
        <p>Check-ins and stamps are written to a contract on {CHAIN.name} and cannot be reversed. Gas fees go to the network, not to us. The contract has no owner and nobody, including the team, can alter its records.</p>
      </section>
      <section id="token">
        <h2>The token</h2>
        <p>{BRAND.symbol} is a crypto token with no promise of value, return or utility beyond what is live on this site. Crypto tokens can lose all of their value. Nothing here is investment, legal or tax advice. Make sure using crypto is allowed where you live.</p>
      </section>
      <section id="changes">
        <h2>Changes</h2>
        <p>These terms may be updated; the version on this page is the one that applies.</p>
      </section>
    </DocShell>
  );
}
