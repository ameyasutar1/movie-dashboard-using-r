`%||%` <- function(x, y) {
  if (is.null(x) || length(x) == 0) {
    return(y)
  }
  x
}

split_pipe <- function(value) {
  if (is.null(value) || length(value) == 0) {
    return(character(0))
  }

  text <- trimws(as.character(value[[1]]))

  if (!nzchar(text) || identical(text, "N/A")) {
    return(character(0))
  }

  parts <- trimws(strsplit(text, "\\|", perl = TRUE)[[1]])
  parts[nzchar(parts)]
}

coerce_int <- function(value, default = 0L) {
  number <- suppressWarnings(as.integer(round(as.numeric(value[[1]] %||% default))))
  if (is.na(number)) {
    return(as.integer(default))
  }
  number
}

coerce_num <- function(value, default = 0) {
  number <- suppressWarnings(as.numeric(value[[1]] %||% default))
  if (is.na(number)) {
    return(as.numeric(default))
  }
  number
}

as_array <- function(values) {
  as.list(unname(values))
}

data_frame_to_records <- function(data) {
  if (!nrow(data)) {
    return(list())
  }

  lapply(seq_len(nrow(data)), function(index) {
    record <- lapply(data[index, , drop = FALSE], function(column) column[[1]])
    names(record) <- names(data)
    record
  })
}

movie_to_public <- function(movie) {
  list(
    imdbId = movie$imdbId,
    title = movie$title,
    releaseYear = movie$releaseYear,
    releaseDate = movie$releaseDate,
    genres = as_array(movie$genres),
    writers = as_array(movie$writers),
    actors = as_array(movie$actors),
    directors = as_array(movie$directors),
    sequel = movie$sequel,
    hitFlop = movie$hitFlop
  )
}

find_project_root <- function(start = getwd()) {
  current <- normalizePath(start, mustWork = TRUE)

  repeat {
    candidate <- file.path(current, "Data", "BollywoodMovieDetail.csv")

    if (file.exists(candidate)) {
      return(current)
    }

    parent <- dirname(current)
    if (identical(parent, current)) {
      stop("Could not find project root containing Data/BollywoodMovieDetail.csv.")
    }

    current <- parent
  }
}

find_data_dir <- function(data_dir = NULL) {
  if (!is.null(data_dir)) {
    resolved <- normalizePath(data_dir, mustWork = TRUE)
    required <- file.path(resolved, "BollywoodMovieDetail.csv")

    if (!file.exists(required)) {
      stop("The supplied data_dir does not contain BollywoodMovieDetail.csv.")
    }

    return(resolved)
  }

  file.path(find_project_root(), "Data")
}

read_movies <- function(path) {
  raw <- read.csv(path, stringsAsFactors = FALSE, check.names = FALSE)

  if (!nrow(raw)) {
    return(list())
  }

  lapply(seq_len(nrow(raw)), function(index) {
    row <- raw[index, , drop = FALSE]

    list(
      imdbId = as.character(row$imdbId[[1]] %||% ""),
      title = as.character(row$title[[1]] %||% ""),
      releaseYear = coerce_int(row$releaseYear, 0L),
      releaseDate = as.character(row$releaseDate[[1]] %||% ""),
      genres = split_pipe(row$genre),
      writers = split_pipe(row$writers),
      actors = split_pipe(row$actors),
      directors = split_pipe(row$directors),
      sequel = coerce_int(row$sequel, 0L),
      hitFlop = coerce_num(row$hitFlop, 0)
    )
  })
}

read_people <- function(path, id_key, name_key) {
  raw <- read.csv(path, stringsAsFactors = FALSE, check.names = FALSE)

  data.frame(
    id = as.character(raw[[id_key]]),
    name = as.character(raw[[name_key]]),
    movieCount = suppressWarnings(as.integer(raw$movieCount)),
    ratingSum = suppressWarnings(as.numeric(raw$ratingSum)),
    normalizedMovieRank = suppressWarnings(as.numeric(raw$normalizedMovieRank)),
    googleHits = suppressWarnings(as.numeric(raw$googleHits)),
    normalizedGoogleRank = suppressWarnings(as.numeric(raw$normalizedGoogleRank)),
    normalizedRating = suppressWarnings(as.numeric(raw$normalizedRating)),
    stringsAsFactors = FALSE
  )
}

