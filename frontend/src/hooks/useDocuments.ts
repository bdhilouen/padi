"use client";

import { useQuery } from "@tanstack/react-query";
import { mockDocuments } from "@/lib/mock-data";
import type { Document } from "@/types";

async function fetchDocuments(): Promise<Document[]> {
  // TODO: replace with real API call
  await new Promise((r) => setTimeout(r, 500));
  return mockDocuments;
}

export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: fetchDocuments,
    staleTime: 2 * 60 * 1000,
  });
}
