"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import { authStore } from "@/lib/auth-store";
import type { ApiUserProfile } from "@/types/api";

/** GET /users/me */
export function useProfile() {
  return useQuery({
    queryKey: ["profile"],
    queryFn: async (): Promise<ApiUserProfile> => {
      const { data } = await apiClient.get<ApiUserProfile>("/users/me");
      authStore.setUser(data); // keep localStorage in sync
      return data;
    },
    staleTime: 5 * 60 * 1000,
  });
}

/** PATCH /users/me — update full_name dan/atau phone_number */
export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (dto: {
      full_name?: string;
      phone_number?: string;
    }): Promise<ApiUserProfile> => {
      const { data } = await apiClient.patch<ApiUserProfile>("/users/me", dto);
      authStore.setUser(data);
      return data;
    },
    onSuccess: (data) => {
      queryClient.setQueryData(["profile"], data);
    },
  });
}

/** PATCH /users/me/password */
export function useChangePassword() {
  return useMutation({
    mutationFn: async (dto: {
      old_password: string;
      new_password: string;
      confirm_password: string;
    }): Promise<{ message: string }> => {
      const { data } = await apiClient.patch<{ message: string }>(
        "/users/me/password",
        dto
      );
      return data;
    },
  });
}
