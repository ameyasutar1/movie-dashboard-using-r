import { Link } from "react-router-dom";
import { Workbench } from "@/components/dashboard/Workbench";

const Index = () => {
  return (
    <main className="bg-background">
      <section className="border-b border-border bg-card">
        <div className="px-6 md:px-10 py-8 flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <span className="eyebrow">Workbench · Live</span>
            <h1 className="serif text-3xl md:text-4xl text-primary mt-2 leading-tight">
              Bollywood Movie Intelligence
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
              Filter, compare and drill into 1,284 Hindi films, 301 actors and 118 directors (2001–2014).
              For the guided narrative, open <Link to="/story" className="text-accent underline underline-offset-2">The Story</Link>.
            </p>
          </div>
          <div className="flex gap-2">
            <Link to="/story" className="mono text-[11px] uppercase tracking-[0.2em] text-primary border border-border px-3 py-2 hover:bg-muted">
              Read the brief →
            </Link>
          </div>
        </div>
      </section>

      <Workbench />
    </main>
  );
};

export default Index;
