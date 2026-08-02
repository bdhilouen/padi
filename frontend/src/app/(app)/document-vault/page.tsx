"use client";

import { useState } from "react";
import {
  Upload,
  FileText,
  File,
  Image as ImageIcon,
  Download,
  Trash2,
  Plus,
} from "lucide-react";
import { useDocuments } from "@/hooks/useDocuments";
import { ErrorState } from "@/components/shared/ErrorState";
import { EmptyState } from "@/components/shared/EmptyState";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import type { Document } from "@/types";

const iconByType: Record<string, React.ElementType> = {
  PDF: FileText,
  JPG: ImageIcon,
  PNG: ImageIcon,
};

function DocumentCard({ doc }: { doc: Document }) {
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
          <Button variant="ghost" size="sm" className="flex-1 gap-1.5 text-xs h-8">
            <Download className="h-3.5 w-3.5" strokeWidth={1.5} />
            Unduh
          </Button>
          <Button
            variant="ghost"
            size="sm"
            className="text-xs h-8 text-danger hover:bg-danger/10 hover:text-danger"
          >
            <Trash2 className="h-3.5 w-3.5" strokeWidth={1.5} />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function UploadZone({ onUpload }: { onUpload: () => void }) {
  const [isDragging, setIsDragging] = useState(false);
  return (
    <div
      onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
      onDragLeave={() => setIsDragging(false)}
      onDrop={(e) => { e.preventDefault(); setIsDragging(false); onUpload(); }}
      className={`rounded-xl border-2 border-dashed p-10 text-center transition-colors duration-150 cursor-pointer ${
        isDragging
          ? "border-primary bg-primary/5"
          : "border-border hover:border-primary/50 hover:bg-muted/30"
      }`}
      role="button"
      aria-label="Unggah dokumen"
      onClick={onUpload}
    >
      <Upload className="mx-auto h-8 w-8 text-muted-foreground mb-3" strokeWidth={1.5} />
      <p className="font-medium text-sm text-foreground">Seret & lepas file di sini</p>
      <p className="text-xs text-muted-foreground mt-1">atau klik untuk memilih file</p>
      <p className="text-xs text-muted-foreground mt-2">PDF, JPG, PNG — Maks. 10 MB</p>
    </div>
  );
}

export default function DocumentVaultPage() {
  const { data: docs, isLoading, isError } = useDocuments();

  function handleUpload() {
    // TODO: implement real file upload
    alert("Upload file akan diimplementasikan setelah backend siap.");
  }

  return (
    <div className="px-6 py-8 max-w-5xl mx-auto page-enter">
      <div className="mb-8 flex flex-col items-start justify-between gap-4">
        <div>
          <h1 className="font-sans text-5xl font-bold text-foreground">Dokumen</h1>
          <p className="mt-1 text-muted-foreground">Simpan dan akses dokumen penting Anda.</p>
        </div>
        <Button size="lg" className="gap-2 shrink-0" onClick={handleUpload}>
          <Plus className="h-4 w-4" strokeWidth={1.5} />
          Unggah Dokumen
        </Button>
      </div>

      {/* <UploadZone onUpload={handleUpload} /> */}

      <div className="mt-8">
        <h2 className="font-semibold text-foreground mb-4">Dokumen Tersimpan</h2>

        {isError && <ErrorState />}

        {isLoading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
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
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {docs.map((doc) => (
              <DocumentCard key={doc.id} doc={doc} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
