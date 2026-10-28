import { BRAND, CHAIN } from "@/config/brand";
import { FarmPage } from "@/components/farm/FarmPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  path: "/token",
  title: `${BRAND.name} (${BRAND.symbol}) Token`,
  description: `${BRAND.name} token ${BRAND.symbol} on ${CHAIN.name}: contract address, launch venue, live supply and price once launched, and live ${CHAIN.name} network data.`,
});

export default function Page() {
  return <FarmPage panel="token" />;
}
