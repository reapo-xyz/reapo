import { BRAND, CHAIN } from "@/config/brand";
import { FarmPage } from "@/components/farm/FarmPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  path: "/checkin",
  title: `Daily check-in | ${BRAND.name}`,
  description: `Check in once per UTC day on ${CHAIN.name} and build a streak. ${BRAND.name} streak quests are verified by the season log contract itself.`,
});

export default function Page() {
  return <FarmPage panel="checkin" />;
}
