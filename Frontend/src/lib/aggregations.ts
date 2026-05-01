import type { Movie, Person } from "./types";

export const median = (arr: number[]): number => {
  if (!arr.length) return 0;
  const s = [...arr].sort((a, b) => a - b);
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

export const mean = (arr: number[]): number =>
  arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0;

export interface YearBucket {
  year: number;
  count: number;
  avgScore: number;
}

export function moviesPerYear(movies: Movie[]): YearBucket[] {
  const map = new Map<number, Movie[]>();
  movies.forEach((m) => {
    if (!m.releaseYear) return;
    if (!map.has(m.releaseYear)) map.set(m.releaseYear, []);
    map.get(m.releaseYear)!.push(m);
  });
  return [...map.entries()]
    .map(([year, list]) => ({
      year,
      count: list.length,
      avgScore: mean(list.map((m) => m.hitFlop)),
    }))
    .sort((a, b) => a.year - b.year);
}

export interface SequelBucket {
  label: string;
  count: number;
  median: number;
  mean: number;
}

export function sequelComparison(movies: Movie[]): SequelBucket[] {
  // raw sequel column: 0 = no, 1 = yes (other ints are noise — bucket as Other)
  const buckets: Record<string, Movie[]> = { "Original": [], "Sequel": [], "Other": [] };
  movies.forEach((m) => {
    if (m.sequel === 0) buckets["Original"].push(m);
    else if (m.sequel === 1) buckets["Sequel"].push(m);
    else buckets["Other"].push(m);
  });
  return Object.entries(buckets)
    .filter(([, list]) => list.length)
    .map(([label, list]) => ({
      label,
      count: list.length,
      median: median(list.map((m) => m.hitFlop)),
      mean: mean(list.map((m) => m.hitFlop)),
    }));
}

export interface GenreBucket {
  genre: string;
  count: number;
  avgScore: number;
}

export function genreStats(movies: Movie[]): GenreBucket[] {
  const map = new Map<string, number[]>();
  movies.forEach((m) => {
    m.genres.forEach((g) => {
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(m.hitFlop);
    });
  });
  return [...map.entries()]
    .map(([genre, scores]) => ({
      genre,
      count: scores.length,
      avgScore: mean(scores),
    }))
    .sort((a, b) => b.count - a.count);
}

export function genreCombos(movies: Movie[], minCount = 8): GenreBucket[] {
  const map = new Map<string, number[]>();
  movies.forEach((m) => {
    if (!m.genres.length) return;
    const key = [...m.genres].sort().join(" · ");
    if (!map.has(key)) map.set(key, []);
    map.get(key)!.push(m.hitFlop);
  });
  return [...map.entries()]
    .filter(([, s]) => s.length >= minCount)
    .map(([genre, scores]) => ({
      genre,
      count: scores.length,
      avgScore: mean(scores),
    }))
    .sort((a, b) => b.avgScore - a.avgScore);
}

export interface QuadrantPoint {
  name: string;
  rating: number;
  google: number;
  movies: number;
}

export function actorQuadrant(actors: Person[], top = 30): QuadrantPoint[] {
  return [...actors]
    .sort((a, b) => b.normalizedRating - a.normalizedRating)
    .slice(0, top)
    .map((a) => ({
      name: a.name,
      rating: a.normalizedRating,
      google: a.normalizedGoogleRank,
      movies: a.movieCount,
    }));
}

export function topPeople(people: Person[], key: keyof Person, n = 10): Person[] {
  return [...people].sort((a, b) => Number(b[key]) - Number(a[key])).slice(0, n);
}

export interface HeatCell {
  genre: string;
  year: number;
  avg: number;
  count: number;
}

export function genreYearHeatmap(movies: Movie[], topGenres = 8): {
  genres: string[];
  years: number[];
  cells: HeatCell[];
} {
  const top = genreStats(movies).slice(0, topGenres).map((g) => g.genre);
  const yearSet = new Set<number>();
  const map = new Map<string, number[]>();
  movies.forEach((m) => {
    if (!m.releaseYear) return;
    yearSet.add(m.releaseYear);
    m.genres.forEach((g) => {
      if (!top.includes(g)) return;
      const key = `${g}|${m.releaseYear}`;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(m.hitFlop);
    });
  });
  const years = [...yearSet].sort((a, b) => a - b);
  const cells: HeatCell[] = [];
  top.forEach((g) => {
    years.forEach((y) => {
      const arr = map.get(`${g}|${y}`) ?? [];
      cells.push({ genre: g, year: y, avg: mean(arr), count: arr.length });
    });
  });
  return { genres: top, years, cells };
}

export function topWriters(movies: Movie[], n = 12): { name: string; count: number }[] {
  const counts = new Map<string, number>();
  movies.forEach((m) =>
    m.writers.forEach((w) => {
      // strip parenthetical roles
      const clean = w.replace(/\s*\(.*?\)\s*/g, "").trim();
      if (!clean) return;
      counts.set(clean, (counts.get(clean) ?? 0) + 1);
    }),
  );
  return [...counts.entries()]
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, n);
}