load_workbench_data <- function(data_dir = NULL) {
  resolved_data_dir <- find_data_dir(data_dir)

  movies <- read_movies(file.path(resolved_data_dir, "BollywoodMovieDetail.csv"))
  actors <- read_people(
    file.path(resolved_data_dir, "BollywoodActorRanking.csv"),
    id_key = "actorId",
    name_key = "actorName"
  )
  directors <- read_people(
    file.path(resolved_data_dir, "BollywoodDirectorRanking.csv"),
    id_key = "directorId",
    name_key = "directorName"
  )

  years <- vapply(movies, function(movie) movie$releaseYear, integer(1))
  years <- years[years > 0]

  genres <- sort(unique(unlist(lapply(movies, function(movie) movie$genres), use.names = FALSE)))

  list(
    dataDir = resolved_data_dir,
    loadedAt = format(Sys.time(), "%Y-%m-%dT%H:%M:%S%z"),
    movies = movies,
    actors = actors,
    directors = directors,
    metadata = list(
      yearMin = if (length(years)) min(years) else 2001L,
      yearMax = if (length(years)) max(years) else 2014L,
      scoreMin = 1,
      scoreMax = 9,
      genres = genres,
      recordCounts = list(
        movies = length(movies),
        actors = nrow(actors),
        directors = nrow(directors)
      )
    )
  )
}

extract_query_value <- function(query, keys, default = NULL) {
  for (key in keys) {
    value <- query[[key]]
    if (!is.null(value) && nzchar(trimws(as.character(value)))) {
      return(as.character(value))
    }
  }

  default
}

normalize_people_type <- function(value = "actors") {
  type <- tolower(trimws(as.character(value %||% "actors")))

  if (type %in% c("actor", "actors")) {
    return("actors")
  }

  if (type %in% c("director", "directors")) {
    return("directors")
  }

  stop("type must be one of: actors, actor, directors, director")
}

normalize_filters <- function(query, metadata) {
  year_min <- coerce_int(extract_query_value(query, c("year_min", "yearMin"), metadata$yearMin), metadata$yearMin)
  year_max <- coerce_int(extract_query_value(query, c("year_max", "yearMax"), metadata$yearMax), metadata$yearMax)
  score_min <- coerce_num(extract_query_value(query, c("score_min", "scoreMin"), metadata$scoreMin), metadata$scoreMin)
  score_max <- coerce_num(extract_query_value(query, c("score_max", "scoreMax"), metadata$scoreMax), metadata$scoreMax)

  if (year_min > year_max) {
    swap <- year_min
    year_min <- year_max
    year_max <- swap
  }

  if (score_min > score_max) {
    swap <- score_min
    score_min <- score_max
    score_max <- swap
  }

  year_min <- max(metadata$yearMin, year_min)
  year_max <- min(metadata$yearMax, year_max)
  score_min <- max(metadata$scoreMin, score_min)
  score_max <- min(metadata$scoreMax, score_max)

  genre <- trimws(as.character(extract_query_value(query, c("genre"), "all")))
  if (!identical(genre, "all") && !(genre %in% metadata$genres)) {
    stop(sprintf("Unknown genre: %s", genre))
  }

  sequel_only <- tolower(trimws(as.character(extract_query_value(query, c("sequel", "sequel_only", "sequelOnly"), "all"))))
  sequel_only <- switch(
    sequel_only,
    "0" = "original",
    "original" = "original",
    "no" = "original",
    "false" = "original",
    "1" = "sequel",
    "sequel" = "sequel",
    "yes" = "sequel",
    "true" = "sequel",
    "all"
  )

  list(
    yearMin = year_min,
    yearMax = year_max,
    genre = genre,
    sequelOnly = sequel_only,
    scoreMin = score_min,
    scoreMax = score_max
  )
}

