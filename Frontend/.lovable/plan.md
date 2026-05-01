
# Bollywood Movie Intelligence — Consulting Dashboard

A single-page, McKinsey-style scrollytelling dashboard that walks the viewer through 5 boardroom-ready insights, then opens into a free-explore workbench. Built from your three CSVs (1,284 movies, 301 actors, 118 directors, 2001–2014).

## Visual identity

- **Palette**: deep navy `#052D4A` primary, ivory `#F7F4EC` background, accent gold `#B08D3D`, muted slate text. Single accent rule — no rainbow charts.
- **Type**: Playfair Display (serif) for headlines and big numbers; Inter for body and chart labels.
- **Layout**: Z-pattern per section — eyebrow label top-left → headline top-right → supporting chart bottom-left → "So what" takeaway bottom-right. Generous whitespace, hairline rules, small-caps section markers ("Insight 01 / 05").

## Information architecture (single page, scroll-driven)

```
┌─ Cover ──────────────────────────────────────────┐
│  Bollywood Movie Intelligence                    │
│  2001–2014  ·  1,284 films  ·  301 stars         │
│  6 KPI tiles (movies, years, genres, actors,     │
│  directors, sequel share)                        │
└──────────────────────────────────────────────────┘
┌─ Executive Summary (Z-layout, 5 bullets)        ┐
└──────────────────────────────────────────────────┘
┌─ Insight 01 → 05 (one full viewport each)       ┐
└──────────────────────────────────────────────────┘
┌─ Free-Explore Workbench (filters + 4 panels)    ┐
└──────────────────────────────────────────────────┘
┌─ Methodology & data dictionary                  ┐
└──────────────────────────────────────────────────┘
```

## The 5 insights (each = one storytelling section)

1. **Industry is scaling, but quality isn't.** Output rose from ~60 films (2001) to ~115 (2010). Average hit/flop score stays flat around 2.0. → *Dual-axis line: yearly volume vs. avg performance.*
2. **Sequels punch above their weight.** Sequel median performance ≈ 5.0 vs. non-sequel ≈ 1.0 — a 5× lift. → *Box plot + count annotation.*
3. **Genre alpha sits in hybrids.** Single-genre Drama dominates volume but Action·Sci-Fi and Musical hybrids top the average score chart. → *Volume vs. avg-score scatter, top 15 genres labelled.*
4. **Star power ≠ Google power.** Aamir Khan tops normalized rating despite lower Google hits than Salman; volume-leaders (Akshay, Ajay) sit mid-table on rating. → *Quadrant chart: Google-rank x Rating-rank, size = movie count.*
5. **Director concentration risk.** Top 5 directors by rating (Hirani, Farah Khan, Karan Johar…) average <5 films each — the quality engine is thin. → *Bar chart of top 10 directors by normalized rating with movie-count overlay.*

Each insight slide carries: eyebrow ("Insight 02 / 05"), serif headline, one chart (Recharts), 2-line "So what" takeaway in gold rule-box, and a "drill in →" link that scrolls to the workbench pre-filtered.

## Free-Explore Workbench

A tabbed panel below the narrative:

- **Overview tab** — filters (Year range slider, Genre multi-select, Sequel toggle, Hit/Flop range). Live KPIs + 4 charts react.
- **Talent Explorer tab** — searchable actor & director tables (sortable: rating, Google, movies). Click a name → side-panel with their filmography from `BollywoodMovieDetail.csv`.
- **Compare Mode tab** — pick 2–4 actors or directors → radar chart on movieCount / normalizedRating / normalizedGoogleRank + side-by-side film lists.
- **Genre & Sequel Lab tab** — heatmap of genre × year (avg hitFlop), sequel-vs-original delta bar, top writers leaderboard.
- **Data Table tab** — full movie table with global search + CSV export.

## Technical notes

- **Stack**: React + Vite + TypeScript + Tailwind (existing). Charts via `recharts`. Scroll reveals via Intersection Observer + Tailwind `animate-fade-in`.
- **Data pipeline**: copy the 3 CSVs into `public/data/`, parse once on load with `papaparse`, normalize into typed React Query caches (`movies`, `actors`, `directors`). Derived aggregations (yearly counts, genre splits, sequel medians) memoized in a `useDashboardData` hook.
- **Design tokens**: extend `index.css` with navy/ivory/gold HSL tokens + serif/sans font families loaded via Google Fonts in `index.html`. All chart colors pulled from tokens — no hard-coded hex in components.
- **Components**: `KpiTile`, `InsightSection` (eyebrow + headline + chart slot + takeaway), `FilterBar`, `TalentTable`, `CompareRadar`, `GenreHeatmap`, `MovieTable`.
- **Responsive**: Z-layout collapses to single column under 900px; workbench tabs become an accordion on mobile.
- **Performance**: CSVs parsed in a Web Worker if >250ms; otherwise main thread. Tables virtualized with `@tanstack/react-virtual` if needed.

## Out of scope (this iteration)

- PPT/PDF export, R Shiny mirror, login, persistence. These can be added in a follow-up.

## Build order

1. Design tokens, fonts, layout shell, CSV ingest hook.
2. Cover + KPI tiles + executive summary.
3. The 5 insight sections with charts and takeaways.
4. Free-explore workbench (Overview → Talent → Compare → Genre Lab → Data Table).
5. Methodology footer + polish pass (animations, responsive, empty states).
