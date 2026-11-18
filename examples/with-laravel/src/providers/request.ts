import { API_URL, TOKEN_KEY } from "./constants";

export type HttpMethod = "GET" | "POST" | "PATCH" | "PUT" | "DELETE";

export interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  params?: URLSearchParams;
  headers?: Record<string, string>;
}

/**
 * Error shape used by refine's `onError` hooks and notifications.
 * Laravel validation errors are mapped to `errors`, so they can be shown
 * per form field if needed.
 */
export class LaravelApiError extends Error {
  statusCode: number;
  errors?: Record<string, string[]>;

  constructor(
    message: string,
    statusCode: number,
    errors?: Record<string, string[]>,
  ) {
    super(message);
    this.name = "LaravelApiError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

export const request = async <T = any>(
  path: string,
  { method = "GET", body, params, headers }: RequestOptions = {},
): Promise<T> => {
  // `custom` calls may pass a full URL, everything else is relative to the API.
  const url = path.startsWith("http") ? path : `${API_URL}${path}`;
  const token = localStorage.getItem(TOKEN_KEY);

  const response = await fetch(
    params?.toString() ? `${url}?${params.toString()}` : url,
    {
      method,
      headers: {
        Accept: "application/json",
        ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...headers,
      },
      body: body !== undefined ? JSON.stringify(body) : undefined,
    },
  );

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json().catch(() => null);

  if (!response.ok) {
    throw new LaravelApiError(
      payload?.message ?? `Request failed with status ${response.status}`,
      response.status,
      payload?.errors,
    );
  }

  return payload as T;
};
