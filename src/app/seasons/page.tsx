import { BRAND, CHAIN } from "@/config/brand";
import { FarmPage } from "@/components/farm/FarmPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  path: "/seasons",
  title: `Seasons | ${BRAND.name}`,
  description: `How ${BRAND.name} seasons work on ${CHAIN.name}: 28-day seasons, daily check-ins, streaks and milestones. Preview season, no reward pool is funded.`,
});

export default function Page() {
  return <FarmPage panel="season" />;
}
