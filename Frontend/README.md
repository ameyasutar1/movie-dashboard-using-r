# Frontend

This frontend now uses the R workbench API for the interactive workbench tab.

## API configuration

Create a `.env` file in `Frontend/` if you want to override the backend URL:

```bash
VITE_API_BASE_URL=http://localhost:8000
```

If no environment variable is supplied, the frontend defaults to `http://localhost:8000`.

## Run locally

1. Start the R backend API.
2. Start the frontend:

```bash
npm install
npm run dev
```

## Workbench API usage

The workbench screen now calls:

- `/api/meta`
- `/api/workbench`
- `/api/movies`
- `/api/movies/export`
- `/api/talent`
- `/api/talent/profile`
- `/api/compare`
