import { BRAND } from "@/config/brand";
import { DocShell } from "@/components/site/DocShell";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({ path: "/cookies", title: `Storage notice | ${BRAND.name}`, description: `${BRAND.name} sets no cookies. A short list of what it keeps in your browser's local storage and how to clear it.` });

const NAV = [{ group: "Storage", items: [{ id: "cookies", label: "Cookies" }, { id: "local", label: "Local storage" }, { id: "clear", label: "Clearing it" }] }];

const ITEMS = [
  ["Wallet choice", "Which wallet you connected, so the site can reconnect it."],
  ["Address you looked at", "A pasted read-only address, until you go back to your wallet."],
  ["Practice check-ins and stamps", "Kept per address while the season log contract is not deployed."],
  ["Farmboard history", "One row per quest board check, at most 40 rows per address."],
  ["Notices", "Whether you closed the news box or this storage notice."],
];

export default function CookiesPage() {
  return (
    <DocShell nav={NAV}>
      <header className="hero">
        <h1>Storage notice</h1>
        <p>{BRAND.name} works without cookies. Here is what it does keep, and where.</p>
      </header>
      <section id="cookies">
        <h2>Cookies</h2>
        <p>None. The site sets no cookies of its own and loads no tracking or advertising scripts.</p>
      </section>
      <section id="local">
        <h2>Local storage</h2>
        <div className="plot">
          <table>
            <thead>
              <tr>
                <th>What</th>
                <th>Why</th>
              </tr>
            </thead>
            <tbody>
              {ITEMS.map(([a, b]) => (
                <tr key={a}>
                  <td>{a}</td>
                  <td>{b}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
      <section id="clear">
        <h2>Clearing it</h2>
        <p>Use your browser&apos;s &quot;clear site data&quot; option for this site. Practice check-ins are lost when you do; on-chain check-ins are not affected.</p>
      </section>
    </DocShell>
  );
}
