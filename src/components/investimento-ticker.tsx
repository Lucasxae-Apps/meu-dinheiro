import { TrendingUp, TrendingDown } from "lucide-react";
import { brl } from "@/lib/finance";
import type { Cotacao } from "@/lib/hooks";

export type TickerItem = {
  label: string;
  value: string;
  tone?: "positive" | "destructive" | "default";
};

function buildItems(
  acumuladoTotal: number,
  metaPct: number,
  acumuladoReserva: number,
  cotacoes: Cotacao[],
): TickerItem[] {
  const items: TickerItem[] = [
    { label: "Patrimônio investido", value: brl(acumuladoTotal) },
    { label: "Meta 100k", value: `${metaPct.toFixed(1)}%` },
    { label: "Reserva de emergência", value: brl(acumuladoReserva) },
  ];
  for (const c of cotacoes) {
    items.push({
      label: c.label,
      value:
        c.variacaoPct !== undefined
          ? `${brl(c.valor)} (${c.variacaoPct >= 0 ? "+" : ""}${c.variacaoPct.toFixed(2)}%)`
          : brl(c.valor),
      tone:
        c.variacaoPct === undefined ? "default" : c.variacaoPct >= 0 ? "positive" : "destructive",
    });
  }
  return items;
}

const toneClass: Record<NonNullable<TickerItem["tone"]>, string> = {
  positive: "text-positive",
  destructive: "text-destructive",
  default: "text-foreground",
};

function Segment({ item }: { item: TickerItem }) {
  const isChange = item.tone === "positive" || item.tone === "destructive";
  return (
    <div className="flex shrink-0 items-center gap-2 px-6 text-sm">
      <span className="text-muted-foreground">{item.label}</span>
      <span
        className={`num flex items-center gap-1 font-semibold ${toneClass[item.tone ?? "default"]}`}
      >
        {isChange &&
          (item.tone === "positive" ? (
            <TrendingUp className="size-3.5" />
          ) : (
            <TrendingDown className="size-3.5" />
          ))}
        {item.value}
      </span>
    </div>
  );
}

export function InvestimentoTicker({
  acumuladoTotal,
  metaPct,
  acumuladoReserva,
  cotacoes,
}: {
  acumuladoTotal: number;
  metaPct: number;
  acumuladoReserva: number;
  cotacoes: Cotacao[];
}) {
  const items = buildItems(acumuladoTotal, metaPct, acumuladoReserva, cotacoes);
  if (items.length === 0) return null;

  return (
    <div className="group relative overflow-hidden rounded-full border bg-card">
      <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-8 bg-gradient-to-r from-card to-transparent" />
      <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-8 bg-gradient-to-l from-card to-transparent" />
      <div className="flex w-max animate-[ticker-scroll_32s_linear_infinite] py-2.5 group-hover:[animation-play-state:paused]">
        {[...items, ...items].map((item, i) => (
          <Segment key={`${item.label}-${i}`} item={item} />
        ))}
      </div>
    </div>
  );
}
