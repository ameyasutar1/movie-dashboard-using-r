#!/usr/bin/env python3
"""Smoke-test the Bollywood R workbench API.

This script can either:
1. Start the local R API automatically and test it, or
2. Test an already running API by passing --base-url.

It validates:
- endpoint availability
- basic response shapes
- record counts against the CSV source files
- filtered movie counts
- text search behavior
- talent explorer responses
- talent profile filmography counts
- compare endpoint values
"""

from __future__ import annotations

import argparse
import csv
import io
import json
import math
import socket
import subprocess
import sys
import time
from dataclasses import dataclass
from pathlib import Path
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.parse import urlencode
from urllib.request import Request, urlopen


class SmokeTestFailure(Exception):
    """Raised when a smoke-test assertion fails."""


@dataclass
class ReferenceData:
    movies: list[dict[str, Any]]
    actors: dict[str, dict[str, Any]]
    directors: dict[str, dict[str, Any]]
    genres: set[str]
    year_min: int
    year_max: int
    max_actor_movie_count: int
    max_director_movie_count: int


def split_pipe(value: str | None) -> list[str]:
    text = (value or "").strip()
    if not text or text == "N/A":
        return []
    return [part.strip() for part in text.split("|") if part.strip()]


def to_int(value: str | None, default: int = 0) -> int:
    try:
        return int(round(float(value or default)))
    except (TypeError, ValueError):
        return default


def to_float(value: str | None, default: float = 0.0) -> float:
    try:
        return float(value or default)
    except (TypeError, ValueError):
        return default


def load_reference_data(data_dir: Path) -> ReferenceData:
    movies_path = data_dir / "BollywoodMovieDetail.csv"
    actors_path = data_dir / "BollywoodActorRanking.csv"
    directors_path = data_dir / "BollywoodDirectorRanking.csv"

    movies: list[dict[str, Any]] = []
    genres: set[str] = set()

    with movies_path.open(newline="", encoding="utf-8") as handle:
        for row in csv.DictReader(handle):
            movie = {
                "imdbId": row["imdbId"],
                "title": row["title"],
                "releaseYear": to_int(row.get("releaseYear")),
                "releaseDate": row.get("releaseDate", ""),
                "genres": split_pipe(row.get("genre")),
                "writers": split_pipe(row.get("writers")),
                "actors": split_pipe(row.get("actors")),
                "directors": split_pipe(row.get("directors")),
                "sequel": to_int(row.get("sequel")),
                "hitFlop": to_float(row.get("hitFlop")),
            }
            genres.update(movie["genres"])
            movies.append(movie)

    def load_people(path: Path, id_key: str, name_key: str) -> dict[str, dict[str, Any]]:
        people: dict[str, dict[str, Any]] = {}
        with path.open(newline="", encoding="utf-8") as handle:
            for row in csv.DictReader(handle):
                record = {
                    "id": row[id_key],
                    "name": row[name_key],
                    "movieCount": to_int(row.get("movieCount")),
                    "ratingSum": to_float(row.get("ratingSum")),
                    "normalizedMovieRank": to_float(row.get("normalizedMovieRank")),
                    "googleHits": to_float(row.get("googleHits")),
                    "normalizedGoogleRank": to_float(row.get("normalizedGoogleRank")),
                    "normalizedRating": to_float(row.get("normalizedRating")),
                }
                people[record["name"]] = record
        return people

    actors = load_people(actors_path, "actorId", "actorName")
    directors = load_people(directors_path, "directorId", "directorName")

    years = [movie["releaseYear"] for movie in movies if movie["releaseYear"] > 0]

    return ReferenceData(
        movies=movies,
        actors=actors,
        directors=directors,
        genres=genres,
        year_min=min(years),
        year_max=max(years),
        max_actor_movie_count=max(person["movieCount"] for person in actors.values()),
        max_director_movie_count=max(person["movieCount"] for person in directors.values()),
    )


def request_json(base_url: str, path: str, params: dict[str, Any] | None = None) -> Any:
    url = build_url(base_url, path, params)
    request = Request(url, headers={"Accept": "application/json"})
    with urlopen(request, timeout=10) as response:
        return json.loads(response.read().decode("utf-8"))


def request_text(base_url: str, path: str, params: dict[str, Any] | None = None) -> str:
    url = build_url(base_url, path, params)
    request = Request(url)
    with urlopen(request, timeout=10) as response:
        return response.read().decode("utf-8")


