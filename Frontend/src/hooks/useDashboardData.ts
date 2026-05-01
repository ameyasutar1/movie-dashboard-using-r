import { useQuery } from "@tanstack/react-query";
import Papa from "papaparse";
import type { DashboardData, Movie, Person } from "@/lib/types";

const splitPipe = (v: string | undefined): string[] =>
  !v || v === "N/A"
    ? []
    : v.split("|").map((s) => s.trim()).filter(Boolean);

async function fetchCsv<T>(url: string): Promise<T[]> {
  const res = await fetch(url);
  const text = await res.text();
  const { data } = Papa.parse<Record<string, string>>(text, {
    header: true,
    skipEmptyLines: true,
  });
  return data as unknown as T[];
}

function parseMovies(rows: Record<string, string>[]): Movie[] {
  return rows
    .filter((r) => r.imdbId)
    .map((r) => ({
      imdbId: r.imdbId,
      title: r.title,
      releaseYear: Number(r.releaseYear) || 0,
      releaseDate: r.releaseDate,
      genres: splitPipe(r.genre),
      writers: splitPipe(r.writers),
      actors: splitPipe(r.actors),
      directors: splitPipe(r.directors),
      sequel: Number(r.sequel) || 0,
      hitFlop: Number(r.hitFlop) || 0,
    }));
}

function parsePerson(
  rows: Record<string, string>[],
  idKey: string,
  nameKey: string,
): Person[] {
  return rows
    .filter((r) => r[idKey])
    .map((r) => ({
      id: r[idKey],
      name: r[nameKey],
      movieCount: Number(r.movieCount) || 0,
      ratingSum: Number(r.ratingSum) || 0,
      normalizedMovieRank: Number(r.normalizedMovieRank) || 0,
      googleHits: Number(r.googleHits) || 0,
      normalizedGoogleRank: Number(r.normalizedGoogleRank) || 0,
      normalizedRating: Number(r.normalizedRating) || 0,
    }));
}

export function useDashboardData() {
  return useQuery<DashboardData>({
    queryKey: ["bollywood-data"],
    staleTime: Infinity,
    queryFn: async () => {
      const [moviesRaw, actorsRaw, directorsRaw] = await Promise.all([
        fetchCsv<Record<string, string>>("/data/movies.csv"),
        fetchCsv<Record<string, string>>("/data/actors.csv"),
        fetchCsv<Record<string, string>>("/data/directors.csv"),
      ]);
      return {
        movies: parseMovies(moviesRaw),
        actors: parsePerson(actorsRaw, "actorId", "actorName"),
        directors: parsePerson(directorsRaw, "directorId", "directorName"),
      };
    },
  });
}
