/**
 * auth-store.ts
 * In-memory + localStorage token store.
 * accessToken disimpan in-memory (lebih aman dari XSS).
 * refreshToken disimpan di localStorage untuk session persistence.
 */

const REFRESH_TOKEN_KEY = "citizenhub_refresh_token";
const USER_KEY = "citizenhub_user";

interface StoredUser {
  id: string;
  email: string;
  full_name: string;
  phone_number: string | null;
  role: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

let _accessToken: string | null = null;

export const authStore = {
  getAccessToken(): string | null {
    return _accessToken;
  },

  setAccessToken(token: string): void {
    _accessToken = token;
  },

  getRefreshToken(): string | null {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  },

  setTokens(accessToken: string, refreshToken: string): void {
    _accessToken = accessToken;
    if (typeof window !== "undefined") {
      localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    }
  },

  clearTokens(): void {
    _accessToken = null;
    if (typeof window !== "undefined") {
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    }
  },

  getUser(): StoredUser | null {
    if (typeof window === "undefined") return null;
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as StoredUser;
    } catch {
      return null;
    }
  },

  setUser(user: StoredUser): void {
    if (typeof window !== "undefined") {
      localStorage.setItem(USER_KEY, JSON.stringify(user));
    }
  },

  isAuthenticated(): boolean {
    return (
      _accessToken !== null ||
      (typeof window !== "undefined" &&
        localStorage.getItem(REFRESH_TOKEN_KEY) !== null)
    );
  },
};