apply_movie_filters <- function(movies, filters) {
  Filter(function(movie) {
    if (movie$releaseYear < filters$yearMin || movie$releaseYear > filters$yearMax) {
      return(FALSE)
    }

    if (!identical(filters$genre, "all") && !(filters$genre %in% movie$genres)) {
      return(FALSE)
    }

    if (identical(filters$sequelOnly, "sequel") && movie$sequel != 1L) {
      return(FALSE)
    }

    if (identical(filters$sequelOnly, "original") && movie$sequel != 0L) {
      return(FALSE)
    }

    if (movie$hitFlop < filters$scoreMin || movie$hitFlop > filters$scoreMax) {
      return(FALSE)
    }

    TRUE
  }, movies)
}

search_movies <- function(movies, query_text = "") {
  needle <- tolower(trimws(as.character(query_text %||% "")))

  if (!nzchar(needle)) {
    return(movies)
  }

  Filter(function(movie) {
    haystack <- tolower(
      paste(
        c(movie$title, movie$actors, movie$directors, movie$genres),
        collapse = " "
      )
    )
    grepl(needle, haystack, fixed = TRUE)
  }, movies)
}

mean_value <- function(values) {
  if (!length(values)) {
    return(0)
  }

  sum(values) / length(values)
}

median_value <- function(values) {
  if (!length(values)) {
    return(0)
  }

  sorted <- sort(values)
  middle <- floor(length(sorted) / 2)

  if (length(sorted) %% 2 == 1) {
    return(sorted[middle + 1])
  }

  (sorted[middle] + sorted[middle + 1]) / 2
}

movies_per_year <- function(movies) {
  years <- sort(unique(vapply(movies, function(movie) movie$releaseYear, integer(1))))
  years <- years[years > 0]

  lapply(years, function(year) {
    bucket <- Filter(function(movie) movie$releaseYear == year, movies)
    scores <- vapply(bucket, function(movie) movie$hitFlop, numeric(1))

    list(
      year = year,
      count = length(bucket),
      avgScore = mean_value(scores)
    )
  })
}

sequel_comparison <- function(movies) {
  buckets <- list(
    Original = list(),
    Sequel = list(),
    Other = list()
  )

  for (movie in movies) {
    if (movie$sequel == 0L) {
      buckets$Original[[length(buckets$Original) + 1]] <- movie
    } else if (movie$sequel == 1L) {
      buckets$Sequel[[length(buckets$Sequel) + 1]] <- movie
    } else {
      buckets$Other[[length(buckets$Other) + 1]] <- movie
    }
  }

  output <- list()

  for (label in names(buckets)) {
    bucket <- buckets[[label]]

    if (!length(bucket)) {
      next
    }

    scores <- vapply(bucket, function(movie) movie$hitFlop, numeric(1))
    output[[length(output) + 1]] <- list(
      label = label,
      count = length(bucket),
      median = median_value(scores),
      mean = mean_value(scores)
    )
  }

  output
}

genre_stats <- function(movies) {
  scores_by_genre <- list()

  for (movie in movies) {
    for (genre in movie$genres) {
      scores_by_genre[[genre]] <- c(scores_by_genre[[genre]] %||% numeric(0), movie$hitFlop)
    }
  }

  if (!length(scores_by_genre)) {
    return(list())
  }

  data <- data.frame(
    genre = names(scores_by_genre),
    count = vapply(scores_by_genre, length, integer(1)),
    avgScore = vapply(scores_by_genre, mean_value, numeric(1)),
    stringsAsFactors = FALSE
  )

  data <- data[order(-data$count, data$genre), , drop = FALSE]
  data_frame_to_records(data)
}

genre_year_heatmap <- function(movies, top_genres = 8L) {
  top <- head(vapply(genre_stats(movies), function(record) record$genre, character(1)), top_genres)
  years <- sort(unique(vapply(movies, function(movie) movie$releaseYear, integer(1))))
  years <- years[years > 0]

  cells <- list()

  for (genre in top) {
    for (year in years) {
      bucket <- Filter(function(movie) {
        movie$releaseYear == year && genre %in% movie$genres
      }, movies)

      scores <- vapply(bucket, function(movie) movie$hitFlop, numeric(1))
      cells[[length(cells) + 1]] <- list(
        genre = genre,
        year = year,
        avg = mean_value(scores),
        count = length(bucket)
      )
    }
  }

  list(
    genres = as_array(top),
    years = as_array(years),
    cells = cells
  )
}

