# Bollywood Workbench API

This repository now exposes the Bollywood workbench dataset as an R REST API so a React frontend can recreate the same workbench views that existed in the attached zip project.

## What it covers

The API mirrors the workbench behavior from the React app:

- Overview filters: year range, genre, sequel/original toggle, and performance score range
- Overview charts: films per year, average score over time, sequel comparison, and top genres
- Talent explorer: actors/directors list with search, sort, and filmography lookup
- Compare mode: radar payload for selected actors or directors
- Genre lab: genre-year heatmap, sequel comparison, and top writers
- Data table: filtered/searchable movie list plus CSV export

## Project structure

- `Data/`: source CSV files
- `src/workbench_core.R`: parsing, filtering, and aggregation logic
- `src/workbench_api.R`: HTTP routes and JSON/CSV responses
- `src/server.R`: server entrypoint

## Run the API

From the project root:

```r
Rscript src/server.R
```

Optional arguments:

```r
Rscript src/server.R 0.0.0.0 8000
Rscript src/server.R 0.0.0.0 8000 /absolute/path/to/Data
```

Environment variables also work:

```r
HOST=0.0.0.0 PORT=8000 Rscript src/server.R
```

## Main endpoints

- `GET /`
- `GET /health`
- `GET /api/meta`
- `GET /api/workbench`
- `GET /api/overview`
- `GET /api/genre-lab`
- `GET /api/movies`
- `GET /api/movies/export`
- `GET /api/talent`
- `GET /api/talent/profile`
- `GET /api/compare`

## Example requests

```bash
curl "http://localhost:8000/api/meta"
curl "http://localhost:8000/api/overview?year_min=2005&year_max=2012&genre=Comedy"
curl "http://localhost:8000/api/movies?genre=Drama&q=shah%20rukh&limit=25&offset=0"
curl "http://localhost:8000/api/talent?type=actors&sort=normalizedGoogleRank&search=khan"
curl "http://localhost:8000/api/talent/profile?type=directors&name=Rajkumar%20Hirani"
curl "http://localhost:8000/api/compare?type=actors&names=Aamir%20Khan,Shah%20Rukh%20Khan,Salman%20Khan"
```

## Frontend notes

- CORS is enabled with `Access-Control-Allow-Origin: *`
- All endpoints are read-only and return JSON except `/api/movies/export`, which returns CSV
- `/api/workbench` is the easiest starting point for a single-page React workbench screen
