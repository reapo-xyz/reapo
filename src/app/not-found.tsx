import Link from "next/link";
import { DocShell } from "@/components/site/DocShell";

export default function NotFound() {
  return (
    <DocShell nav={[{ group: "Lost?", items: [{ id: "lost", label: "Back on the path" }] }]}>
      <header className="hero">
        <h1>This field is empty</h1>
        <p>Nothing grows at this address. The farm and the quest board are one click away.</p>
      </header>
      <section id="lost">
        <p className="btns">
          <Link href="/" className="btn primary">
            Back to the farm
          </Link>
          <Link href="/docs" className="btn">
            Season guide
          </Link>
        </p>
      </section>
    </DocShell>
  );
}
