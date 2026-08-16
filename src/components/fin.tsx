import type { ReactNode } from "react";
import { brl } from "@/lib/finance";
import { cn } from "@/lib/utils";

export function Stat({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: number | string;
  hint?: ReactNode;
  tone?: "default" | "positive" | "warn" | "destructive" | "muted";
}) {
  const toneClass = {
    default: "text-foreground",
    positive: "text-positive",
    warn: "text-warn",
    destructive: "text-destructive",
    muted: "text-muted-foreground",
  }[tone];
  return (
    <div className="rounded-xl border bg-card p-4">
      <p className="text-[11px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className={cn("num mt-2 text-xl font-semibold", toneClass)}>
        {typeof value === "number" ? brl(value) : value}
      </p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function Bar({ value, tone = "primary" }: { value: number; tone?: "primary" | "warn" | "destructive" }) {
  const pct = Math.max(0, Math.min(100, value));
  const bg = { primary: "bg-primary", warn: "bg-warn", destructive: "bg-destructive" }[tone];
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
      <div className={cn("h-full rounded-full transition-all", bg)} style={{ width: `${pct}%` }} />
    </div>
  );
}

export function Section({
  title,
  description,
  children,
  action,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
          {description ? <p className="text-xs text-muted-foreground">{description}</p> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

export function PageHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <header className="space-y-1">
      <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
      {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
    </header>
  );
}
