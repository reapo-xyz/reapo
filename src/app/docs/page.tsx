import Link from "next/link";
import { BRAND, CHAIN, ETH_USD_FEED, LAUNCHPAD, TOKEN, USDG, WETH, explorerAddress } from "@/config/brand";
import { DAY_BLOCKS } from "@/config/seasons";
import { CONTRACTS, CONTRACT_NAMES, GAS, logLive } from "@/config/contracts";
import { CHECK_IN_POINTS, LEVELS, MILESTONES, QUESTS, SEASON_CLOCK, SEASON_NAMES, totalQuestPoints } from "@/config/seasons";
import { DocShell, type DocNav } from "@/components/site/DocShell";
import { JsonLd } from "@/components/JsonLd";
import { breadcrumbLd, faqLd, pageMeta } from "@/lib/seo";
import { formatUtcDate } from "@/lib/season/clock";

export const metadata = pageMeta({
  path: "/docs",
  title: `Season guide | ${BRAND.name}`,
  description: `The ${BRAND.name} season guide: how seasons, daily check-ins, quests, points and the season log contract on ${CHAIN.name} work, and what is still planned.`,
  type: "article",
});

const NAV: DocNav = [
  { group: "Basics", items: [{ id: "what", label: `What is ${BRAND.name}` }, { id: "start", label: "Getting started" }, { id: "wallets", label: `Wallets and ${CHAIN.name}` }] },
  {
    group: "The season",
    items: [
      { id: "seasons", label: "Seasons" },
      { id: "checkin", label: "Daily check-in" },
      { id: "quests", label: "Quests" },
      { id: "points", label: "Points and levels" },
      { id: "farmboard", label: "Farmboard" },
      { id: "farm", label: "The farm view" },
    ],
  },
  {
    group: "Onchain",
    items: [
      { id: "contract", label: "Season log contract" },
      { id: "practice", label: "Practice mode" },
      { id: "data", label: "Live data and sources" },
    ],
  },
  { group: "Token", items: [{ id: "token", label: `${BRAND.symbol}` }, { id: "planned", label: "Planned, not live" }] },
  { group: "Help", items: [{ id: "risks", label: "Risks and limits" }, { id: "privacy", label: "Your data" }, { id: "faq", label: "FAQ" }] },
];

const FAQ = [
  {
    q: `What is ${BRAND.name}?`,
    a: `${BRAND.name} is a seasonal onchain quest board on ${CHAIN.name}. Each season lasts ${SEASON_CLOCK.seasonDays} days. You check in once a day to build a streak, clear quests that are checked against your wallet's real ${CHAIN.name} activity, and follow your points and level on the Farmboard.`,
  },
  {
    q: `How does ${BRAND.name} work?`,
    a: `The site reads public ${CHAIN.name} data for a wallet (its nonce, balances and transfer logs) at one block and applies the published rule of each quest to it. Daily check-ins and streaks are kept by the ${CONTRACT_NAMES.log} contract, which can also stamp streak quests on its own.${logLive() ? "" : " Before that contract is deployed, check-ins run in practice mode in your browser."}`,
  },
  {
    q: `How do I buy ${BRAND.symbol}?`,
    a: TOKEN.isLive
      ? `${BRAND.symbol} is an ERC-20 on ${CHAIN.name} at ${BRAND.ca}. It trades on ${LAUNCHPAD.name}; the buy buttons on this site open its page there. Check the address on the token page before you trade.`
      : `${BRAND.symbol} has not launched yet. It is planned to launch on ${LAUNCHPAD.name} on ${CHAIN.name}; the contract address is published on the token page first. Until then, any address claiming to be ${BRAND.symbol} is not ours.`,
  },
  { q: `Which network is ${BRAND.name} on?`, a: `${CHAIN.name}, chain id ${CHAIN.id}. Gas is paid in ETH. The ${BRAND.symbol} token and the season log contract are on the same network.` },
  {
    q: "Is there a reward for completing quests?",
    a: "Not in this season. It is a preview season and no reward pool is funded. Points and levels are labels only; they are not a token, not a balance and they never convert into anything of value. A reward is only ever announced once it is really funded, with its source and rules published first.",
  },
  {
    q: "What are the risks?",
    a: `Check-ins and stamps are transactions you sign; they cost a little ETH in gas and cannot be undone. Smart contracts can have bugs. Self-claimed stamps are notes, not proofs. ${BRAND.symbol}, once launched, can lose most or all of its value. Never sign anything you do not understand, and only use the addresses published on this site.`,
  },
];

