if (!requireNamespace("httpuv", quietly = TRUE)) {
  stop("Package 'httpuv' is required. Install it with install.packages('httpuv').")
}

if (!requireNamespace("jsonlite", quietly = TRUE)) {
  stop("Package 'jsonlite' is required. Install it with install.packages('jsonlite').")
}

base_headers <- function(content_type = "application/json; charset=utf-8") {
  list(
    "Content-Type" = content_type,
    "Access-Control-Allow-Origin" = "*",
    "Access-Control-Allow-Methods" = "GET, OPTIONS",
    "Access-Control-Allow-Headers" = "Content-Type"
  )
}

json_response <- function(payload, status = 200L) {
  list(
    status = as.integer(status),
    headers = base_headers(),
    body = jsonlite::toJSON(
      payload,
      auto_unbox = TRUE,
      null = "null",
      na = "null",
      digits = NA,
      pretty = TRUE
    )
  )
}

text_response <- function(body, status = 200L, content_type = "text/plain; charset=utf-8") {
  list(
    status = as.integer(status),
    headers = base_headers(content_type),
    body = body
  )
}

empty_response <- function(status = 204L) {
  list(
    status = as.integer(status),
    headers = base_headers("text/plain; charset=utf-8"),
    body = ""
  )
}

error_response <- function(status, message, details = NULL) {
  json_response(
    list(
      error = list(
        status = as.integer(status),
        message = message,
        details = details
      )
    ),
    status = status
  )
}

parse_query_string <- function(query_string) {
  if (is.null(query_string) || !nzchar(query_string)) {
    return(list())
  }

  query_string <- sub("^\\?", "", query_string)
  parts <- strsplit(query_string, "&", fixed = TRUE)[[1]]
  output <- list()

  decode_query_component <- function(value) {
    utils::URLdecode(gsub("+", " ", value, fixed = TRUE))
  }

  for (part in parts) {
    if (!nzchar(part)) {
      next
    }

    key_value <- strsplit(part, "=", fixed = TRUE)[[1]]
    key <- decode_query_component(key_value[1])
    value <- if (length(key_value) > 1) {
      decode_query_component(paste(key_value[-1], collapse = "="))
    } else {
      ""
    }

    output[[key]] <- value
  }

  output
}

normalize_limit <- function(value, default = 200L, max_limit = 1000L) {
  limit <- coerce_int(value, default)
  limit <- max(1L, limit)
  min(limit, max_limit)
}

normalize_offset <- function(value, default = 0L) {
  offset <- coerce_int(value, default)
  max(0L, offset)
}

parse_compare_names <- function(value) {
  if (is.null(value) || !nzchar(trimws(as.character(value)))) {
    return(character(0))
  }

  parts <- trimws(strsplit(as.character(value), ",", fixed = TRUE)[[1]])
  unique(parts[nzchar(parts)])
}

build_home_payload <- function(store) {
  list(
    name = "Bollywood Workbench API",
    version = "1.0.0",
    loadedAt = store$loadedAt,
    dataDir = store$dataDir,
    recordCounts = store$metadata$recordCounts,
    endpoints = list(
      list(path = "/", description = "API overview and route list"),
      list(path = "/health", description = "Health check"),
      list(path = "/api/meta", description = "Available filters and dataset metadata"),
      list(path = "/api/workbench", description = "Combined payload for overview, genre lab, and movie table"),
      list(path = "/api/overview", description = "Overview KPIs and chart data for current filters"),
      list(path = "/api/genre-lab", description = "Heatmap, sequel comparison, and writer leaderboard"),
      list(path = "/api/movies", description = "Filtered movie table with optional text search and pagination"),
      list(path = "/api/movies/export", description = "CSV export for the current movie selection"),
      list(path = "/api/talent", description = "Actor or director explorer list"),
      list(path = "/api/talent/profile", description = "Single actor/director profile and filmography"),
      list(path = "/api/compare", description = "Radar-chart payload for actors or directors")
    ),
    examples = list(
      "/api/overview?year_min=2005&year_max=2012&genre=Comedy",
      "/api/movies?genre=Drama&q=shah%20rukh&limit=25&offset=0",
      "/api/talent?type=actors&sort=normalizedGoogleRank&search=khan",
      "/api/compare?type=directors&names=Rajkumar%20Hirani,Karan%20Johar"
    )
  )
}

