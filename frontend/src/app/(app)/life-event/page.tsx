import { Heart, Baby, Home, Briefcase, ChevronRight } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { mockLifeEvents } from "@/lib/mock-data";

const iconMap: Record<string, React.ElementType> = {
  Heart,
  Baby,
  Home,
  Briefcase,
};

export default function LifeEventPage() {
  return (
    <div className="px-6 py-8 max-w-4xl mx-auto page-enter">
      <div className="mb-8">
        <h1 className="font-display text-3xl font-bold text-foreground">Life Event</h1>
        <p className="mt-1 text-muted-foreground">
          Panduan administrasi untuk peristiwa penting dalam hidup Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        {mockLifeEvents.map((event) => {
          const Icon = iconMap[event.icon] ?? Heart;
          return (
            <Card
              key={event.id}
              className="group cursor-pointer transition-all duration-150 hover:-translate-y-0.5 hover:shadow-sm"
            >
              <CardContent className="p-6">
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-start gap-4">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-6 w-6 text-primary" strokeWidth={1.5} />
                    </div>
                    <div>
                      <h2 className="font-semibold text-foreground">{event.title}</h2>
                      <p className="text-sm text-muted-foreground mt-0.5">{event.description}</p>
                    </div>
                  </div>
                  <Badge variant="secondary" className="shrink-0 text-xs">
                    {event.category}
                  </Badge>
                </div>

                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">
                    Langkah-langkah:
                  </p>
                  {event.steps.map((step, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <span className="mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[10px] font-bold text-primary">
                        {idx + 1}
                      </span>
                      <p className="text-xs text-muted-foreground leading-snug">{step}</p>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-3 border-t border-border flex items-center gap-1 text-xs font-medium text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  Lihat panduan lengkap <ChevronRight className="h-3.5 w-3.5" />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