def build_url(base_url: str, path: str, params: dict[str, Any] | None = None) -> str:
    base = base_url.rstrip("/")
    url = f"{base}{path}"
    if params:
        query = urlencode(
            {
                key: value
                for key, value in params.items()
                if value is not None and value != ""
            }
        )
        if query:
            url = f"{url}?{query}"
    return url


def find_free_port() -> int:
    with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as sock:
        sock.bind(("127.0.0.1", 0))
        return sock.getsockname()[1]


def start_server(backend_dir: Path, data_dir: Path, port: int) -> subprocess.Popen[str]:
    return subprocess.Popen(
        ["Rscript", "server.R", "127.0.0.1", str(port), str(data_dir)],
        cwd=backend_dir,
        stdout=subprocess.PIPE,
        stderr=subprocess.STDOUT,
        text=True,
    )


def wait_for_server(base_url: str, process: subprocess.Popen[str], timeout: float = 20.0) -> None:
    deadline = time.time() + timeout
    output_lines: list[str] = []

    while time.time() < deadline:
        if process.poll() is not None:
            if process.stdout:
                output_lines.extend(process.stdout.readlines())
            raise SmokeTestFailure(
                "R API server exited before becoming ready.\n"
                + "".join(output_lines)
            )

        try:
            payload = request_json(base_url, "/health")
            if payload.get("status") == "ok":
                return
        except (OSError, URLError, HTTPError, json.JSONDecodeError):
            time.sleep(0.25)

    if process.stdout:
        output_lines.extend(process.stdout.readlines())
    raise SmokeTestFailure(
        "Timed out waiting for the R API server to become ready.\n"
        + "".join(output_lines)
    )


def stop_server(process: subprocess.Popen[str] | None) -> None:
    if process is None or process.poll() is not None:
        return

    process.terminate()
    try:
        process.wait(timeout=5)
    except subprocess.TimeoutExpired:
        process.kill()
        process.wait(timeout=5)


def expect(condition: bool, message: str) -> None:
    if not condition:
        raise SmokeTestFailure(message)


def almost_equal(left: float, right: float, tolerance: float = 1e-6) -> bool:
    return math.isclose(left, right, rel_tol=tolerance, abs_tol=tolerance)


def matches_filters(
    movie: dict[str, Any],
    *,
    year_min: int,
    year_max: int,
    genre: str = "all",
    sequel: str = "all",
    score_min: float = 1,
    score_max: float = 9,
) -> bool:
    if movie["releaseYear"] < year_min or movie["releaseYear"] > year_max:
        return False
    if genre != "all" and genre not in movie["genres"]:
        return False
    if sequel == "sequel" and movie["sequel"] != 1:
        return False
    if sequel == "original" and movie["sequel"] != 0:
        return False
    if movie["hitFlop"] < score_min or movie["hitFlop"] > score_max:
        return False
    return True


def matches_search(movie: dict[str, Any], query_text: str) -> bool:
    needle = query_text.strip().lower()
    if not needle:
        return True
    haystack = " ".join(
        [movie["title"], *movie["actors"], *movie["directors"], *movie["genres"]]
    ).lower()
    return needle in haystack


def validate_home(base_url: str) -> None:
    payload = request_json(base_url, "/")
    required_paths = {
        "/",
        "/health",
        "/api/meta",
        "/api/workbench",
        "/api/overview",
        "/api/genre-lab",
        "/api/movies",
        "/api/movies/export",
        "/api/talent",
        "/api/talent/profile",
        "/api/compare",
    }
    actual_paths = {entry["path"] for entry in payload["endpoints"]}
    expect(required_paths.issubset(actual_paths), "Home endpoint is missing API route definitions.")


def validate_health_and_meta(base_url: str, reference: ReferenceData) -> None:
    health = request_json(base_url, "/health")
    meta = request_json(base_url, "/api/meta")

    expect(health["status"] == "ok", "Health endpoint did not return status=ok.")
    expect(
        health["recordCounts"]["movies"] == len(reference.movies),
        "Health endpoint movie count does not match the CSV data.",
    )
    expect(
        health["recordCounts"]["actors"] == len(reference.actors),
        "Health endpoint actor count does not match the CSV data.",
    )
    expect(
        health["recordCounts"]["directors"] == len(reference.directors),
        "Health endpoint director count does not match the CSV data.",
    )

    expect(meta["yearRange"]["min"] == reference.year_min, "Meta year minimum is incorrect.")
    expect(meta["yearRange"]["max"] == reference.year_max, "Meta year maximum is incorrect.")
    expect(set(meta["genres"]) == reference.genres, "Meta genres do not match the CSV data.")
    expect(
        meta["recordCounts"]["movies"] == len(reference.movies),
        "Meta movie count does not match the CSV data.",
    )