create_workbench_api <- function(data_dir = NULL) {
  store <- load_workbench_data(data_dir)

  list(
    call = function(req) {
      method <- toupper(req$REQUEST_METHOD %||% "GET")
      path <- req$PATH_INFO %||% "/"
      query <- parse_query_string(req$QUERY_STRING)

      if (identical(method, "OPTIONS")) {
        return(empty_response(204L))
      }

      if (!identical(method, "GET")) {
        return(error_response(405L, "Only GET and OPTIONS are supported."))
      }

      tryCatch(
        {
          if (identical(path, "/")) {
            return(json_response(build_home_payload(store)))
          }

          if (identical(path, "/health")) {
            return(json_response(list(
              status = "ok",
              loadedAt = store$loadedAt,
              recordCounts = store$metadata$recordCounts
            )))
          }

          if (identical(path, "/api/meta")) {
            return(json_response(build_meta_payload(store)))
          }

          filters <- normalize_filters(query, store$metadata)
          filtered_movies <- apply_movie_filters(store$movies, filters)

          if (identical(path, "/api/workbench")) {
            query_text <- extract_query_value(query, c("q", "query", "search"), "")
            limit <- normalize_limit(extract_query_value(query, c("limit"), 50L), default = 50L, max_limit = 500L)
            offset <- normalize_offset(extract_query_value(query, c("offset"), 0L))

            return(json_response(list(
              meta = build_meta_payload(store),
              filtersApplied = filters,
              overview = build_overview_payload(filtered_movies),
              genreLab = build_genre_lab_payload(filtered_movies),
              movies = build_movies_payload(filtered_movies, query_text = query_text, limit = limit, offset = offset)
            )))
          }

          if (identical(path, "/api/overview")) {
            return(json_response(list(
              filtersApplied = filters,
              overview = build_overview_payload(filtered_movies)
            )))
          }

          if (identical(path, "/api/genre-lab")) {
            return(json_response(list(
              filtersApplied = filters,
              genreLab = build_genre_lab_payload(filtered_movies)
            )))
          }

          if (identical(path, "/api/movies")) {
            query_text <- extract_query_value(query, c("q", "query", "search"), "")
            limit <- normalize_limit(extract_query_value(query, c("limit"), 200L), default = 200L, max_limit = 1000L)
            offset <- normalize_offset(extract_query_value(query, c("offset"), 0L))

            return(json_response(list(
              filtersApplied = filters,
              movies = build_movies_payload(filtered_movies, query_text = query_text, limit = limit, offset = offset)
            )))
          }

          if (identical(path, "/api/movies/export")) {
            query_text <- extract_query_value(query, c("q", "query", "search"), "")
            exported_movies <- search_movies(filtered_movies, query_text)
            csv_body <- movies_to_csv(exported_movies)

            return(list(
              status = 200L,
              headers = c(
                base_headers("text/csv; charset=utf-8"),
                list("Content-Disposition" = "attachment; filename=\"bollywood-filtered.csv\"")
              ),
              body = csv_body
            ))
          }

          if (identical(path, "/api/talent")) {
            people_type <- normalize_people_type(extract_query_value(query, c("type"), "actors"))
            search <- extract_query_value(query, c("search", "q"), "")
            sort_key <- normalize_talent_sort(extract_query_value(query, c("sort"), "normalizedRating"))
            limit <- normalize_limit(extract_query_value(query, c("limit"), 80L), default = 80L, max_limit = 1000L)
            offset <- normalize_offset(extract_query_value(query, c("offset"), 0L))

            return(json_response(build_talent_payload(
              store = store,
              type = people_type,
              search = search,
              sort_key = sort_key,
              limit = limit,
              offset = offset
            )))
          }

          if (identical(path, "/api/talent/profile")) {
            people_type <- normalize_people_type(extract_query_value(query, c("type"), "actors"))
            id <- extract_query_value(query, c("id"), NULL)
            name <- extract_query_value(query, c("name"), NULL)

            return(json_response(build_talent_profile_payload(
              store = store,
              type = people_type,
              id = id,
              name = name
            )))
          }

          if (identical(path, "/api/compare")) {
            people_type <- normalize_people_type(extract_query_value(query, c("type"), "actors"))
            names <- parse_compare_names(extract_query_value(query, c("names"), NULL))

            return(json_response(build_compare_payload(
              store = store,
              type = people_type,
              names = names
            )))
          }

          error_response(404L, sprintf("No route found for %s", path))
        },
        error = function(error) {
          error_response(400L, conditionMessage(error))
        }
      )
    }
  )
}

run_workbench_api <- function(host = "0.0.0.0", port = 8000L, data_dir = NULL) {
  app <- create_workbench_api(data_dir = data_dir)

  message(sprintf(
    "Bollywood Workbench API running on http://%s:%s",
    host,
    as.integer(port)
  ))
  httpuv::runServer(host = host, port = as.integer(port), app = app)
}
