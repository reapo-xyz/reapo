import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { BRAND, CHAIN } from "@/config/brand";
import { DeployPanel } from "@/components/deploy/DeployPanel";
import { DocShell } from "@/components/site/DocShell";
import ART from "@/lib/contracts/artifacts.json";

export const metadata: Metadata = {
  title: "Deploy contracts",
  description: `Owner tool: deploy the ${BRAND.name} contract from your own wallet.`,
  robots: { index: false, follow: false },
};

// Owner tool, local only: on any public host this route is a 404.
const LOCAL_HOST = /^(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

export const dynamic = "force-dynamic";

export default async function DeployPage() {
  const host = (await headers()).get("host") ?? "";
  if (!LOCAL_HOST.test(host)) notFound();
  const c = ART.contracts.ReapoSeasonLog;
  return (
    <DocShell nav={[{ group: "Owner tool", items: [{ id: "deploy", label: "Deploy the season log" }] }]}>
      <header className="hero">
        <h1>Deploy the season log</h1>
        <p>
          ReapoSeasonLog: one transaction, signed in your wallet on {CHAIN.name}. No owner, no fee and no token needed, so it can go live before the token launches. Localhost only; progress is kept in this browser.
        </p>
      </header>
      <section id="deploy">
        <DeployPanel art={{ creation: c.creation, sha256: c.sha256, args: ART.constructorArgs.ReapoSeasonLog as [number, number] }} />
      </section>
    </DocShell>
  );
}
