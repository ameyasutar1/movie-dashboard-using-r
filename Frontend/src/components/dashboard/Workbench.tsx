import {
  useDeferredValue,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  useCompareData,
  useTalentList,
  useTalentProfile,
  useWorkbenchData,
  useWorkbenchMeta,
  useWorkbenchMovies,
  getMoviesExportUrl,
} from "@/hooks/useWorkbenchApi";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import type {
  TalentSortKey,
  TalentType,
  WorkbenchMeta,
  WorkbenchFilters,
  WorkbenchGenreLab,
  WorkbenchOverview,
} from "@/lib/types";

const NAVY = "hsl(207 88% 15%)";
const GOLD = "hsl(38 47% 46%)";
const RULE = "hsl(210 16% 82%)";
const INK = "hsl(210 45% 12%)";
const MUTED = "hsl(210 14% 38%)";
const tooltipStyle = {
  background: "hsl(0 0% 100%)",
  border: `1px solid ${RULE}`,
  borderRadius: 2,
  fontSize: 12,
  color: INK,
  padding: "8px 10px",
};
const axisStyle = { fontSize: 11, fill: MUTED };
const palette = [
  NAVY,
  GOLD,
  "hsl(4 65% 42%)",
  "hsl(168 60% 30%)",
  "hsl(264 35% 40%)",
];

function formatScore(value: number) {
  return value.toFixed(2);
}

function createDefaultFilters(
  meta: WorkbenchMeta,
): WorkbenchFilters {
  return {
    yearRange: [meta.defaultFilters.yearMin, meta.defaultFilters.yearMax],
    genre: meta.defaultFilters.genre,
    sequelOnly: meta.defaultFilters.sequelOnly,
    scoreRange: [meta.defaultFilters.scoreMin, meta.defaultFilters.scoreMax],
  };
}