def validate_overview_and_workbench(base_url: str, reference: ReferenceData) -> None:
    params = {
        "year_min": 2005,
        "year_max": 2010,
        "genre": "Comedy",
        "sequel": "all",
        "score_min": 1,
        "score_max": 9,
    }
    filtered_movies = [
        movie
        for movie in reference.movies
        if matches_filters(movie, **params)
    ]
    expected_hits = sum(1 for movie in filtered_movies if movie["hitFlop"] >= 6)

    overview = request_json(base_url, "/api/overview", params)
    workbench = request_json(base_url, "/api/workbench", params | {"limit": 3})
    genre_lab = request_json(base_url, "/api/genre-lab", params)

    yearly_total = sum(bucket["count"] for bucket in overview["overview"]["yearly"])

    expect(
        overview["filtersApplied"]["genre"] == "Comedy",
        "Overview filtersApplied.genre is incorrect.",
    )
    expect(
        overview["overview"]["kpis"]["films"] == len(filtered_movies),
        "Overview film count does not match the filtered CSV data.",
    )
    expect(
        overview["overview"]["kpis"]["hits"] == expected_hits,
        "Overview hit count does not match the filtered CSV data.",
    )
    expect(
        yearly_total == len(filtered_movies),
        "Overview yearly buckets do not sum to the filtered film count.",
    )
    expect(
        workbench["movies"]["filteredCount"] == len(filtered_movies),
        "Combined workbench endpoint filteredCount is incorrect.",
    )
    expect(
        len(workbench["movies"]["items"]) <= 3,
        "Combined workbench endpoint did not respect the movie limit.",
    )
    expect(
        len(genre_lab["genreLab"]["heatmap"]["cells"]) > 0,
        "Genre lab heatmap returned no cells.",
    )


def validate_movies_and_export(base_url: str, reference: ReferenceData) -> None:
    params = {
        "year_min": 2001,
        "year_max": 2014,
        "q": "shah rukh",
        "limit": 200,
    }
    expected = [movie for movie in reference.movies if matches_search(movie, "shah rukh")]

    movies_response = request_json(base_url, "/api/movies", params)
    csv_text = request_text(base_url, "/api/movies/export", params)
    csv_rows = list(csv.DictReader(io.StringIO(csv_text)))

    expect(
        movies_response["movies"]["total"] == len(expected),
        "Movies endpoint total does not match the CSV search result count.",
    )
    expect(
        all(matches_search(movie, "shah rukh") for movie in movies_response["movies"]["items"]),
        "Movies endpoint returned an item that does not match the search query.",
    )
    expect(
        len(csv_rows) == len(expected),
        "Movies export row count does not match the expected search result count.",
    )
    expect(
        csv_rows[0]["title"] if csv_rows else True,
        "Movies export CSV is missing expected headers or rows.",
    )


def validate_talent_and_profiles(base_url: str, reference: ReferenceData) -> None:
    actor_search = request_json(
        base_url,
        "/api/talent",
        {
            "type": "actors",
            "search": "khan",
            "sort": "normalizedRating",
            "limit": 5,
        },
    )
    director_search = request_json(
        base_url,
        "/api/talent",
        {
            "type": "directors",
            "search": "hirani",
            "sort": "normalizedRating",
            "limit": 5,
        },
    )

    expected_actor_total = sum(
        1 for name in reference.actors if "khan" in name.lower()
    )
    expect(
        actor_search["total"] == expected_actor_total,
        "Actor talent search total does not match the CSV data.",
    )
    expect(
        all("khan" in item["name"].lower() for item in actor_search["items"]),
        "Actor talent search returned a non-matching name.",
    )
    expect(
        any(item["name"] == "Rajkumar Hirani" for item in director_search["items"]),
        "Director talent search did not return Rajkumar Hirani.",
    )

    actor_id = actor_search["items"][0]["id"]
    actor_name = actor_search["items"][0]["name"]
    actor_profile = request_json(
        base_url,
        "/api/talent/profile",
        {
            "type": "actors",
            "id": actor_id,
        },
    )
    expected_filmography_count = sum(
        1 for movie in reference.movies if actor_name in movie["actors"]
    )

    expect(
        actor_profile["person"]["id"] == actor_id,
        "Talent profile returned the wrong actor record.",
    )
    expect(
        actor_profile["filmographyCount"] == expected_filmography_count,
        "Talent profile filmography count does not match the CSV data.",
    )
    expect(
        len(actor_profile["filmography"]) == expected_filmography_count,
        "Talent profile filmography length does not match filmographyCount.",
    )


