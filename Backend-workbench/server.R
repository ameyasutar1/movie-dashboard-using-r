get_script_dir <- function() {
  file_arg <- grep("^--file=", commandArgs(trailingOnly = FALSE), value = TRUE)

  if (length(file_arg)) {
    return(dirname(normalizePath(sub("^--file=", "", file_arg[1]))))
  }

  normalizePath(getwd())
}

script_dir <- get_script_dir()

source(file.path(script_dir, "workbench_core.R"))
source(file.path(script_dir, "workbench_api.R"))

args <- commandArgs(trailingOnly = TRUE)

host <- if (length(args) >= 1 && nzchar(trimws(args[1]))) {
  args[1]
} else {
  Sys.getenv("HOST", "0.0.0.0")
}

port <- if (length(args) >= 2 && nzchar(trimws(args[2]))) {
  suppressWarnings(as.integer(args[2]))
} else {
  suppressWarnings(as.integer(Sys.getenv("PORT", "8000")))
}

data_dir <- if (length(args) >= 3 && nzchar(trimws(args[3]))) {
  args[3]
} else {
  NULL
}

if (is.na(port)) {
  stop("Port must be an integer. Example: Rscript src/server.R 0.0.0.0 8000")
}

run_workbench_api(host = host, port = port, data_dir = data_dir)
