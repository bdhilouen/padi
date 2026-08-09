"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type {
  ApiDocument,
  ApiPreviewUrlResponse,
} from "@/types/api";
import type { Document } from "@/types";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function mimeToType(mime: string): string {
  switch (mime) {
    case "application/pdf":
      return "PDF";
    case "image/jpeg":
      return "JPG";
    case "image/png":
      return "PNG";
    default:
      return mime.split("/")[1]?.toUpperCase() ?? "FILE";
  }
}

function deriveCategoryFromType(documentType: string): string {
  const type = documentType.toUpperCase();
  if (["KTP", "KK", "AKTA_LAHIR", "PASPOR"].includes(type)) return "Identitas";
  if (["STNK", "SIM", "BPKB"].includes(type)) return "Kendaraan";
  if (["NPWP", "SPT"].includes(type)) return "Pajak";
  if (["BPJS", "KARTU_BPJS"].includes(type)) return "Kesehatan";
  if (["PASPOR"].includes(type)) return "Perjalanan";
  return documentType;
}

// ─── Transform ────────────────────────────────────────────────────────────────

function transformDocument(doc: ApiDocument): Document {
  return {
    id: doc.id,
    name: doc.original_filename,
    type: mimeToType(doc.mime_type),
    size: formatBytes(doc.file_size),
    uploadedAt: doc.uploaded_at,
    category: deriveCategoryFromType(doc.document_type),
    mimeType: doc.mime_type,
    expiryDate: doc.expiry_date,
  };
}

// ─── Fetch ────────────────────────────────────────────────────────────────────

async function fetchDocuments(): Promise<Document[]> {
  const { data } = await apiClient.get<ApiDocument[]>("/documents");
  return data.map(transformDocument);
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useDocuments() {
  return useQuery({
    queryKey: ["documents"],
    queryFn: fetchDocuments,
    staleTime: 2 * 60 * 1000,
  });
}

export function useUploadDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      file,
      documentType,
      expiryDate,
    }: {
      file: File;
      documentType: string;
      expiryDate?: string;
    }) => {
      const formData = new FormData();
      formData.append("file", file);
      formData.append("document_type", documentType);
      if (expiryDate) formData.append("expiry_date", expiryDate);

      const { data } = await apiClient.post<ApiDocument>("/documents", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return transformDocument(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useDeleteDocument() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (documentId: string) => {
      await apiClient.delete(`/documents/${documentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["documents"] });
    },
  });
}

export function useDocumentPreview() {
  return useMutation({
    mutationFn: async ({
      documentId,
      password,
    }: {
      documentId: string;
      password: string;
    }) => {
      const { data } = await apiClient.post<ApiPreviewUrlResponse>(
        `/documents/${documentId}/verify`,
        { password }
      );
      return data;
    },
  });
}
