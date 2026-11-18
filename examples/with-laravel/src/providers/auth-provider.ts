import type { AuthProvider, HttpError } from "@refinedev/core";

import type { IUser } from "../interfaces";
import { TOKEN_KEY } from "./constants";
import { request } from "./request";

const unwrapUser = (payload: any): IUser => payload?.data ?? payload;

/**
 * Authentication against Laravel Sanctum personal access tokens.
 *
 * `POST /api/login` returns `{ token, user }`. The token is sent as
 * `Authorization: Bearer <token>` on every request by `request.ts`.
 */
export const authProvider: AuthProvider = {
  login: async ({ email, password }) => {
    try {
      const payload = await request<{ token: string; user: IUser }>("/login", {
        method: "POST",
        body: { email, password },
      });

      localStorage.setItem(TOKEN_KEY, payload.token);

      return { success: true, redirectTo: "/" };
    } catch (error) {
      const httpError = error as HttpError;

      return {
        success: false,
        error: {
          name: "Login failed",
          message: httpError?.message ?? "Invalid email or password.",
        },
      };
    }
  },

  register: async ({ email, password }) => {
    try {
      const payload = await request<{ token: string; user: IUser }>(
        "/register",
        {
          method: "POST",
          body: { email, password },
        },
      );

      localStorage.setItem(TOKEN_KEY, payload.token);

      return { success: true, redirectTo: "/" };
    } catch (error) {
      const httpError = error as HttpError;

      return {
        success: false,
        error: {
          name: "Register failed",
          message: httpError?.message ?? "Unable to create the account.",
        },
      };
    }
  },

  logout: async () => {
    try {
      await request("/logout", { method: "POST" });
    } catch {
      // The token may already be expired; clearing it locally is enough.
    } finally {
      localStorage.removeItem(TOKEN_KEY);
    }

    return { success: true, redirectTo: "/login" };
  },

  check: async () => {
    if (!localStorage.getItem(TOKEN_KEY)) {
      return { authenticated: false, redirectTo: "/login", logout: true };
    }

    try {
      await request("/user");

      return { authenticated: true };
    } catch {
      localStorage.removeItem(TOKEN_KEY);

      return { authenticated: false, redirectTo: "/login", logout: true };
    }
  },

  getIdentity: async () => {
    try {
      const payload = await request("/user");

      return unwrapUser(payload);
    } catch {
      return null;
    }
  },

  getPermissions: async () => null,

  onError: async (error) => {
    if (error?.statusCode === 401) {
      localStorage.removeItem(TOKEN_KEY);

      return { logout: true, redirectTo: "/login" };
    }

    return { error };
  },
};