export default function DocsPage() {
  const deployed = logLive();
  return (
    <DocShell nav={NAV}>
      <JsonLd data={[breadcrumbLd([{ name: "Season guide", path: "/docs" }]), faqLd(FAQ)]} />
      <header className="hero">
        <h1>The {BRAND.name} season guide</h1>
        <p>Everything about a season in one place: how check-ins and streaks work, how each quest is checked on {CHAIN.name}, what points mean, and which parts are still plans.</p>
        <div className="facts">
          <span>
            Network <b>{CHAIN.name}</b>
          </span>
          <span>
            Season length <b>{SEASON_CLOCK.seasonDays} days</b>
          </span>
          <span>
            Quests <b>{QUESTS.length}</b>
          </span>
          <span>
            Reward pool <b>none funded</b>
          </span>
        </div>
      </header>

      <section id="what">
        <h2>What is {BRAND.name}</h2>
        <p>
          {BRAND.name} is a seasonal onchain quest board for {CHAIN.name}. Instead of asking you to lock funds in a pool, it asks you to show up: a short daily check-in, and a list of quests that look at what your wallet really does on {CHAIN.name}. Your progress grows into a small pixel farm, one plot per quest.
        </p>
        <p>
          Three ideas carry the whole thing. <b>Seasons</b> give the activity a clear start, a clear end and published milestones. <b>Quests</b> are rules anyone can read, applied to public chain data, with the exact value they were decided on shown next to each tick. The <b>Farmboard</b> adds it up into points and a level for the season.
        </p>
        <p>
          The current season is a preview. Everything on the board works, but no reward pool is funded, so there is nothing to win. That is on purpose: the rules get tested in the open before anything of value is ever attached to them.
        </p>
      </section>

      <section id="start">
        <h2>Getting started</h2>
        <ol className="steps">
          <li>
            <span>
              <b>Open the farm and connect a wallet.</b>
              Any wallet that reaches {CHAIN.name} works: MetaMask, Rabby, OKX Wallet, Coinbase Wallet and others, or a phone wallet over WalletConnect. Phantom cannot add custom networks, so it cannot reach this chain. Connecting only shares your address. If your wallet is on another network, the site asks it to switch to {CHAIN.name} and adds the network if needed.
            </span>
          </li>
          <li>
            <span>
              <b>Open the quest board.</b>
              The board reads your wallet at the latest block and ticks every quest whose rule is met. You can also paste any {CHAIN.name} address to look at its quests without connecting; that view is read-only.
            </span>
          </li>
          <li>
            <span>
              <b>Check in for today.</b>
              One check-in per UTC day. On consecutive days your streak grows; the streak quests at 3 and 7 days are checked by the contract itself.
            </span>
          </li>
          <li>
            <span>
              <b>Watch the Farmboard.</b>
              Points from quests and check-ins add up to a season level. Every check of the board leaves a row in your history.
            </span>
          </li>
        </ol>
      </section>

      <section id="wallets">
        <h2>Wallets and {CHAIN.name}</h2>
        <p>
          {CHAIN.name} is an Ethereum layer 2 with chain id {CHAIN.id}. Gas is paid in ETH and is usually a small fraction of a cent to a few cents per transaction. Blocks arrive about every tenth of a second, which is why the quest look-back window of one day is {DAY_BLOCKS.toLocaleString("en-US")} blocks.
        </p>
        <p>
          {BRAND.name} never asks for a seed phrase or a private key and never moves your tokens. The only transactions it ever offers are a check-in and a quest stamp on the season log contract; both carry no ETH value and you read them in your wallet before signing.
        </p>
      </section>

      <section id="seasons">
        <h2>Seasons</h2>
        <p>
          The season clock started on {formatUtcDate(SEASON_CLOCK.genesis)} at 00:00 UTC. Every season is {SEASON_CLOCK.seasonDays} days long and the next one starts the day after. Names rotate through {SEASON_NAMES.join(", ")}. The same clock is built into the season log contract, so the site and the chain always agree on which day and which season it is.
        </p>
        <div className="plot">
          <table>
            <thead>
              <tr>
                <th>Day of the season</th>
                <th>Milestone</th>
                <th>What it means</th>
              </tr>
            </thead>
            <tbody>
              {MILESTONES.map((m) => (
                <tr key={m.title}>
                  <td className="n">{m.day + 1}</td>
                  <td>{m.title}</td>
                  <td>{m.text}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note">
          <b>Preview season.</b> No reward pool is funded for this season. If a later season ever has one, its source, its size and its rules are published on the season page before that season starts, and only once the funds really exist.
        </p>
      </section>

      <section id="checkin">
        <h2>Daily check-in</h2>
        <p>
          A check-in is the simplest thing you can do on {BRAND.name}: one per wallet per UTC day. Check in on consecutive days and your streak grows by one each day; miss a day and it starts again at one. Your best streak of the season is kept even after a break, and a new season starts every streak fresh.
        </p>
        <ul>
          <li>Each check-in adds {CHECK_IN_POINTS} points to your season total.</li>
          <li>The day changes at 00:00 UTC, whatever your local time is.</li>
          <li>
            On chain a check-in costs about {GAS.checkIn.toLocaleString("en-US")} gas ({GAS.checkInFirst.toLocaleString("en-US")} for your first one of a season), paid in ETH.
          </li>
        </ul>
      </section>

      <section id="quests">
        <h2>Quests</h2>
        <p>
          There are {QUESTS.length} quests worth {totalQuestPoints()} points in all. Each one has a rule that names exactly what is read. The board reads every value at one block and prints it next to the quest, for example the nonce it saw or the balance it found, so you can check the decision yourself on an explorer.
        </p>
        <div className="plot">
          <table>
            <thead>
              <tr>
                <th>Quest</th>
                <th>Rule</th>
                <th>Checked by</th>
                <th className="n">Points</th>
              </tr>
            </thead>
            <tbody>
              {QUESTS.map((q) => (
                <tr key={q.id}>
                  <td>{q.title}</td>
                  <td>{q.rule}</td>
                  <td>{q.proof === "contract" ? "the contract" : `the site, from ${CHAIN.name}`}</td>
                  <td className="n">{q.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <h3>Stamps</h3>
        <p>
          A cleared quest can be stamped on the season log. Streak quests are <b>contract-checked</b>: the contract reads your best streak of the season and refuses the stamp if it is too short. The other quests are <b>self-claimed</b>: the stamp records the quest and a hash of the values the board read, but the contract cannot check them, so treat such a stamp as the wallet&apos;s own public note.
        </p>
        <p>
          The quest tokens are {USDG.name} ({USDG.symbol}) on {CHAIN.name} (<span className="addr">{USDG.address}</span>) and wrapped ETH (<span className="addr">{WETH}</span>). The transfer quest looks at {USDG.symbol} Transfer events sent from your address in the last day of blocks.
        </p>
      </section>

      <section id="points">
        <h2>Points and levels</h2>
        <p>Your season points are the points of every quest the board currently shows as done plus {CHECK_IN_POINTS} for every check-in. The level follows the points:</p>
        <div className="plot">
          <table>
            <thead>
              <tr>
                <th>Level</th>
                <th className="n">From points</th>
              </tr>
            </thead>
            <tbody>
              {LEVELS.map((l) => (
                <tr key={l.name}>
                  <td>{l.name}</td>
                  <td className="n">{l.min}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="note">
          <b>Labels only.</b> Points and levels are not a token, not a balance and not a claim on anything. They never convert into {BRAND.symbol} or any other asset.
        </p>
      </section>

      <section id="farmboard">
        <h2>Farmboard</h2>
        <p>
          The Farmboard shows your season at a glance: level and progress bar, quests cleared, quest and check-in points, your best streak, and a history with one row per board check (the time, the block and the totals). The history lives in your browser; the check-ins themselves live on chain{deployed ? ", in the season log contract" : " once the contract is deployed"}.
        </p>
      </section>

      <section id="farm">
        <h2>The farm view</h2>
        <p>
          Behind the panels is your farm, drawn in pixel art. The fenced field holds one plot per quest: tilled soil with sprouts while a quest is open, a full crop once it is done. Drag to move around, use the wheel or the + and − buttons to zoom, ⤢ to see the whole farm and ⌂ to return to the quest field. Click a plot to open its quest.
        </p>
      </section>

      <section id="contract">
        <h2>
          Season log contract <span className="tag">{deployed ? "live" : "not deployed yet"}</span>
        </h2>
        <p>
          {CONTRACT_NAMES.log} is a small contract on {CHAIN.name} with no owner, no admin, no fee, no payable function and no upgrade path. Its two settings are fixed when it is deployed: the season clock start ({SEASON_CLOCK.genesis}) and the season length ({SEASON_CLOCK.seasonDays} days). It holds no tokens and does not need {BRAND.symbol}.
        </p>
        <div className="plot">
          <table>
            <thead>
              <tr>
                <th>Function</th>
                <th>What it does</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td>checkIn()</td>
                <td>Records today&apos;s check-in for the caller and updates the streak. Reverts on a second check-in the same UTC day.</td>
              </tr>
              <tr>
                <td>stampStreak(days)</td>
                <td>Stamps a streak quest when the caller&apos;s best streak this season is at least that many days.</td>
              </tr>
              <tr>
                <td>stampSelfClaimed(quest, evidence)</td>
                <td>Records a self-claimed stamp with a hash of the evidence. One per wallet per quest per season.</td>
              </tr>
              <tr>
                <td>farmerOf, totalsOf, liveStreak, checkedInToday</td>
                <td>Free reads used by the site: a wallet&apos;s streak and check-ins, and the season totals.</td>
              </tr>
            </tbody>
          </table>
        </div>
        <p>
          {deployed ? (
            <>
              Address: <a href={explorerAddress(CONTRACTS.log)}>{CONTRACTS.log}</a>.
            </>
          ) : (
            "The address is published here once the contract is deployed."
          )}{" "}
          Anyone can check that the deployed code is exactly this repository&apos;s build with the verify-deployment script in the source.
        </p>
      </section>

      <section id="practice">
        <h2>Practice mode</h2>
        <p>
          {deployed
            ? "The season log is live, so check-ins and stamps are real transactions. Practice mode is only used if the site is built without a contract address: the buttons then"
            : "Until the season log is deployed, the check-in and stamp buttons run in practice mode. They"}{" "}
          follow the same rules as the contract (same clock, same streak logic) but keep everything in your browser, and nothing is sent to {CHAIN.name}. Quest checks are not practice: they always read the real chain.
        </p>
      </section>

      <section id="data">
        <h2>Live data and sources</h2>
        <ul>
          <li>Blocks, gas price, block time and transactions per block: public {CHAIN.name} RPC endpoints, read every few seconds.</li>
          <li>ETH / USD: the Chainlink ETH / USD feed on {CHAIN.name} (<span className="addr">{ETH_USD_FEED}</span>), read on chain.</li>
          <li>{BRAND.symbol} after launch: name, symbol, decimals and supply read from the token contract; holders from Blockscout; price and pool liquidity from GeckoTerminal.</li>
          <li>Wallet quests: nonce, ETH balance, token balances and transfer logs read at one block through this site&apos;s rate-limited relay.</li>
        </ul>
        <p>When a source does not answer, the site shows a dash. It never fills a gap with an estimate.</p>
      </section>

      <section id="token">
        <h2>{BRAND.symbol}</h2>
        <p>
          {BRAND.symbol} is the {BRAND.name} token on {CHAIN.name}. {TOKEN.isLive ? <>Its contract address is <span className="addr">{BRAND.ca}</span>.</> : "It has not launched yet; the contract address is published on the token page first."} It is planned to launch on {LAUNCHPAD.name}, the launchpad on {CHAIN.name}; the buy buttons open the launchpad until the address is published, then the token&apos;s own page there.
        </p>
        <p>
          <Link href="/token" className="btn">
            Token page
          </Link>
        </p>
      </section>

      <section id="planned">
        <h2>
          Planned, not live <span className="tag">planned</span>
        </h2>
        <div className="cols">
          <div>
            <h4>Funded reward pools</h4>
            <p>Season rewards only once a pool is really funded, with its source and rules published before the season.</p>
          </div>
          <div>
            <h4>Partner campaigns</h4>
            <p>Quests written with {CHAIN.name} projects, using the same public rule format.</p>
          </div>
          <div>
            <h4>{BRAND.symbol} utility</h4>
            <p>Access to selected features, paying for campaign services and platform benefits that are backed by a working product.</p>
          </div>
        </div>
        <p>None of these exists today. They are listed so you know what is being worked toward, not as a promise of a date or an outcome.</p>
      </section>

      <section id="risks">
        <h2>Risks and limits</h2>
        <ul>
          <li>Transactions cannot be undone. Read every request in your wallet before you sign it.</li>
          <li>Smart contracts can contain bugs, however small and well tested they are.</li>
          <li>Self-claimed stamps are not proof; only contract-checked stamps are verified on chain.</li>
          <li>Quest checks depend on public RPC endpoints; when they are slow or down, a quest shows as not checked rather than failed.</li>
          <li>{BRAND.symbol} can lose most or all of its value. Nothing on this site is financial advice.</li>
        </ul>
      </section>

      <section id="privacy">
        <h2>Your data</h2>
        <p>
          {BRAND.name} sets no cookies and runs no analytics or ads. Your browser keeps your wallet choice, practice check-ins and Farmboard history in its own storage; clearing site data removes them. Your wallet address is public on {CHAIN.name} anyway; the site sends it only to its own relay and to the RPC endpoints to read the chain. See <Link href="/privacy">Privacy</Link> and <Link href="/cookies">Storage</Link>.
        </p>
      </section>

      <section id="faq">
        <h2>FAQ</h2>
        <dl className="faq">
          {FAQ.map((f) => (
            <div key={f.q}>
              <dt>{f.q}</dt>
              <dd>{f.a}</dd>
            </div>
          ))}
        </dl>
      </section>
    </DocShell>
  );
}
