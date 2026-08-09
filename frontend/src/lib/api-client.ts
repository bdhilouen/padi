/**
 * api-client.ts
 * Axios instance dengan interceptor untuk JWT auth + auto-refresh.
 * Base URL diambil dari NEXT_PUBLIC_API_URL (default: http://localhost:3001/api/v1)
 */

import axios from "axios";
import { authStore } from "./auth-store";

const BASE_URL = `${
  (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:3001").replace(/\/$/, "")
}`;

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

// ─── Request Interceptor: tambahkan Bearer token ─────────────────────────────
apiClient.interceptors.request.use((config) => {
  const token = authStore.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// ─── Response Interceptor: auto-refresh jika 401 ─────────────────────────────
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: string) => void;
  reject: (reason?: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token!);
    }
  });
  failedQueue = [];
}

apiClient.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config as typeof error.config & {
      _retry?: boolean;
    };

    if (error.response?.status === 401 && !originalRequest._retry) {
      const refreshToken = authStore.getRefreshToken();

      // Tidak ada refresh token → langsung clear dan lempar error
      if (!refreshToken) {
        authStore.clearTokens();
        return Promise.reject(error);
      }

      if (isRefreshing) {
        // Kalau sedang refresh, queue request ini
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then((token) => {
          originalRequest.headers.Authorization = `Bearer ${token}`;
          return apiClient(originalRequest);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        const { data } = await axios.post<{
          accessToken: string;
          refreshToken: string;
        }>(`${BASE_URL}/auth/refresh`, { refreshToken });

        authStore.setTokens(data.accessToken, data.refreshToken);
        processQueue(null, data.accessToken);

        originalRequest.headers.Authorization = `Bearer ${data.accessToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);
        authStore.clearTokens();
        // Redirect ke login jika di browser
        if (typeof window !== "undefined") {
          window.location.href = "/login";
        }
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export default apiClient;
