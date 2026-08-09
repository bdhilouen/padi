"use client";

import { useRef, useState } from "react";
import {
  Upload,
  FileText,
  File,
  Image as ImageIcon,
  Eye,
  Trash2,
  Plus,
  Loader2,
} from "lucide-react";
import { useDocuments, useUploadDocument, useDeleteDocument, useDocumentPreview } from "@/hooks/useDocuments";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { toast } from "sonner";
import type { Document } from "@/types";

const iconByType: Record<string, React.ElementType> = {
  PDF: FileText,
  JPG: ImageIcon,
  PNG: ImageIcon,
};

function DocumentCard({
  doc,
  onDelete,
  onPreview,
  isDeleting,
}: {
  doc: Document;
  onDelete: () => void;
  onPreview: () => void;
  isDeleting: boolean;
}) {
  const Icon = iconByType[doc.type] ?? File;
  return (
    <Card className="group transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
            <Icon className="h-5 w-5 text-primary" strokeWidth={1.5} />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
            <div className="flex items-center gap-2 mt-1">
              <Badge variant="secondary" className="text-[10px] px-1.5 py-0">
                {doc.type}
              </Badge>
              <span className="text-xs text-muted-foreground">{doc.size}</span>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {new Date(doc.uploadedAt).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "short",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex gap-2 mt-4 pt-3 border-t border-border opacity-0 group-hover:opacity-100 transition-opacity duration-150">
          <Button
            variant="ghost"
            size="sm"
            className="flex-1 gap-1.5 text-xs h-8"
            onClick={onPreview}
          >
            <Eye className="h-3.5 w-3.5" strokeWidth={1.5} />
            Lihat
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-8 text-danger hover:bg-danger/10 hover:text-danger"
            onClick={onDelete}
            disabled={isDeleting}
          >
            {isDeleting ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

export default function DocumentVaultPage() {
  const { data: docs, isLoading, isError } = useDocuments();
  const { mutateAsync: uploadDocument, isPending: isUploading } = useUploadDocument();
  const { mutate: deleteDocument, isPending: isDeleting, variables: deletingId } = useDeleteDocument();
  const { mutateAsync: getPreview } = useDocumentPreview();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewPassword, setPreviewPassword] = useState("");
  const [previewDocId, setPreviewDocId] = useState<string | null>(null);

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      await uploadDocument({
        file,
        documentType: file.name.split(".").pop()?.toUpperCase() ?? "OTHER",
      });
      toast.success("Dokumen berhasil diunggah");
    } catch {
      toast.error("Gagal mengunggah dokumen. Pastikan format dan ukuran file sesuai (PDF/JPG/PNG, maks 10MB).");
    }
    // Reset input
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  async function handlePreview(docId: string) {
    const password = window.prompt("Masukkan password Anda untuk melihat dokumen:");
    if (!password) return;

    try {
      const result = await getPreview({ documentId: docId, password });
      window.open(result.preview_url, "_blank");
    } catch {
      toast.error("Verifikasi gagal. Periksa password Anda.");
    }
  }

  return (
    <div className="page-container-wide page-enter">
      <div className="mb-8 flex flex-col items-start justify-between gap-4">
        <div>
          <h1 className="font-sans text-5xl font-bold text-foreground">Dokumen</h1>
          <p className="mt-1 text-muted-foreground">Simpan dan akses dokumen penting Anda.</p>
        </div>
        <Button
          size="lg"
          className="gap-2 shrink-0"
          onClick={() => fileInputRef.current?.click()}
          disabled={isUploading}
        >
          {isUploading ? (
            <Loader2 className="h-4 w-4 animate-spin" strokeWidth={1.5} />
          ) : (
            <Plus className="h-4 w-4" strokeWidth={1.5} />
          )}
          {isUploading ? "Mengunggah..." : "Unggah Dokumen"}
        </Button>
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.jpg,.jpeg,.png"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div className="mt-8">
        <h2 className="font-semibold text-foreground mb-4">Dokumen Tersimpan</h2>

        {isError && <ErrorState />}

        {isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <Card key={i}>
                <CardContent className="p-4">
                  <div className="flex gap-3">
                    <Skeleton className="h-10 w-10 rounded-lg shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-20" />
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {!isLoading && docs && docs.length === 0 && (
          <EmptyState title="Belum ada dokumen" description="Unggah dokumen pertama Anda." />
        )}

        {!isLoading && docs && docs.length > 0 && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {docs.map((doc) => (
              <DocumentCard
                key={doc.id}
                doc={doc}
                onDelete={() => deleteDocument(doc.id)}
                onPreview={() => handlePreview(doc.id)}
                isDeleting={isDeleting && deletingId === doc.id}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
