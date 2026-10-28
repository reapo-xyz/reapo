import { FarmPage } from "@/components/farm/FarmPage";
import { JsonLd } from "@/components/JsonLd";
import { appLd } from "@/lib/seo";

export default function Home() {
  return (
    <>
      <JsonLd data={appLd} />
      <FarmPage welcome />
    </>
  );
}
