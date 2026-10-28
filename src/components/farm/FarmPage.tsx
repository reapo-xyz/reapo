import { GameShell, type PanelId } from "@/components/farm/GameShell";
import { SeasonProvider } from "@/components/farm/SeasonProvider";

/** A farm route: the game shell with one panel open (server-rendered, so its text is in the first HTML). */
export function FarmPage({ panel, welcome = false }: { panel?: PanelId; welcome?: boolean }) {
  return (
    <SeasonProvider>
      <GameShell initialPanel={panel ?? null} welcome={welcome} />
    </SeasonProvider>
  );
}
