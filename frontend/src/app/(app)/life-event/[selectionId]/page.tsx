"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, CheckCircle2, Circle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { cn } from "@/lib/utils";
import { useSelectionChecklist, useToggleChecklistItem } from "@/hooks/useLifeEvents";
import type { ApiChecklistItem } from "@/types/api";

function ChecklistItemRow({
  item,
  onToggle,
  isToggling,
}: {
  item: ApiChecklistItem;
  onToggle: (id: string, isCompleted: boolean) => void;
  isToggling: boolean;
}) {
  return (
    <button
      className={cn(
        "flex items-start gap-3 w-full text-left p-3 rounded-lg transition-colors duration-150",
        "hover:bg-muted/50 disabled:opacity-50 disabled:cursor-not-allowed",
        item.is_completed && "opacity-70"
      )}
      onClick={() => onToggle(item.id, !item.is_completed)}
      disabled={isToggling}
    >
      <div className="mt-0.5 shrink-0">
        {isToggling ? (
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
        ) : item.is_completed ? (
          <CheckCircle2 className="h-5 w-5 text-success" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground" />
        )}
      </div>
      <div className="min-w-0">
        <p
          className={cn(
            "text-sm font-medium text-foreground leading-snug",
            item.is_completed && "line-through text-muted-foreground"
          )}
        >
          {item.document_name}
        </p>
        {item.is_required && (
          <span className="text-[10px] text-danger font-medium mt-0.5 inline-block">
            Wajib
          </span>
        )}
        {item.completed_at && (
          <p className="text-xs text-muted-foreground mt-0.5">
            Selesai:{" "}
            {new Date(item.completed_at).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })}
          </p>
        )}
      </div>
    </button>
  );
}

export default function LifeEventChecklistPage({
  params,
}: {
  params: Promise<{ selectionId: string }>;
}) {
  const { selectionId } = use(params);
  const router = useRouter();
  const { data, isLoading } = useSelectionChecklist(selectionId);
  const { mutate: toggleItem, isPending: isToggling } =
    useToggleChecklistItem(selectionId);

  const progressPct = data
    ? Math.round((data.completed_items / Math.max(data.total_items, 1)) * 100)
    : 0;

  function handleToggle(itemId: string, isCompleted: boolean) {
    toggleItem({ itemId, isCompleted });
  }

  return (
    <div className="page-container-narrow page-enter">
      {/* Back button */}
      <Button
        variant="ghost"
        size="sm"
        className="mb-6 gap-1.5 text-muted-foreground -ml-2"
        onClick={() => router.back()}
      >
        <ArrowLeft className="h-4 w-4" strokeWidth={1.5} />
        Kembali
      </Button>

      {isLoading ? (
        <div className="space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-full max-w-sm" />
          <Skeleton className="h-3 w-full rounded-full" />
          <Card>
            <CardContent className="p-4 space-y-3">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex gap-3">
                  <Skeleton className="h-5 w-5 rounded-full shrink-0 mt-0.5" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      ) : data ? (
        <>
          {/* Header */}
          <div className="mb-6">
            <h1 className="font-display text-3xl font-bold text-foreground">
              {data.life_event.name}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {data.life_event.description ?? "Panduan langkah demi langkah untuk Anda."}
            </p>
          </div>

          {/* Progress */}
          <Card className="mb-6">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <p className="text-sm font-medium text-foreground">Progress</p>
                <p className="text-sm font-bold text-primary">
                  {data.completed_items} / {data.total_items} selesai
                </p>
              </div>
              <Progress value={progressPct} className="h-2" />
              {progressPct === 100 && (
                <p className="text-xs text-success font-medium mt-2 flex items-center gap-1">
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  Semua langkah selesai!
                </p>
              )}
            </CardContent>
          </Card>

          {/* Checklist */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base font-semibold">Daftar Dokumen & Langkah</CardTitle>
            </CardHeader>
            <CardContent className="p-4 pt-2 space-y-1">
              {data.checklist
                .sort((a, b) => a.display_order - b.display_order)
                .map((item) => (
                  <ChecklistItemRow
                    key={item.id}
                    item={item}
                    onToggle={handleToggle}
                    isToggling={isToggling}
                  />
                ))}
            </CardContent>
          </Card>
        </>
      ) : (
        <p className="text-muted-foreground">Data tidak ditemukan.</p>
      )}
    </div>
  );
}
