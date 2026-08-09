"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";
import { authStore } from "@/lib/auth-store";
import apiClient from "@/lib/api-client";
import type { User } from "@/types";
import type { ApiTokenPair, ApiUserProfile, ApiRegisterResponse } from "@/types/api";

let refreshPromise: Promise<void> | null = null;

export function useAuth() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Inisialisasi: cek apakah ada refresh token dan fetch profil
  useEffect(() => {
    async function init() {
      const refreshToken = authStore.getRefreshToken();
      if (!refreshToken) {
        setIsLoading(false);
        return;
      }

      // Jika sudah punya access token di memory, skip refresh
      if (authStore.getAccessToken()) {
        const storedUser = authStore.getUser();
        if (storedUser) {
          setUser(storedUser as User);
          setIsAuthenticated(true);
        }
        setIsLoading(false);
        return;
      }

      // Coba restore user dari localStorage dulu (biar cepat)
      const storedUser = authStore.getUser();
      if (storedUser) {
        setUser(storedUser as User);
        setIsAuthenticated(true);
      }

      // Coba fetch profil — deduplikasi request agar tidak conflict di Strict Mode.
      // Jika token tidak ada di memory, apiClient akan mendapat 401 dan otomatis melakukan refresh token.
      if (!refreshPromise) {
        refreshPromise = (async () => {
          try {
            const profileRes = await apiClient.get<ApiUserProfile>("/users/me");
            authStore.setUser(profileRes.data);
          } catch {
            // Jika refresh gagal atau /users/me tetap gagal, clear
            authStore.clearTokens();
            throw new Error("Refresh / Fetch profile failed");
          }
        })();
      }

      try {
        await refreshPromise;
        const freshUser = authStore.getUser();
        if (freshUser) {
          setUser(freshUser as User);
          setIsAuthenticated(true);
        } else {
          setIsAuthenticated(false);
          setUser(null);
        }
      } catch {
        setIsAuthenticated(false);
        setUser(null);
      } finally {
        refreshPromise = null;
        setIsLoading(false);
      }
    }

    init();
  }, []);

  /**
   * Login dengan NIK + password.
   * API: POST /auth/login { nik, password }
   */
  const login = useCallback(
    async (nik: string, password: string) => {
      const { data } = await apiClient.post<ApiTokenPair>("/auth/login", {
        nik,
        password,
      });

      if (!data?.accessToken || !data?.refreshToken) {
        throw new Error("Tokens missing from login response");
      }

      authStore.setTokens(data.accessToken, data.refreshToken);

      // Fetch profil setelah login
      const profileRes = await apiClient.get<ApiUserProfile>("/users/me");

      authStore.setUser(profileRes.data);
      setUser(profileRes.data as User);
      setIsAuthenticated(true);

      router.push(ROUTES.CONSENT);
    },
    [router]
  );

  /**
   * Register akun baru.
   * API: POST /auth/register { nik, email, full_name, password }
   * Setelah berhasil, langsung login agar user tidak perlu login manual.
   */
  const register = useCallback(
    async (dto: {
      nik: string;
      email: string;
      full_name: string;
      password: string;
    }): Promise<ApiRegisterResponse> => {
      const { data } = await apiClient.post<ApiRegisterResponse>(
        "/auth/register",
        dto
      );
      return data;
    },
    []
  );

  /**
   * Logout: POST /auth/logout dengan refreshToken → clear store
   */
  const logout = useCallback(async () => {
    const refreshToken = authStore.getRefreshToken();
    if (refreshToken) {
      try {
        await apiClient.post("/auth/logout", { refreshToken });
      } catch {
        // Logout tetap dilakukan meski request gagal
      }
    }
    authStore.clearTokens();
    setIsAuthenticated(false);
    setUser(null);
    router.push(ROUTES.LOGIN);
  }, [router]);

  return { isAuthenticated, user, isLoading, login, register, logout };
}
