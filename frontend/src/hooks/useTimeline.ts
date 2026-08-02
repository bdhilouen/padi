"use client";

import { useQuery } from "@tanstack/react-query";
import { mockTimeline } from "@/lib/mock-data";

async function fetchTimeline() {
  // TODO: replace with real API call
  await new Promise((r) => setTimeout(r, 500));
  return mockTimeline;
}

export function useTimeline() {
  return useQuery({
    queryKey: ["timeline"],
    queryFn: fetchTimeline,
    staleTime: 5 * 60 * 1000,
  });
}
