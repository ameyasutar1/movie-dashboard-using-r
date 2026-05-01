import { useDashboardData } from "@/hooks/useDashboardData";

const fmt = (n: number) => n.toLocaleString("en-IN");

export function Cover() {
  const { data } = useDashboardData();
  const movies = data?.movies ?? [];
  const years = new Set(movies.map((m) => m.releaseYear).filter(Boolean));
  const genres = new Set(movies.flatMap((m) => m.genres));
  const sequels = movies.filter((m) => m.sequel === 1).length;
  const sequelPct = movies.length ? Math.round((sequels / movies.length) * 100) : 0;

  const tiles = [
    { label: "Films analysed", value: fmt(movies.length) },
    { label: "Years covered", value: years.size ? `${Math.min(...years)}–${Math.max(...years)}` : "—" },
    { label: "Distinct genres", value: fmt(genres.size) },
    { label: "Lead actors tracked", value: fmt(data?.actors.length ?? 0) },
    { label: "Directors tracked", value: fmt(data?.directors.length ?? 0) },
    { label: "Sequel share", value: `${sequelPct}%` },
  ];

  return (
    <section className="border-b border-border bg-card">
      <div className="container-brief py-16 md:py-24">
        <div className="flex items-center gap-3 mb-8">
          <div className="h-2 w-2 rounded-full bg-accent" />
          <span className="eyebrow">Industry brief · Hindi cinema · 2001–2014</span>
        </div>
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-semibold leading-[1.05] text-primary max-w-4xl">
          Bollywood Movie Intelligence
        </h1>
        <p className="mt-6 max-w-2xl text-base md:text-lg text-muted-foreground leading-relaxed">
          A consulting-style read on fourteen years of Hindi cinema — output, talent, sequels and genre alpha — distilled
          from 1,284 film records, 301 lead actors and 118 directors.
        </p>
        <div className="gold-rule mt-8" />
        <div className="mt-10 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-px bg-border border border-border">
          {tiles.map((t) => (
            <div key={t.label} className="kpi-tile border-0">
              <span className="eyebrow">{t.label}</span>
              <span className="serif text-3xl md:text-4xl text-primary font-semibold">{t.value}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
