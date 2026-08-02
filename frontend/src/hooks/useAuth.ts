"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { ROUTES } from "@/constants";
import { mockUser } from "@/lib/mock-data";
import type { User } from "@/types";

const AUTH_KEY = "citizenhub_auth";

export function useAuth() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const stored = localStorage.getItem(AUTH_KEY);
    if (stored === "true") {
      setIsAuthenticated(true);
      setUser(mockUser);
    }
    setIsLoading(false);
  }, []);

  const login = useCallback(async (_nik: string, _email: string, _password: string) => {
    // TODO: replace with real API call
    await new Promise((r) => setTimeout(r, 800));
    localStorage.setItem(AUTH_KEY, "true");
    setIsAuthenticated(true);
    setUser(mockUser);
    router.push(ROUTES.CONSENT);
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem(AUTH_KEY);
    setIsAuthenticated(false);
    setUser(null);
    router.push(ROUTES.LOGIN);
  }, [router]);

  return { isAuthenticated, user, isLoading, login, logout };
}