def validate_compare(base_url: str, reference: ReferenceData) -> None:
    actor_names = [
        "Deepika Padukone",
        "Priyanka Chopra",
        "Kareena Kapoor",
        "Ranbir Kapoor",
        "Kajol",
    ]
    compare = request_json(
        base_url,
        "/api/compare",
        {
            "type": "actors",
            "names": ",".join(actor_names),
        },
    )

    expect(compare["picked"] == actor_names, "Compare endpoint did not preserve the requested actor order.")
    expect(len(compare["radarData"]) == 3, "Compare endpoint should return exactly 3 radar axes.")

    axis_map = {point["axis"]: point for point in compare["radarData"]}
    expect(set(axis_map) == {"Films", "Rating", "Google buzz"}, "Compare endpoint returned unexpected radar axes.")

    for name in actor_names:
        actor = reference.actors[name]
        expected_films = min(10.0, (actor["movieCount"] / reference.max_actor_movie_count) * 10.0)
        expect(
            almost_equal(axis_map["Films"][name], expected_films),
            f"Compare Films axis is incorrect for {name}.",
        )
        expect(
            almost_equal(axis_map["Rating"][name], actor["normalizedRating"]),
            f"Compare Rating axis is incorrect for {name}.",
        )
        expect(
            almost_equal(axis_map["Google buzz"][name], actor["normalizedGoogleRank"]),
            f"Compare Google buzz axis is incorrect for {name}.",
        )


def run_check(name: str, callback: callable[[], None], failures: list[str]) -> None:
    try:
        callback()
        print(f"[PASS] {name}")
    except Exception as error:  # noqa: BLE001
        failures.append(f"{name}: {error}")
        print(f"[FAIL] {name}: {error}")


def parse_args() -> argparse.Namespace:
    backend_dir = Path(__file__).resolve().parent
    default_data_dir = backend_dir.parent / "Data"

    parser = argparse.ArgumentParser(description="Smoke-test the Bollywood R API.")
    parser.add_argument(
        "--backend-dir",
        type=Path,
        default=backend_dir,
        help="Directory containing server.R, workbench_api.R, and workbench_core.R.",
    )
    parser.add_argument(
        "--data-dir",
        type=Path,
        default=default_data_dir,
        help="Directory containing the Bollywood CSV files.",
    )
    parser.add_argument(
        "--base-url",
        default="",
        help="Base URL of an already-running API. If omitted, the script starts the R server automatically.",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    backend_dir = args.backend_dir.resolve()
    data_dir = args.data_dir.resolve()

    if not backend_dir.joinpath("server.R").exists():
        raise SmokeTestFailure(f"Could not find server.R in {backend_dir}")
    if not data_dir.joinpath("BollywoodMovieDetail.csv").exists():
        raise SmokeTestFailure(f"Could not find BollywoodMovieDetail.csv in {data_dir}")

    reference = load_reference_data(data_dir)

    process: subprocess.Popen[str] | None = None
    if args.base_url:
        base_url = args.base_url.rstrip("/")
    else:
        port = find_free_port()
        base_url = f"http://127.0.0.1:{port}"
        process = start_server(backend_dir, data_dir, port)
        wait_for_server(base_url, process)

    failures: list[str] = []

    try:
        run_check("Home endpoint", lambda: validate_home(base_url), failures)
        run_check(
            "Health and meta endpoints",
            lambda: validate_health_and_meta(base_url, reference),
            failures,
        )
        run_check(
            "Overview, workbench, and genre-lab endpoints",
            lambda: validate_overview_and_workbench(base_url, reference),
            failures,
        )
        run_check(
            "Movies and CSV export endpoints",
            lambda: validate_movies_and_export(base_url, reference),
            failures,
        )
        run_check(
            "Talent list and profile endpoints",
            lambda: validate_talent_and_profiles(base_url, reference),
            failures,
        )
        run_check(
            "Compare endpoint",
            lambda: validate_compare(base_url, reference),
            failures,
        )
    finally:
        stop_server(process)

    if failures:
        print("\nSmoke test finished with failures:")
        for failure in failures:
            print(f"- {failure}")
        return 1

    print("\nAll smoke tests passed.")
    return 0


if __name__ == "__main__":
    try:
        sys.exit(main())
    except SmokeTestFailure as error:
        print(f"Smoke test failed: {error}", file=sys.stderr)
        sys.exit(1)
