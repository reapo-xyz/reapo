import { BRAND, CHAIN } from "@/config/brand";
import { FarmPage } from "@/components/farm/FarmPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  path: "/farmboard",
  title: `Farmboard | ${BRAND.name}`,
  description: `Your ${BRAND.name} Farmboard: season points, level, streaks and check history, computed from quests on ${CHAIN.name}. Labels only, never tokens.`,
});

export default function Page() {
  return <FarmPage panel="farmboard" />;
}
