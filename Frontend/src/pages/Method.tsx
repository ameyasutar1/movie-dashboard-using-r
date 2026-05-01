const Method = () => (
  <main className="bg-background min-h-screen">
    <section className="bg-primary text-primary-foreground">
      <div className="container-brief py-16 grid grid-cols-1 md:grid-cols-3 gap-10">
        <div>
          <span className="eyebrow text-primary-foreground/60">Method</span>
          <h2 className="serif text-3xl mt-2">How we built this brief.</h2>
        </div>
        <div className="md:col-span-2 space-y-4 text-sm text-primary-foreground/80 leading-relaxed">
          <p>
            Three CSV sources — <span className="mono">BollywoodMovieDetail</span>,{" "}
            <span className="mono">BollywoodActorRanking</span> and{" "}
            <span className="mono">BollywoodDirectorRanking</span> — covering 1,284 Hindi films released between
            2001 and 2014, 301 lead actors and 118 directors. Performance is the dataset's <span className="mono">hitFlop</span>{" "}
            score (1 = flop → 9 = blockbuster). Sequel flag is binary in source. Talent rankings use the
            dataset's pre-computed normalised score (0–10) for film count, Google search hits and critical rating.
          </p>
          <p>
            Aggregations are computed client-side per filter change. Genre hybrids are sorted permutations of the pipe-delimited genre list,
            filtered to combinations with 8+ films to avoid noise. Writer names are stripped of role parentheticals before counting.
          </p>
        </div>
      </div>
    </section>
  </main>
);

export default Method;