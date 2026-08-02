"use client";

import { useQuery } from "@tanstack/react-query";
import { mockServices } from "@/lib/mock-data";

async function fetchDashboard() {
  // TODO: replace with real API call
  await new Promise((r) => setTimeout(r, 600));
  return mockServices;
}

export function useDashboard() {
  return useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    staleTime: 5 * 60 * 1000,
  });
}
