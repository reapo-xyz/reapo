import { BRAND, CHAIN } from "@/config/brand";
import { FarmPage } from "@/components/farm/FarmPage";
import { pageMeta } from "@/lib/seo";

export const metadata = pageMeta({
  path: "/quests",
  title: `Quest board | ${BRAND.name}`,
  description: `The ${BRAND.name} quest board: every quest is checked against a wallet's real ${CHAIN.name} activity, with the value and block it was decided on.`,
});

export default function Page() {
  return <FarmPage panel="quests" />;
}
