type QueryValue = string | number | boolean | null | undefined;

const FALLBACK_API_BASE_URL = "http://localhost:8000";

export const API_BASE_URL = (
  import.meta.env.VITE_API_BASE_URL || FALLBACK_API_BASE_URL
).replace(/\/$/, "");

export function buildApiUrl(
  path: string,
  params?: Record<string, QueryValue>,
) {
  const url = new URL(path, `${API_BASE_URL}/`);

  Object.entries(params ?? {}).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") {
      return;
    }

    url.searchParams.set(key, String(value));
  });

  return url.toString();
}

export async function fetchJson<T>(
  path: string,
  params?: Record<string, QueryValue>,
): Promise<T> {
  const response = await fetch(buildApiUrl(path, params));

  if (!response.ok) {
    let message = `Request failed with status ${response.status}`;

    try {
      const body = (await response.json()) as {
        error?: { message?: string };
      };

      if (body.error?.message) {
        message = body.error.message;
      }
    } catch {
      // Ignore body parse errors and keep the generic message.
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}
