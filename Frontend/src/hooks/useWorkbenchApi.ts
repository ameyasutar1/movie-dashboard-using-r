import { useQuery } from "@tanstack/react-query";
import { buildApiUrl, fetchJson } from "@/lib/api";
import type {
  CompareResponse,
  MoviesResponse,
  Person,
  TalentListResponse,
  TalentProfileResponse,
  TalentSortKey,
  TalentType,
  WorkbenchFilters,
  WorkbenchMeta,
  WorkbenchPayload,
} from "@/lib/types";

function buildFilterParams(filters: WorkbenchFilters) {
  return {
    year_min: filters.yearRange[0],
    year_max: filters.yearRange[1],
    genre: filters.genre,
    sequel: filters.sequelOnly,
    score_min: filters.scoreRange[0],
    score_max: filters.scoreRange[1],
  };
}

function normalizePerson(person: Person): Person {
  return {
    ...person,
    movieCount: Number(person.movieCount) || 0,
    ratingSum: Number(person.ratingSum) || 0,
    normalizedMovieRank: Number(person.normalizedMovieRank) || 0,
    googleHits: Number(person.googleHits) || 0,
    normalizedGoogleRank: Number(person.normalizedGoogleRank) || 0,
    normalizedRating: Number(person.normalizedRating) || 0,
  };
}

export function useWorkbenchMeta() {
  return useQuery<WorkbenchMeta>({
    queryKey: ["workbench-api", "meta"],
    staleTime: Infinity,
    queryFn: () => fetchJson<WorkbenchMeta>("/api/meta"),
  });
}

export function useWorkbenchData(filters: WorkbenchFilters | null) {
  return useQuery<WorkbenchPayload>({
    queryKey: ["workbench-api", "summary", filters],
    enabled: Boolean(filters),
    placeholderData: (previousData) => previousData,
    queryFn: () =>
      fetchJson<WorkbenchPayload>("/api/workbench", buildFilterParams(filters!)),
  });
}

export function useWorkbenchMovies(
  filters: WorkbenchFilters | null,
  queryText: string,
) {
  return useQuery<MoviesResponse>({
    queryKey: ["workbench-api", "movies", filters, queryText],
    enabled: Boolean(filters),
    placeholderData: (previousData) => previousData,
    queryFn: () =>
      fetchJson<MoviesResponse>("/api/movies", {
        ...buildFilterParams(filters!),
        q: queryText,
        limit: 200,
      }),
  });
}

export function useTalentList(
  type: TalentType,
  search: string,
  sort: TalentSortKey,
  limit = 80,
) {
  return useQuery<TalentListResponse>({
    queryKey: ["workbench-api", "talent", type, search, sort, limit],
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      const response = await fetchJson<TalentListResponse>("/api/talent", {
        type,
        search,
        sort,
        limit,
      });

      return {
        ...response,
        items: response.items.map(normalizePerson),
      };
    },
  });
}

export function useTalentProfile(type: TalentType, id: string | null) {
  return useQuery<TalentProfileResponse>({
    queryKey: ["workbench-api", "talent-profile", type, id],
    enabled: Boolean(id),
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      const response = await fetchJson<TalentProfileResponse>(
        "/api/talent/profile",
        {
          type,
          id,
        },
      );

      return {
        ...response,
        person: normalizePerson(response.person),
      };
    },
  });
}

export function useCompareData(type: TalentType, names: string[]) {
  return useQuery<CompareResponse>({
    queryKey: ["workbench-api", "compare", type, names],
    enabled: names.length > 0,
    placeholderData: (previousData) => previousData,
    queryFn: async () => {
      const response = await fetchJson<CompareResponse>("/api/compare", {
        type,
        names: names.join(","),
      });

      return {
        ...response,
        people: response.people.map(normalizePerson),
      };
    },
  });
}

export function getMoviesExportUrl(
  filters: WorkbenchFilters,
  queryText: string,
) {
  return buildApiUrl("/api/movies/export", {
    ...buildFilterParams(filters),
    q: queryText,
  });
}