export function Workbench() {
  const metaQuery = useWorkbenchMeta();
  const meta = metaQuery.data;

  const [filters, setFilters] = useState<WorkbenchFilters | null>(null);

  useEffect(() => {
    if (!meta || filters) {
      return;
    }

    setFilters(createDefaultFilters(meta));
  }, [meta, filters]);

  const workbenchQuery = useWorkbenchData(filters);
  const workbench = workbenchQuery.data;

  const yearMin = meta?.yearRange.min ?? 2001;
  const yearMax = meta?.yearRange.max ?? 2014;
  const genres = meta?.genres ?? [];
  const totalMovies = meta?.recordCounts.movies ?? 0;
  const loadError = (metaQuery.error ?? workbenchQuery.error) as Error | null;

  const reset = () => {
    if (!meta) {
      return;
    }

    setFilters(createDefaultFilters(meta));
  };

  if (loadError && (!workbench || metaQuery.error)) {
    return (
      <section className="container-brief py-20">
        <p className="text-destructive">
          Failed to load the workbench: {loadError.message}
        </p>
      </section>
    );
  }

  if (
    metaQuery.isLoading ||
    !meta ||
    !filters ||
    (workbenchQuery.isLoading && !workbench)
  ) {
    return (
      <section className="container-brief py-20">
        <p className="text-muted-foreground">Loading workbench…</p>
      </section>
    );
  }

  return (
    <section id="workbench" className="border-b border-border bg-card/40">
      <div className="container-brief py-20">
        <div className="flex items-baseline justify-between flex-wrap gap-4 mb-2">
          <div>
            <span className="eyebrow">Free explore</span>
            <h2 className="serif text-3xl md:text-4xl text-primary font-semibold mt-2">
              The workbench
            </h2>
          </div>
          <div className="text-right">
            <span className="mono text-xs text-muted-foreground block">
              {workbench.overview.kpis.films.toLocaleString()} of{" "}
              {totalMovies.toLocaleString()} films in view
            </span>
            {workbenchQuery.isFetching ? (
              <span className="mono text-[10px] uppercase tracking-wider text-muted-foreground/80">
                Refreshing
              </span>
            ) : null}
          </div>
        </div>
        <div className="gold-rule mb-8" />

        <div className="bg-card border border-border p-5 grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div>
            <Label className="eyebrow mb-3 block">
              Year · {filters.yearRange[0]}–{filters.yearRange[1]}
            </Label>
            <Slider
              min={yearMin}
              max={yearMax}
              step={1}
              value={filters.yearRange}
              onValueChange={(value) =>
                setFilters((current) =>
                  current
                    ? { ...current, yearRange: value as [number, number] }
                    : current,
                )
              }
            />
          </div>
          <div>
            <Label className="eyebrow mb-3 block">Genre</Label>
            <select
              value={filters.genre}
              onChange={(event) =>
                setFilters((current) =>
                  current
                    ? { ...current, genre: event.target.value }
                    : current,
                )
              }
              className="w-full h-9 border border-input bg-background px-3 text-sm rounded-sm"
            >
              <option value="all">All genres</option>
              {genres.map((genre) => (
                <option key={genre} value={genre}>
                  {genre}
                </option>
              ))}
            </select>
          </div>
          <div>
            <Label className="eyebrow mb-3 block">Sequel filter</Label>
            <div className="flex gap-1.5">
              {(["all", "original", "sequel"] as const).map((kind) => (
                <button
                  key={kind}
                  onClick={() =>
                    setFilters((current) =>
                      current
                        ? { ...current, sequelOnly: kind }
                        : current,
                    )
                  }
                  className={`flex-1 px-2 h-9 text-xs uppercase tracking-wider border ${
                    filters.sequelOnly === kind
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-input bg-background text-muted-foreground hover:border-primary"
                  }`}
                >
                  {kind}
                </button>
              ))}
            </div>
          </div>
          <div>
            <Label className="eyebrow mb-3 block">
              Performance · {filters.scoreRange[0]}–{filters.scoreRange[1]}
            </Label>
            <Slider
              min={meta.scoreRange.min}
              max={meta.scoreRange.max}
              step={1}
              value={filters.scoreRange}
              onValueChange={(value) =>
                setFilters((current) =>
                  current
                    ? { ...current, scoreRange: value as [number, number] }
                    : current,
                )
              }
            />
          </div>
          <div className="md:col-span-4 flex justify-end">
            <Button
              variant="ghost"
              size="sm"
              onClick={reset}
              className="text-xs uppercase tracking-wider"
            >
              Reset filters
            </Button>
          </div>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-transparent border-b border-border rounded-none w-full justify-start h-auto p-0 mb-6">
            {[
              ["overview", "Overview"],
              ["talent", "Talent explorer"],
              ["compare", "Compare mode"],
              ["genre", "Genre & sequel lab"],
              ["data", "Data table"],
            ].map(([value, label]) => (
              <TabsTrigger
                key={value}
                value={value}
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-accent data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 py-3 mono uppercase tracking-wider text-xs"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview">
            <OverviewPanel overview={workbench.overview} />
          </TabsContent>
          <TabsContent value="talent">
            <TalentPanel />
          </TabsContent>
          <TabsContent value="compare">
            <ComparePanel />
          </TabsContent>
          <TabsContent value="genre">
            <GenrePanel genreLab={workbench.genreLab} />
          </TabsContent>
          <TabsContent value="data">
            <DataTablePanel filters={filters} />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}

function OverviewPanel({ overview }: { overview: WorkbenchOverview }) {
  const kpis = [
    { label: "Films", value: overview.kpis.films.toLocaleString() },
    { label: "Avg score", value: formatScore(overview.kpis.avgScore) },
    { label: "Hits (≥6)", value: overview.kpis.hits.toLocaleString() },
    {
      label: "Hit rate",
      value: overview.kpis.films
        ? `${Math.round(overview.kpis.hitRatePercent)}%`
        : "—",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border border border-border">
        {kpis.map((kpi) => (
          <div key={kpi.label} className="kpi-tile border-0">
            <span className="eyebrow">{kpi.label}</span>
            <span className="serif text-2xl text-primary font-semibold">
              {kpi.value}
            </span>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Panel title="Films per year (in current selection)">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={overview.yearly}>
              <CartesianGrid
                stroke={RULE}
                strokeDasharray="2 4"
                vertical={false}
              />
              <XAxis dataKey="year" tick={axisStyle} stroke={RULE} />
              <YAxis tick={axisStyle} stroke={RULE} />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill={NAVY} maxBarSize={28} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Avg performance over time">
          <ResponsiveContainer width="100%" height={260}>
            <LineChart data={overview.yearly}>
              <CartesianGrid
                stroke={RULE}
                strokeDasharray="2 4"
                vertical={false}
              />
              <XAxis dataKey="year" tick={axisStyle} stroke={RULE} />
              <YAxis domain={[0, 9]} tick={axisStyle} stroke={RULE} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => Number(value).toFixed(2)}
              />
              <Line
                type="monotone"
                dataKey="avgScore"
                stroke={GOLD}
                strokeWidth={2.5}
                dot={{ r: 3, fill: GOLD }}
              />
            </LineChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Sequel vs Original — median score">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={overview.sequelComparison}>
              <CartesianGrid
                stroke={RULE}
                strokeDasharray="2 4"
                vertical={false}
              />
              <XAxis dataKey="label" tick={axisStyle} stroke={RULE} />
              <YAxis domain={[0, 9]} tick={axisStyle} stroke={RULE} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => Number(value).toFixed(2)}
              />
              <Bar dataKey="median" fill={NAVY} maxBarSize={70} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
        <Panel title="Top genres by volume">
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={overview.genreStats}
              layout="vertical"
              margin={{ left: 70 }}
            >
              <CartesianGrid
                stroke={RULE}
                strokeDasharray="2 4"
                horizontal={false}
              />
              <XAxis type="number" tick={axisStyle} stroke={RULE} />
              <YAxis
                type="category"
                dataKey="genre"
                tick={axisStyle}
                stroke={RULE}
                width={80}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill={NAVY} maxBarSize={18} />
            </BarChart>
          </ResponsiveContainer>
        </Panel>
      </div>
    </div>
  );
}

function Panel({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="bg-card border border-border p-5">
      <h3 className="eyebrow mb-4">{title}</h3>
      {children}
    </div>
  );
}

function TalentPanel() {
  const [tab, setTab] = useState<TalentType>("actors");
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);
  const [sort, setSort] = useState<TalentSortKey>("normalizedRating");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const talentQuery = useTalentList(tab, deferredSearch, sort, 80);
  const profileQuery = useTalentProfile(tab, selectedId);

  const list = talentQuery.data?.items ?? [];
  const selected = useMemo(() => {
    return (
      list.find((person) => person.id === selectedId) ??
      profileQuery.data?.person ??
      null
    );
  }, [list, profileQuery.data?.person, selectedId]);

  const filmography = profileQuery.data?.filmography ?? [];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <div className="flex flex-wrap gap-3 mb-4">
          <div className="flex border border-border">
            {(["actors", "directors"] as const).map((kind) => (
              <button
                key={kind}
                onClick={() => {
                  setTab(kind);
                  setSelectedId(null);
                }}
                className={`px-4 h-9 text-xs uppercase tracking-wider ${
                  tab === kind
                    ? "bg-primary text-primary-foreground"
                    : "bg-card text-muted-foreground"
                }`}
              >
                {kind}
              </button>
            ))}
          </div>
          <Input
            placeholder="Search by name…"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            className="max-w-xs h-9"
          />
          <select
            value={sort}
            onChange={(event) =>
              setSort(event.target.value as TalentSortKey)
            }
            className="h-9 border border-input bg-background px-3 text-sm rounded-sm"
          >
            <option value="normalizedRating">Sort: rating</option>
            <option value="normalizedGoogleRank">Sort: Google buzz</option>
            <option value="movieCount">Sort: film count</option>
          </select>
        </div>
        <div className="bg-card border border-border max-h-[520px] overflow-auto">
          {talentQuery.error && !talentQuery.data ? (
            <p className="p-4 text-sm text-destructive">
              {(talentQuery.error as Error).message}
            </p>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-secondary/50 sticky top-0">
                <tr>
                  <th className="text-left p-3 eyebrow">#</th>
                  <th className="text-left p-3 eyebrow">Name</th>
                  <th className="text-right p-3 eyebrow">Films</th>
                  <th className="text-right p-3 eyebrow">Rating</th>
                  <th className="text-right p-3 eyebrow">Google</th>
                </tr>
              </thead>
              <tbody>
                {list.map((person, index) => (
                  <tr
                    key={person.id}
                    onClick={() => setSelectedId(person.id)}
                    className={`border-t border-border cursor-pointer hover:bg-secondary/40 ${
                      selectedId === person.id ? "bg-secondary" : ""
                    }`}
                  >
                    <td className="p-3 mono text-muted-foreground">
                      {index + 1}
                    </td>
                    <td className="p-3 text-foreground">{person.name}</td>
                    <td className="p-3 text-right mono">{person.movieCount}</td>
                    <td className="p-3 text-right mono text-primary">
                      {formatScore(person.normalizedRating)}
                    </td>
                    <td className="p-3 text-right mono text-muted-foreground">
                      {formatScore(person.normalizedGoogleRank)}
                    </td>
                  </tr>
                ))}
                {!talentQuery.isLoading && list.length === 0 ? (
                  <tr>
                    <td
                      colSpan={5}
                      className="p-4 text-sm text-muted-foreground"
                    >
                      No matching names found.
                    </td>
                  </tr>
                ) : null}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <div className="bg-card border border-border p-5">
        {selected ? (
          <>
            <span className="eyebrow">
              {tab === "actors" ? "Actor" : "Director"} profile
            </span>
            <h3 className="serif text-2xl text-primary mt-1">
              {selected.name}
            </h3>
            <div className="gold-rule my-3" />
            <div className="grid grid-cols-3 gap-3 my-4">
              <Stat label="Films" value={selected.movieCount.toString()} />
              <Stat label="Rating" value={formatScore(selected.normalizedRating)} />
              <Stat
                label="Google"
                value={formatScore(selected.normalizedGoogleRank)}
              />
            </div>
            <span className="eyebrow">
              Filmography ({profileQuery.data?.filmographyCount ?? 0})
            </span>
            <div className="mt-2 max-h-72 overflow-auto divide-y divide-border">
              {profileQuery.isLoading && !profileQuery.data ? (
                <p className="text-sm text-muted-foreground py-3">
                  Loading filmography…
                </p>
              ) : profileQuery.error && !profileQuery.data ? (
                <p className="text-sm text-destructive py-3">
                  {(profileQuery.error as Error).message}
                </p>
              ) : filmography.length === 0 ? (
                <p className="text-sm text-muted-foreground py-3">
                  No matching films in dataset.
                </p>
              ) : (
                filmography.map((movie) => (
                  <div
                    key={movie.imdbId}
                    className="py-2 flex items-baseline justify-between gap-3"
                  >
                    <div>
                      <p className="text-sm text-foreground">{movie.title}</p>
                      <p className="mono text-[10px] text-muted-foreground uppercase tracking-wider">
                        {movie.releaseYear} ·{" "}
                        {movie.genres.slice(0, 2).join(" · ") || "—"}
                      </p>
                    </div>
                    <Badge variant="outline" className="mono text-xs shrink-0">
                      {movie.hitFlop}/9
                    </Badge>
                  </div>
                ))
              )}
            </div>
          </>
        ) : (
          <div className="h-full flex flex-col items-start justify-center text-muted-foreground">
            <span className="eyebrow mb-3">Select a name</span>
            <p className="serif text-xl text-primary leading-snug">
              Click any row to inspect that talent&apos;s profile and full
              filmography.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border p-2">
      <p className="eyebrow text-[9px]">{label}</p>
      <p className="mono text-base text-primary mt-1">{value}</p>
    </div>
  );
}

function ComparePanel() {
  const [mode, setMode] = useState<TalentType>("actors");
  const [picked, setPicked] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const deferredSearch = useDeferredValue(search);

  const poolQuery = useTalentList(mode, deferredSearch, "normalizedRating", 1000);
  const pool = poolQuery.data?.items ?? [];

  useEffect(() => {
    if (!pool.length || picked.length) {
      return;
    }

    setPicked(pool.slice(0, 4).map((person) => person.name));
  }, [picked.length, pool]);

  const compareQuery = useCompareData(mode, picked);
  const compare = compareQuery.data;
  const activeNames = compare?.picked ?? picked;

  const toggle = (name: string) => {
    setPicked((current) =>
      current.includes(name)
        ? current.filter((item) => item !== name)
        : current.length < 5
          ? [...current, name]
          : current,
    );
  };

  const swapMode = (nextMode: TalentType) => {
    setMode(nextMode);
    setSearch("");
    setPicked([]);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-card border border-border p-5">
        <div className="flex justify-between items-center mb-4">
          <h3 className="eyebrow">Radar comparison · normalised 0–10</h3>
          <div className="flex border border-border">
            {(["actors", "directors"] as const).map((kind) => (
              <button
                key={kind}
                onClick={() => swapMode(kind)}
                className={`px-3 h-8 text-[11px] uppercase tracking-wider ${
                  mode === kind
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground"
                }`}
              >
                {kind}
              </button>
            ))}
          </div>
        </div>
        <ResponsiveContainer width="100%" height={420}>
          <RadarChart data={compare?.radarData ?? []} outerRadius="75%">
            <PolarGrid stroke={RULE} />
            <PolarAngleAxis dataKey="axis" tick={{ fontSize: 12, fill: INK }} />
            <PolarRadiusAxis domain={[0, 10]} tick={{ fontSize: 10, fill: MUTED }} />
            {activeNames.map((name, index) => (
              <Radar
                key={name}
                name={name}
                dataKey={name}
                stroke={palette[index % palette.length]}
                fill={palette[index % palette.length]}
                fillOpacity={0.15}
                strokeWidth={2}
              />
            ))}
            <Tooltip
              contentStyle={tooltipStyle}
              formatter={(value: number) => Number(value).toFixed(2)}
            />
            <Legend wrapperStyle={{ fontSize: 12, color: INK }} />
          </RadarChart>
        </ResponsiveContainer>
        {compareQuery.isFetching ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Updating comparison…
          </p>
        ) : null}
        {compareQuery.error && !compare ? (
          <p className="mt-3 text-sm text-destructive">
            {(compareQuery.error as Error).message}
          </p>
        ) : null}
        {!activeNames.length ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Pick at least one name to compare.
          </p>
        ) : null}
      </div>
      <div className="bg-card border border-border p-5">
        <span className="eyebrow">Pick up to 5 to compare</span>
        <Input
          placeholder="Search…"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          className="my-3 h-9"
        />
        <div className="max-h-96 overflow-auto divide-y divide-border">
          {pool.map((person) => (
            <label
              key={person.id}
              className="flex items-center gap-3 py-2 cursor-pointer"
            >
              <input
                type="checkbox"
                checked={picked.includes(person.name)}
                onChange={() => toggle(person.name)}
                className="accent-primary"
              />
              <span className="text-sm text-foreground flex-1">
                {person.name}
              </span>
              <span className="mono text-xs text-muted-foreground">
                {person.normalizedRating.toFixed(1)}
              </span>
            </label>
          ))}
          {!poolQuery.isLoading && pool.length === 0 ? (
            <p className="py-3 text-sm text-muted-foreground">
              No matching names found.
            </p>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function GenrePanel({ genreLab }: { genreLab: WorkbenchGenreLab }) {
  const maxAvg = Math.max(...genreLab.heatmap.cells.map((cell) => cell.avg), 1);

  return (
    <div className="space-y-6">
      <div className="bg-card border border-border p-5">
        <h3 className="eyebrow mb-4">
          Genre × Year — average performance heatmap
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs border-collapse">
            <thead>
              <tr>
                <th className="text-left p-2 mono text-muted-foreground">
                  Genre
                </th>
                {genreLab.heatmap.years.map((year) => (
                  <th
                    key={year}
                    className="p-2 mono text-muted-foreground text-center"
                  >
                    {year}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {genreLab.heatmap.genres.map((genre) => (
                <tr key={genre} className="border-t border-border">
                  <td className="p-2 text-foreground whitespace-nowrap">
                    {genre}
                  </td>
                  {genreLab.heatmap.years.map((year) => {
                    const cell = genreLab.heatmap.cells.find(
                      (item) => item.genre === genre && item.year === year,
                    );
                    const intensity = cell ? cell.avg / maxAvg : 0;

                    return (
                      <td
                        key={year}
                        className="p-2 text-center mono text-[11px]"
                        style={{
                          background:
                            cell && cell.count
                              ? `hsl(207 88% ${Math.max(20, 95 - intensity * 70)}%)`
                              : "transparent",
                          color:
                            intensity > 0.5
                              ? "hsl(39 33% 95%)"
                              : "hsl(210 45% 12%)",
                        }}
                        title={
                          cell
                            ? `${cell.count} films, avg ${cell.avg.toFixed(2)}`
                            : "—"
                        }
                      >
                        {cell && cell.count ? cell.avg.toFixed(1) : "·"}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border p-5">
          <h3 className="eyebrow mb-4">Sequel vs Original delta</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={genreLab.sequelComparison}>
              <CartesianGrid
                stroke={RULE}
                strokeDasharray="2 4"
                vertical={false}
              />
              <XAxis dataKey="label" tick={axisStyle} stroke={RULE} />
              <YAxis domain={[0, 9]} tick={axisStyle} stroke={RULE} />
              <Tooltip
                contentStyle={tooltipStyle}
                formatter={(value: number) => Number(value).toFixed(2)}
              />
              <Legend wrapperStyle={{ fontSize: 11 }} />
              <Bar dataKey="median" fill={NAVY} name="Median" maxBarSize={50} />
              <Bar dataKey="mean" fill={GOLD} name="Mean" maxBarSize={50} />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-card border border-border p-5">
          <h3 className="eyebrow mb-4">Top writers (cleaned, role-stripped)</h3>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart
              data={genreLab.topWriters}
              layout="vertical"
              margin={{ left: 110 }}
            >
              <CartesianGrid
                stroke={RULE}
                strokeDasharray="2 4"
                horizontal={false}
              />
              <XAxis type="number" tick={axisStyle} stroke={RULE} />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ ...axisStyle, fontSize: 10 }}
                stroke={RULE}
                width={120}
              />
              <Tooltip contentStyle={tooltipStyle} />
              <Bar dataKey="count" fill={NAVY} maxBarSize={14} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}

function DataTablePanel({ filters }: { filters: WorkbenchFilters }) {
  const [queryText, setQueryText] = useState("");
  const deferredQueryText = useDeferredValue(queryText);
  const moviesQuery = useWorkbenchMovies(filters, deferredQueryText);
  const movies = moviesQuery.data?.movies;

  const exportCsv = () => {
    const url = getMoviesExportUrl(filters, deferredQueryText);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "bollywood-filtered.csv";
    anchor.click();
  };

  return (
    <div>
      <div className="flex justify-between items-center gap-3 mb-3 flex-wrap">
        <Input
          placeholder="Search title, actor, director, genre…"
          value={queryText}
          onChange={(event) => setQueryText(event.target.value)}
          className="max-w-md h-9"
        />
        <Button
          onClick={exportCsv}
          variant="outline"
          size="sm"
          className="text-xs uppercase tracking-wider"
        >
          Export CSV ({movies?.total ?? 0})
        </Button>
      </div>
      <div className="bg-card border border-border max-h-[600px] overflow-auto">
        {moviesQuery.error && !movies ? (
          <p className="p-4 text-sm text-destructive">
            {(moviesQuery.error as Error).message}
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="bg-secondary/50 sticky top-0">
              <tr>
                <th className="text-left p-3 eyebrow">Title</th>
                <th className="text-left p-3 eyebrow">Year</th>
                <th className="text-left p-3 eyebrow">Genres</th>
                <th className="text-left p-3 eyebrow">Director</th>
                <th className="text-right p-3 eyebrow">Score</th>
                <th className="text-right p-3 eyebrow">Sequel</th>
              </tr>
            </thead>
            <tbody>
              {(movies?.items ?? []).map((movie) => (
                <tr key={movie.imdbId} className="border-t border-border">
                  <td className="p-3 text-foreground">{movie.title}</td>
                  <td className="p-3 mono text-muted-foreground">
                    {movie.releaseYear}
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">
                    {movie.genres.slice(0, 3).join(" · ")}
                  </td>
                  <td className="p-3 text-muted-foreground text-xs">
                    {movie.directors.join(", ")}
                  </td>
                  <td className="p-3 mono text-right text-primary">
                    {movie.hitFlop}
                  </td>
                  <td className="p-3 mono text-right text-muted-foreground">
                    {movie.sequel === 1 ? "Yes" : "—"}
                  </td>
                </tr>
              ))}
              {!moviesQuery.isLoading && (movies?.items.length ?? 0) === 0 ? (
                <tr>
                  <td
                    colSpan={6}
                    className="p-4 text-sm text-muted-foreground"
                  >
                    No matching films found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        )}
        {(movies?.total ?? 0) > (movies?.items.length ?? 0) ? (
          <p className="p-3 text-xs text-muted-foreground border-t border-border">
            Showing first {(movies?.items.length ?? 0).toLocaleString()} of{" "}
            {(movies?.total ?? 0).toLocaleString()} matches. Refine filters or
            export to see all.
          </p>
        ) : null}
      </div>
    </div>
  );
}