top_writers <- function(movies, limit = 12L) {
  counts <- integer(0)

  for (movie in movies) {
    for (writer in movie$writers) {
      clean <- trimws(gsub("\\s*\\(.*?\\)\\s*", "", writer, perl = TRUE))
      if (!nzchar(clean)) {
        next
      }

      if (!(clean %in% names(counts))) {
        counts[clean] <- 0L
      }

      counts[clean] <- counts[clean] + 1L
    }
  }

  if (!length(counts)) {
    return(list())
  }

  data <- data.frame(
    name = names(counts),
    count = as.integer(unname(counts)),
    stringsAsFactors = FALSE
  )

  data <- data[order(-data$count, data$name), , drop = FALSE]
  data <- head(data, limit)

  data_frame_to_records(data)
}

build_meta_payload <- function(store) {
  list(
    yearRange = list(
      min = store$metadata$yearMin,
      max = store$metadata$yearMax
    ),
    scoreRange = list(
      min = store$metadata$scoreMin,
      max = store$metadata$scoreMax
    ),
    defaultFilters = list(
      yearMin = store$metadata$yearMin,
      yearMax = store$metadata$yearMax,
      genre = "all",
      sequelOnly = "all",
      scoreMin = store$metadata$scoreMin,
      scoreMax = store$metadata$scoreMax
    ),
    genres = as_array(store$metadata$genres),
    recordCounts = store$metadata$recordCounts,
    sortOptions = as_array(c("normalizedRating", "normalizedGoogleRank", "movieCount"))
  )
}

build_overview_payload <- function(movies) {
  average_score <- if (length(movies)) {
    mean_value(vapply(movies, function(movie) movie$hitFlop, numeric(1)))
  } else {
    0
  }
  hits <- sum(vapply(movies, function(movie) movie$hitFlop >= 6, logical(1)))
  hit_rate <- if (length(movies)) round((hits / length(movies)) * 100, 2) else 0

  list(
    kpis = list(
      films = length(movies),
      avgScore = average_score,
      hits = hits,
      hitRatePercent = hit_rate
    ),
    yearly = movies_per_year(movies),
    sequelComparison = sequel_comparison(movies),
    genreStats = head(genre_stats(movies), 10L)
  )
}

build_genre_lab_payload <- function(movies) {
  list(
    heatmap = genre_year_heatmap(movies, top_genres = 8L),
    sequelComparison = sequel_comparison(movies),
    topWriters = top_writers(movies, limit = 12L)
  )
}

paginate_movies <- function(movies, limit = 200L, offset = 0L) {
  total <- length(movies)

  if (!total || offset >= total) {
    return(list(total = total, items = list()))
  }

  end_index <- min(total, offset + limit)
  items <- lapply(movies[(offset + 1):end_index], movie_to_public)

  list(
    total = total,
    items = items
  )
}

build_movies_payload <- function(filtered_movies, query_text = "", limit = 200L, offset = 0L) {
  searched_movies <- search_movies(filtered_movies, query_text)
  paged <- paginate_movies(searched_movies, limit = limit, offset = offset)

  list(
    filteredCount = length(filtered_movies),
    total = paged$total,
    limit = limit,
    offset = offset,
    query = query_text,
    items = paged$items
  )
}

normalize_talent_sort <- function(value = "normalizedRating") {
  sort_key <- trimws(as.character(value %||% "normalizedRating"))
  valid <- c("normalizedRating", "normalizedGoogleRank", "movieCount")

  if (!(sort_key %in% valid)) {
    stop("sort must be one of: normalizedRating, normalizedGoogleRank, movieCount")
  }

  sort_key
}

build_talent_payload <- function(store, type = "actors", search = "", sort_key = "normalizedRating", limit = 80L, offset = 0L) {
  people_type <- normalize_people_type(type)
  people <- store[[people_type]]
  needle <- tolower(trimws(as.character(search %||% "")))
  sort_key <- normalize_talent_sort(sort_key)

  if (nzchar(needle)) {
    people <- people[grepl(needle, tolower(people$name), fixed = TRUE), , drop = FALSE]
  }

  order_index <- order(-people[[sort_key]], people$name)
  people <- people[order_index, , drop = FALSE]

  total <- nrow(people)
  end_index <- min(total, offset + limit)
  page <- if (!total || offset >= total) people[0, , drop = FALSE] else people[(offset + 1):end_index, , drop = FALSE]

  list(
    type = people_type,
    total = total,
    limit = limit,
    offset = offset,
    search = search,
    sort = sort_key,
    items = data_frame_to_records(page)
  )
}

