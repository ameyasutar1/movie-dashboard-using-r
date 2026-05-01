import { useMemo } from "react";
import { useDashboardData } from "@/hooks/useDashboardData";
import {
  actorQuadrant,
  genreCombos,
  moviesPerYear,
  sequelComparison,
  topPeople,
} from "@/lib/aggregations";
import { Cover } from "@/components/dashboard/Cover";
import { InsightSection } from "@/components/dashboard/InsightSection";
import {
  DirectorBar,
  GenreScatter,
  SequelChart,
  StarQuadrant,
  VolumeVsScoreChart,
} from "@/components/dashboard/charts";
import { Link } from "react-router-dom";

const Story = () => {
  const { data, isLoading, error } = useDashboardData();

  const insights = useMemo(() => {
    if (!data) return null;
    return {
      yearly: moviesPerYear(data.movies),
      sequels: sequelComparison(data.movies),
      genreCombos: genreCombos(data.movies, 8).slice(0, 18),
      stars: actorQuadrant(data.actors, 25),
      directors: topPeople(data.directors, "normalizedRating", 10),
    };
  }, [data]);

  if (error) {
    return (
      <main className="container-brief py-32 text-center">
        <p className="text-destructive">Failed to load data: {(error as Error).message}</p>
      </main>
    );
  }
  if (isLoading || !insights) {
    return (
      <main className="container-brief py-32">
        <span className="eyebrow">Bollywood Movie Intelligence</span>
        <h1 className="serif text-4xl text-primary mt-3">Loading the brief…</h1>
        <div className="mt-8 h-1 w-32 bg-accent animate-pulse" />
      </main>
    );
  }

  return (
    <main className="bg-background">
      <Cover />

      <section className="border-b border-border">
        <div className="container-brief py-16">
          <div className="grid grid-cols-12 gap-6 md:gap-10">
            <div className="col-span-12 md:col-span-5">
              <span className="eyebrow">Executive summary</span>
              <h2 className="serif text-3xl md:text-4xl text-primary mt-2 leading-tight">
                Five things worth knowing before you greenlight your next project.
              </h2>
            </div>
            <ol className="col-span-12 md:col-span-7 space-y-5">
              {[
                "Output nearly doubled in 14 years; quality flatlined.",
                "Sequels deliver a 3–5× lift on median performance.",
                "Genre alpha sits in hybrids, not single-label dramas.",
                "Star fame and critical rating do not move together.",
                "Top-rated directors carry the industry, but they're a thin bench.",
              ].map((line, i) => (
                <li key={i} className="flex gap-4 items-baseline border-b border-border pb-4">
                  <span className="mono text-accent text-sm shrink-0">0{i + 1}</span>
                  <p className="text-base md:text-lg text-foreground leading-relaxed">{line}</p>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      <InsightSection
        index="01"
        total="05"
        eyebrow="Industry output · 2001–2014"
        headline="The industry is scaling, but quality is standing still."
        lede="Annual film output rose from roughly 60 to 115 titles, yet the average hit-flop score has barely moved off the floor of 2.0. Volume is not buying quality."
        chart={<VolumeVsScoreChart data={insights.yearly} />}
        takeaway="More films, same quality. Capital is funding throughput, not creative differentiation."
      />

      <InsightSection
        index="02"
        total="05"
        eyebrow="Sequel premium"
        headline="Sequels punch far above their weight."
        lede="Sequels are rare in this dataset, but where they exist their median performance score is roughly 5× that of original releases — the single largest structural lift we observe."
        chart={<SequelChart data={insights.sequels} />}
        takeaway="Franchise IP is the highest-conviction bet in Hindi cinema. Originals carry concept risk; sequels carry brand."
        reverse
      />

      <InsightSection
        index="03"
        total="05"
        eyebrow="Genre alpha"
        headline="Hybrid genres outperform single-label dramas."
        lede="Drama and Comedy dominate volume, but hybrid combinations — Action·Sci-Fi, Adventure·Drama·Musical and Romance·Musical pairings — sit consistently above the industry-average performance line."
        chart={<GenreScatter data={insights.genreCombos} />}
        takeaway="Where you compete matters more than how much. The crowded centre underperforms the edges."
      />

      <InsightSection
        index="04"
        total="05"
        eyebrow="Star economics"
        headline="Star power and critical rating do not move together."
        lede="Mapping the top 25 leads on Google search rank against critical rating reveals a sparsely-populated top-right quadrant. A few stars (gold) dominate both axes; volume-leaders sit mid-table."
        chart={<StarQuadrant data={insights.stars} />}
        takeaway="Casting on Google buzz alone leaves rating value on the table. Pair-bet visibility with critical pedigree."
        reverse
      />

      <InsightSection
        index="05"
        total="05"
        eyebrow="Director concentration risk"
        headline="The quality engine is a thin bench."
        lede="The ten highest-rated directors are dominated by names with fewer than five releases each. The industry's quality is concentrated in a small group of low-frequency creators."
        chart={<DirectorBar data={insights.directors} />}
        takeaway="Director risk is real. Lock-in calendars early — supply is the binding constraint, not demand."
      />

      <section className="bg-primary text-primary-foreground">
        <div className="container-brief py-12 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <span className="eyebrow text-primary-foreground/60">Next</span>
            <h2 className="serif text-2xl mt-2">Explore the data yourself.</h2>
          </div>
          <Link to="/" className="mono text-xs uppercase tracking-[0.2em] text-accent hover:underline">
            Open the workbench →
          </Link>
        </div>
      </section>
    </main>
  );
};

export default Story;