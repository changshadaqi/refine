import type { CrudFilter, CrudSorting, DataProvider } from "@refinedev/core";

import { request, type HttpMethod } from "./request";

/**
 * Laravel's `paginate()` returns the rows on the root of the payload
 * (`data`, `total`, ...), while API resources wrap them in `{ data, meta }`.
 * Both shapes are accepted here.
 */
type LaravelListPayload<T> =
  | T[]
  | {
      data?: T[];
      total?: number;
      meta?: { total?: number };
    };

const isObject = (value: unknown): value is Record<string, any> =>
  typeof value === "object" && value !== null;

const unwrap = <T>(payload: T | { data?: T }): T => {
  if (isObject(payload) && "data" in payload) {
    return (payload as { data: T }).data;
  }

  return payload as T;
};

const appendSorters = (params: URLSearchParams, sorters?: CrudSorting) => {
  if (!sorters?.length) {
    return;
  }

  params.set("sort", sorters.map((sorter) => sorter.field).join(","));
  params.set("order", sorters.map((sorter) => sorter.order).join(","));
};

/**
 * Maps refine filters to Laravel friendly query params:
 *
 *   eq        -> filter[title]=foo
 *   contains  -> filter[title][like]=%foo%
 *   gte       -> filter[created_at][gte]=2024-01-01
 *   in        -> filter[status][in]=draft,published
 */
const appendFilters = (params: URLSearchParams, filters?: CrudFilter[]) => {
  if (!filters) {
    return;
  }

  for (const filter of filters) {
    // Nested `and` / `or` groups are intentionally not supported by this example.
    if (!("field" in filter)) {
      continue;
    }

    const { field, operator, value } = filter;

    if (value === undefined || value === null || value === "") {
      continue;
    }

    switch (operator) {
      case "eq":
        params.append(`filter[${field}]`, String(value));
        break;
      case "contains":
      case "containss":
        params.append(`filter[${field}][like]`, `%${value}%`);
        break;
      case "startswith":
        params.append(`filter[${field}][like]`, `${value}%`);
        break;
      case "endswith":
        params.append(`filter[${field}][like]`, `%${value}`);
        break;
      case "in":
        params.append(
          `filter[${field}][in]`,
          (Array.isArray(value) ? value : [value]).join(","),
        );
        break;
      case "nin":
        params.append(
          `filter[${field}][not_in]`,
          (Array.isArray(value) ? value : [value]).join(","),
        );
        break;
      default:
        params.append(`filter[${field}][${operator}]`, String(value));
    }
  }
};

/**
 * Data provider for a Laravel REST API (`routes/api.php` + Eloquent resources).
 */
export const createDataProvider = (apiUrl: string): DataProvider => ({
  getList: async ({ resource, pagination, sorters, filters, meta }) => {
    const params = new URLSearchParams();
    const {
      currentPage = 1,
      pageSize = 10,
      mode = "server",
    } = pagination ?? {};

    if (mode === "server") {
      params.set("page", String(currentPage));
      params.set("per_page", String(pageSize));
    }

    appendSorters(params, sorters);
    appendFilters(params, filters);

    const payload = await request<LaravelListPayload<any>>(`/${resource}`, {
      params,
      headers: meta?.headers,
    });

    const data = Array.isArray(payload) ? payload : payload?.data ?? [];
    const total = Array.isArray(payload)
      ? data.length
      : payload.total ?? payload.meta?.total ?? data.length;

    return { data, total };
  },

  getMany: async ({ resource, ids, meta }) => {
    const params = new URLSearchParams({ ids: ids.join(",") });

    const payload = await request<LaravelListPayload<any>>(`/${resource}`, {
      params,
      headers: meta?.headers,
    });

    const data = Array.isArray(payload) ? payload : payload?.data ?? [];

    return { data };
  },

  getOne: async ({ resource, id, meta }) => {
    const payload = await request(`/${resource}/${id}`, {
      headers: meta?.headers,
    });

    return { data: unwrap(payload) };
  },

  create: async ({ resource, variables, meta }) => {
    const payload = await request(`/${resource}`, {
      method: "POST",
      body: variables,
      headers: meta?.headers,
    });

    return { data: unwrap(payload) };
  },

  update: async ({ resource, id, variables, meta }) => {
    const payload = await request(`/${resource}/${id}`, {
      method: "PATCH",
      body: variables,
      headers: meta?.headers,
    });

    return { data: unwrap(payload) };
  },

  deleteOne: async ({ resource, id, variables, meta }) => {
    const payload = await request(`/${resource}/${id}`, {
      method: "DELETE",
      body: variables,
      headers: meta?.headers,
    });

    return { data: payload ?? { id } };
  },

  getApiUrl: () => apiUrl,

  custom: async ({
    url,
    method,
    filters,
    sorters,
    payload,
    query,
    headers,
  }) => {
    const params = new URLSearchParams();

    appendSorters(params, sorters);
    appendFilters(params, filters);

    if (query) {
      for (const [key, value] of Object.entries(query)) {
        params.set(key, String(value));
      }
    }

    const data = await request(url, {
      method: (method?.toUpperCase() as HttpMethod) ?? "GET",
      body: payload,
      params,
      headers,
    });

    return { data };
  },
});