build_talent_profile_payload <- function(store, type = "actors", id = NULL, name = NULL) {
  people_type <- normalize_people_type(type)
  people <- store[[people_type]]

  row <- people[0, , drop = FALSE]

  if (!is.null(id) && nzchar(trimws(as.character(id)))) {
    row <- people[people$id == as.character(id), , drop = FALSE]
  } else if (!is.null(name) && nzchar(trimws(as.character(name)))) {
    row <- people[tolower(people$name) == tolower(trimws(as.character(name))), , drop = FALSE]
  }

  if (!nrow(row)) {
    stop("No matching person found for the supplied id or name.")
  }

  row <- row[1, , drop = FALSE]
  person_name <- row$name[[1]]

  filmography <- Filter(function(movie) {
    if (identical(people_type, "actors")) {
      return(person_name %in% movie$actors)
    }

    person_name %in% movie$directors
  }, store$movies)

  if (length(filmography)) {
    order_index <- order(
      -vapply(filmography, function(movie) movie$releaseYear, integer(1)),
      vapply(filmography, function(movie) movie$title, character(1))
    )
    filmography <- filmography[order_index]
  }

  list(
    type = people_type,
    person = data_frame_to_records(row)[[1]],
    filmographyCount = length(filmography),
    filmography = lapply(filmography, movie_to_public)
  )
}

build_compare_payload <- function(store, type = "actors", names = character(0)) {
  people_type <- normalize_people_type(type)
  people <- store[[people_type]]

  if (!length(names)) {
    names <- head(people$name, 4L)
  }

  names <- unique(trimws(as.character(names)))
  names <- names[nzchar(names)]
  names <- names[names %in% people$name]

  if (!length(names)) {
    names <- head(people$name, 4L)
  }

  selected <- people[match(names, people$name), , drop = FALSE]
  selected <- selected[!is.na(selected$id), , drop = FALSE]

  max_movie_count <- max(people$movieCount, 1L, na.rm = TRUE)
  axes <- c("Films", "Rating", "Google buzz")

  radar_data <- lapply(axes, function(axis) {
    point <- list(axis = axis)

    for (index in seq_len(nrow(selected))) {
      person <- selected[index, , drop = FALSE]
      person_name <- person$name[[1]]

      point[[person_name]] <- switch(
        axis,
        "Films" = min(10, (person$movieCount[[1]] / max_movie_count) * 10),
        "Rating" = person$normalizedRating[[1]],
        "Google buzz" = person$normalizedGoogleRank[[1]]
      )
    }

    point
  })

  list(
    type = people_type,
    picked = as_array(selected$name),
    people = data_frame_to_records(selected),
    radarData = radar_data
  )
}

movies_to_csv <- function(movies) {
  if (!length(movies)) {
    empty <- data.frame(
      title = character(0),
      year = integer(0),
      genres = character(0),
      directors = character(0),
      actors = character(0),
      sequel = integer(0),
      hitFlop = numeric(0),
      stringsAsFactors = FALSE
    )
  } else {
    empty <- data.frame(
      title = vapply(movies, function(movie) movie$title, character(1)),
      year = vapply(movies, function(movie) movie$releaseYear, integer(1)),
      genres = vapply(movies, function(movie) paste(movie$genres, collapse = " | "), character(1)),
      directors = vapply(movies, function(movie) paste(movie$directors, collapse = " | "), character(1)),
      actors = vapply(movies, function(movie) paste(movie$actors, collapse = " | "), character(1)),
      sequel = vapply(movies, function(movie) movie$sequel, integer(1)),
      hitFlop = vapply(movies, function(movie) movie$hitFlop, numeric(1)),
      stringsAsFactors = FALSE
    )
  }

  connection <- textConnection("output", "w", local = TRUE)
  on.exit(close(connection), add = TRUE)

  write.csv(empty, connection, row.names = FALSE)
  paste(output, collapse = "\n")
}
