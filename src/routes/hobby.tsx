import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Check,
  Loader2,
  Plus,
  ShoppingBag,
  Star,
  Tag,
  Target,
  Trash2,
  TrendingUp,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { brl, nomeMes, parseValor } from "@/lib/finance";
import { useMes } from "@/lib/mes-context";
import {
  useHobbyBudget,
  useUpsertHobbyBudget,
  useHobbyWishlist,
  useAddHobbyWishlist,
  useUpdateHobbyWishlist,
  useDeleteHobbyWishlist,
  useHobbyCompras,
  useAddHobbyCompra,
  useDeleteHobbyCompra,
  useHobbyEstoque,
  useAddHobbyEstoque,
  useUpsertHobbyEstoque,
  useHobbyVendas,
  useAddHobbyVenda,
  useUpdateHobbyVenda,
  useDeleteHobbyVenda,
  useHobbyColecao,
  useAddHobbyCard,
  useDeleteHobbyCard,
  useHobbyMetas,
  useAddHobbyMeta,
  useUpdateHobbyMeta,
  useDeleteHobbyMeta,
  type HobbyCategoria,
  type HobbyTipoCompra,
  type WishlistPrioridade,
  type VendaStatus,
  type HobbyEstoque,
  type HobbyVenda,
  type HobbyCard,
  type CardTipo,
  type HobbyMeta,
} from "@/lib/hooks/use-hobby";

export const Route = createFileRoute("/hobby")({
  head: () => ({
    meta: [
      { title: "Hobby — Controle financeiro pessoal" },
      { name: "description", content: "Colecionáveis: orçamento, wishlist, compras, estoque e vendas." },
    ],
  }),
  component: Hobby,
});

const CATEGORIAS: { value: HobbyCategoria; label: string }[] = [
  { value: "singles", label: "Singles" },
  { value: "packs", label: "Packs" },
  { value: "acessorios", label: "Acessórios" },
  { value: "frete", label: "Frete" },
  { value: "outros", label: "Outros" },
];

const PRIORIDADES: { value: WishlistPrioridade; label: string; color: string }[] = [
  { value: "favorito", label: "favorito", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  { value: "raro", label: "raro", color: "bg-red-500/20 text-red-400 border-red-500/30" },
  { value: "completar_time", label: "completar time", color: "bg-blue-500/20 text-blue-400 border-blue-500/30" },
  { value: "visual", label: "visual", color: "bg-purple-500/20 text-purple-400 border-purple-500/30" },
];

const CAT_COLORS: Record<HobbyCategoria, string> = {
  singles: "#3b82f6",
  packs: "#a855f7",
  acessorios: "#f59e0b",
  frete: "#6b7280",
  outros: "#ec4899",
};

const CARD_TIPOS: { value: CardTipo; label: string }[] = [
  { value: "base", label: "Base" },
  { value: "numbered", label: "Numbered" },
  { value: "limited", label: "Limited" },
  { value: "auto", label: "Auto" },
  { value: "relic", label: "Relic" },
  { value: "insert", label: "Insert" },
];

const TIPO_COLORS: Record<CardTipo, string> = {
  base: "bg-gray-500/20 text-gray-400 border-gray-500/30",
  numbered: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  limited: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  auto: "bg-green-500/20 text-green-400 border-green-500/30",
  relic: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  insert: "bg-blue-500/20 text-blue-400 border-blue-500/30",
};

const hoje = () => new Date().toISOString().slice(0, 10);

function Hobby() {
  const { mes } = useMes();
  const { data: budget, isLoading: lb } = useHobbyBudget(mes);
  const { data: compras = [], isLoading: lc } = useHobbyCompras(mes);
  const { data: wishlist = [], isLoading: lw } = useHobbyWishlist();
  const { data: estoque = [], isLoading: le } = useHobbyEstoque();
  const { data: vendas = [], isLoading: lv } = useHobbyVendas();
  const { data: colecao = [], isLoading: lCol } = useHobbyColecao();
  const { data: metas = [], isLoading: lMet } = useHobbyMetas();

  const upsertBudget = useUpsertHobbyBudget();
  const addCompra = useAddHobbyCompra(mes);
  const deleteCompra = useDeleteHobbyCompra(mes);
  const addWishlist = useAddHobbyWishlist();
  const updateWishlist = useUpdateHobbyWishlist();
  const deleteWishlist = useDeleteHobbyWishlist();
  const addEstoque = useAddHobbyEstoque();
  const upsertEstoque = useUpsertHobbyEstoque();
  const addVenda = useAddHobbyVenda();
  const updateVenda = useUpdateHobbyVenda();
  const deleteVenda = useDeleteHobbyVenda();
  const addCard = useAddHobbyCard();
  const deleteCard = useDeleteHobbyCard();
  const addMeta = useAddHobbyMeta();
  const updateMeta = useUpdateHobbyMeta();
  const deleteMeta = useDeleteHobbyMeta();

  const isLoading = lb || lc || lw || le || lv || lCol || lMet;

  // Budget derived
  const limite = budget?.valorLimite ?? 300;
  const gastoTotal = compras.reduce((a, c) => a + c.valor, 0);
  const restante = limite - gastoTotal;
  const pctUsado = limite > 0 ? (gastoTotal / limite) * 100 : 0;
  const totalDots = 30;
  const filledDots = Math.round((pctUsado / 100) * totalDots);

  const gastoPorCategoria = useMemo(() => {
    const m = new Map<HobbyCategoria, number>();
    for (const c of compras) m.set(c.categoria, (m.get(c.categoria) ?? 0) + c.valor);
    return m;
  }, [compras]);

  // Wishlist sorted
  const prioridadeOrdem: WishlistPrioridade[] = ["favorito", "raro", "completar_time", "visual"];
  const sortedWishlist = useMemo(
    () => [...wishlist].sort((a, b) => prioridadeOrdem.indexOf(a.prioridade) - prioridadeOrdem.indexOf(b.prioridade)),
    [wishlist],
  );
  const p1Item = sortedWishlist[0];

  // Compras agrupadas por data
  const comprasAgrupadas = useMemo(() => {
    const grupos = new Map<string, typeof compras>();
    for (const c of compras) {
      const key = c.data;
      if (!grupos.has(key)) grupos.set(key, []);
      grupos.get(key)!.push(c);
    }
    return Array.from(grupos.entries()).sort((a, b) => b[0].localeCompare(a[0]));
  }, [compras]);

  // Coleção por piloto
  const colecaoPorPiloto = useMemo(() => {
    const m = new Map<string, HobbyCard[]>();
    for (const c of colecao) {
      if (!m.has(c.piloto)) m.set(c.piloto, []);
      m.get(c.piloto)!.push(c);
    }
    return Array.from(m.entries()).sort((a, b) => b[1].length - a[1].length);
  }, [colecao]);

  // Cost vs Market
  const totalPago = colecao.reduce((a, c) => a + (c.valorPago ?? 0) * c.quantidade, 0);
  const totalMercado = colecao.reduce((a, c) => a + (c.valorEstimado ?? 0) * c.quantidade, 0);
  const totalCards = colecao.reduce((a, c) => a + c.quantidade, 0);
  const lucroColecao = totalMercado - totalPago;

  // Vendas
  const vendasPendentes = vendas.filter((v) => v.status !== "vendido");
  const totalPendente = vendasPendentes.reduce((a, v) => a + v.valorPedido, 0);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <header>
        <p className="text-[11px] font-bold uppercase tracking-[0.2em] text-primary">Hobby</p>
        <h1 className="text-2xl font-bold tracking-tight">Formula 1</h1>
        <p className="text-xs text-muted-foreground">
          {nomeMes(mes)} · colecionáveis{p1Item ? " · P1 no orçamento" : ""}
        </p>
        <div className="mt-2 flex flex-wrap gap-0.5">
          {Array.from({ length: totalDots }).map((_, i) => (
            <span
              key={i}
              className={`inline-block size-2 rounded-full ${
                i < filledDots ? "bg-primary" : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>
      </header>

      {/* Desktop: 2 rows layout */}
      {/* Row 1: Hero + Cost vs Market + Metas */}
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {/* Hero Card */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-start justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Ainda posso gastar
            </p>
            <BudgetEditor mes={mes} limite={limite} onSave={(v) => upsertBudget.mutate({ mes, valorLimite: v })} />
          </div>
          <p className={`num mt-1 text-3xl font-bold ${restante < 0 ? "text-destructive" : "text-foreground"}`}>
            {brl(restante)}
          </p>
          <p className="num mt-1.5 text-xs text-muted-foreground">
            {brl(gastoTotal)} de {brl(limite)} usados · {compras.length} compra(s)
          </p>
          {gastoTotal > 0 && (
            <div className="mt-3 space-y-1.5">
              <div className="flex h-2 overflow-hidden rounded-full bg-muted">
                {CATEGORIAS.map(({ value }) => {
                  const val = gastoPorCategoria.get(value) ?? 0;
                  if (val === 0) return null;
                  return (
                    <div
                      key={value}
                      className="h-full transition-all"
                      style={{ width: `${Math.min((val / limite) * 100, 100)}%`, backgroundColor: CAT_COLORS[value] }}
                    />
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                {CATEGORIAS.map(({ value, label }) => {
                  const val = gastoPorCategoria.get(value) ?? 0;
                  if (val === 0) return null;
                  return (
                    <span key={value} className="flex items-center gap-1 text-[10px] text-muted-foreground">
                      <span className="size-1.5 rounded-full" style={{ backgroundColor: CAT_COLORS[value] }} />
                      {label}: <span className="num font-medium text-foreground">{brl(val)}</span>
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Custo vs Mercado */}
        <div className="rounded-xl border bg-card p-5">
          <div className="flex items-center gap-2">
            <TrendingUp className="size-4 text-muted-foreground" />
            <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
              Acervo
            </p>
          </div>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] text-muted-foreground">Investido</p>
              <p className="num text-lg font-bold">{brl(totalPago)}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground">Valor atual</p>
              <p className="num text-lg font-bold">{brl(totalMercado)}</p>
            </div>
          </div>
          <div className="mt-3 flex items-baseline justify-between border-t pt-3">
            <span className="text-[10px] text-muted-foreground">{totalCards} cards no acervo</span>
            <span className={`num text-sm font-semibold ${lucroColecao >= 0 ? "text-positive" : "text-destructive"}`}>
              {lucroColecao >= 0 ? "+" : ""}{brl(lucroColecao)}
            </span>
          </div>
        </div>

        {/* Metas */}
        <div className="space-y-3 md:col-span-2 xl:col-span-1">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="size-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold tracking-tight">Metas</h2>
            </div>
            <MetaForm onAdd={(m) => addMeta.mutate(m)} />
          </div>
          <div className="space-y-2">
            {metas.length === 0 && (
              <p className="rounded-xl border bg-card/50 p-3 text-xs text-muted-foreground">
                Nenhuma meta definida.
              </p>
            )}
            {metas.filter((m) => !m.concluida).map((m) => {
              const pct = m.total > 0 ? (m.atual / m.total) * 100 : 0;
              return (
                <div key={m.id} className="rounded-xl border bg-card p-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{m.titulo}</p>
                      {m.descricao && <p className="truncate text-[10px] text-muted-foreground">{m.descricao}</p>}
                    </div>
                    <span className="num whitespace-nowrap text-[10px] text-muted-foreground">
                      {m.atual}/{m.total}
                    </span>
                  </div>
                  <div className="mt-2 flex h-1.5 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary transition-all"
                      style={{ width: `${Math.min(pct, 100)}%` }}
                    />
                  </div>
                  <div className="mt-1.5 flex items-center justify-between">
                    <span className="num text-[10px] text-muted-foreground">{pct.toFixed(0)}%</span>
                    <div className="flex gap-1">
                      <button
                        className="text-[10px] text-muted-foreground hover:text-foreground"
                        onClick={() => updateMeta.mutate({ ...m, atual: Math.min(m.atual + 1, m.total) })}
                      >
                        +1
                      </button>
                      <button
                        className="text-muted-foreground hover:text-positive"
                        onClick={() => updateMeta.mutate({ ...m, concluida: true })}
                        aria-label="Concluir meta"
                      >
                        <Check className="size-3" />
                      </button>
                      <button
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => deleteMeta.mutate(m.id)}
                        aria-label="Remover meta"
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Row 2: Coleção, Compras agrupadas, Wishlist + Estoque + Vendas */}
      <div className="grid gap-6 xl:grid-cols-3">
        {/* Col 1: Coleção por piloto */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Coleção</h2>
              <p className="text-xs text-muted-foreground">{totalCards} cards · por piloto</p>
            </div>
            <CardForm onAdd={(c) => addCard.mutate(c)} isPending={addCard.isPending} />
          </div>
          <div className="space-y-3 xl:max-h-[calc(100vh-360px)] xl:overflow-y-auto xl:pr-1">
            {colecaoPorPiloto.length === 0 && (
              <p className="rounded-xl border bg-card/50 p-4 text-sm text-muted-foreground">
                Nenhum card catalogado.
              </p>
            )}
            {colecaoPorPiloto.map(([piloto, cards]) => (
              <div key={piloto} className="rounded-xl border bg-card">
                <div className="flex items-baseline justify-between border-b px-3 py-2">
                  <span className="text-xs font-semibold">{piloto}</span>
                  <span className="num text-[10px] text-muted-foreground">{cards.length} card(s)</span>
                </div>
                <ul className="divide-y">
                  {cards.map((card) => (
                    <li key={card.id} className="flex items-center gap-2 px-3 py-2">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs">{card.nome}</p>
                        <div className="mt-0.5 flex items-center gap-1.5">
                          <span className={`rounded-full border px-1.5 py-0 text-[9px] font-medium ${TIPO_COLORS[card.tipo]}`}>
                            {card.tipo}{card.numeracao ? ` ${card.numeracao}` : ""}
                          </span>
                          <span className="text-[9px] text-muted-foreground">{card.setColecao}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        {card.valorEstimado != null && (
                          <p className="num text-xs font-medium">{brl(card.valorEstimado)}</p>
                        )}
                        {card.valorPago != null && card.valorEstimado != null && card.valorEstimado > card.valorPago && (
                          <p className="num text-[9px] text-positive">
                            +{brl(card.valorEstimado - card.valorPago)}
                          </p>
                        )}
                      </div>
                      <button
                        aria-label="Remover card"
                        className="text-muted-foreground hover:text-destructive"
                        onClick={() => deleteCard.mutate(card.id)}
                      >
                        <Trash2 className="size-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>

        {/* Col 2: Boxes desse mês (agrupado por data) + Wishlist */}
        <div className="space-y-6">
          <section>
            <div className="mb-3">
              <h2 className="text-sm font-semibold tracking-tight">Boxes desse mês</h2>
              <p className="text-xs text-muted-foreground">
                {compras.length} item(ns) · {brl(gastoTotal)}
              </p>
            </div>
            <div className="space-y-2 xl:max-h-[calc(100vh-440px)] xl:overflow-y-auto xl:pr-1">
              {comprasAgrupadas.length === 0 && (
                <div className="flex items-center justify-center rounded-xl border bg-card/50 p-8">
                  <p className="text-sm text-muted-foreground">Garagem vazia esse mês.</p>
                </div>
              )}
              {comprasAgrupadas.map(([data, items]) => {
                const totalGrupo = items.reduce((a, c) => a + c.valor, 0);
                return (
                  <div key={data} className="rounded-xl border bg-card">
                    <div className="flex items-baseline justify-between border-b px-3 py-2">
                      <span className="text-[10px] text-muted-foreground">
                        {data.split("-").reverse().join("/")}
                      </span>
                      <span className="num text-[10px] font-medium">
                        {items.length} item(ns) · {brl(totalGrupo)}
                      </span>
                    </div>
                    <ul className="divide-y">
                      {items.map((c) => (
                        <li key={c.id} className="flex items-center gap-2 px-3 py-2">
                          <span className="size-2 rounded-full" style={{ backgroundColor: CAT_COLORS[c.categoria] }} />
                          <span className="min-w-0 flex-1 truncate text-xs">{c.descricao}</span>
                          <span className="num text-xs font-medium">{brl(c.valor)}</span>
                          <button
                            aria-label="Remover"
                            className="text-muted-foreground hover:text-destructive"
                            onClick={() => deleteCompra.mutate(c.id)}
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
            </div>
            <div className="mt-3">
              <CompraForm onAdd={(c) => addCompra.mutate(c)} isPending={addCompra.isPending} />
            </div>
          </section>

          {/* Wishlist */}
          <section>
            <div className="mb-3">
              <h2 className="text-sm font-semibold tracking-tight">Wishlist</h2>
              <p className="text-xs text-muted-foreground">
                {sortedWishlist.length} na fila · favorito primeiro
              </p>
            </div>
            <div className="space-y-2">
              {sortedWishlist.length === 0 && (
                <p className="rounded-xl border bg-card p-4 text-sm text-muted-foreground">
                  Wishlist vazia — bora preencher!
                </p>
              )}
              {sortedWishlist.map((item, idx) => {
                const prioColor = PRIORIDADES.find((p) => p.value === item.prioridade)?.color ?? "";
                const prioLabel = PRIORIDADES.find((p) => p.value === item.prioridade)?.label ?? "";
                return (
                  <div key={item.id} className="flex items-center gap-3 rounded-xl border bg-card p-3">
                    <span className="num text-xs font-medium text-muted-foreground">P{idx + 1}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">{item.nome}</p>
                      <span className={`mt-0.5 inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium ${prioColor}`}>
                        {prioLabel}
                      </span>
                    </div>
                    <span className="num text-sm text-muted-foreground">
                      {item.precoMedio ? `~${brl(item.precoMedio)}` : "a definir"}
                    </span>
                    <button
                      aria-label="Comprado"
                      className="text-muted-foreground hover:text-positive"
                      onClick={() => updateWishlist.mutate({ ...item, status: "comprado" })}
                    >
                      <Check className="size-4" />
                    </button>
                    <button
                      aria-label="Remover"
                      className="text-muted-foreground hover:text-destructive"
                      onClick={() => deleteWishlist.mutate(item.id)}
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </div>
                );
              })}
            </div>
            <div className="mt-3">
              <WishlistForm onAdd={(item) => addWishlist.mutate(item)} isPending={addWishlist.isPending} />
            </div>
          </section>
        </div>

        {/* Col 3: Estoque + Vendas */}
        <div className="space-y-6 md:col-span-2 xl:col-span-1">
          {/* Estoque */}
          <section>
            <div className="mb-3">
              <h2 className="text-sm font-semibold tracking-tight">Estoque de acessórios</h2>
              <p className="text-xs text-muted-foreground">sleeves, top loaders</p>
            </div>
            <div className="grid grid-cols-2 gap-3">
              {estoque.map((item) => {
                const isLow = item.quantidade <= item.quantidadeMinima;
                return (
                  <div
                    key={item.id}
                    className={`rounded-xl border p-4 ${isLow ? "border-red-500/40 bg-red-500/5" : "bg-card"}`}
                  >
                    <p className="text-[10px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {item.tipo.replace(/_/g, " ")}
                    </p>
                    <div className="mt-1 flex items-center gap-2">
                      <button
                        className="rounded border px-1.5 py-0.5 text-xs hover:bg-accent"
                        onClick={() => upsertEstoque.mutate({ ...item, quantidade: Math.max(0, item.quantidade - 1) })}
                      >
                        −
                      </button>
                      <span className={`num text-2xl font-bold ${isLow ? "text-red-400" : "text-foreground"}`}>
                        {item.quantidade}
                      </span>
                      <button
                        className="rounded border px-1.5 py-0.5 text-xs hover:bg-accent"
                        onClick={() => upsertEstoque.mutate({ ...item, quantidade: item.quantidade + 1 })}
                      >
                        +
                      </button>
                    </div>
                    {isLow && <p className="mt-1 text-[10px] font-medium text-red-400">estoque baixo</p>}
                  </div>
                );
              })}
            </div>
            {estoque.length === 0 && (
              <p className="mt-2 text-sm text-muted-foreground">Nenhum acessório cadastrado.</p>
            )}
            <div className="mt-3">
              <EstoqueForm onAdd={(e) => addEstoque.mutate(e)} />
            </div>
          </section>

          {/* Vendendo */}
          <section>
            <div className="mb-3">
              <h2 className="text-sm font-semibold tracking-tight">Vendendo</h2>
              <p className="text-xs text-muted-foreground">
                {vendas.length} iten(s) · {brl(totalPendente)} a receber
              </p>
            </div>
            <div className="space-y-2">
              {vendas.length === 0 && (
                <div className="flex items-center justify-center rounded-xl border bg-card/50 p-6">
                  <p className="text-sm text-muted-foreground">Nenhuma venda registrada.</p>
                </div>
              )}
              {vendas.map((v) => (
                <VendaItem
                  key={v.id}
                  venda={v}
                  onUpdate={(updated) => updateVenda.mutate(updated)}
                  onDelete={() => deleteVenda.mutate(v.id)}
                />
              ))}
            </div>
            <div className="mt-3">
              <VendaForm onAdd={(v) => addVenda.mutate(v)} isPending={addVenda.isPending} />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}

// ── Sub-components ──

function BudgetEditor({ mes, limite, onSave }: { mes: string; limite: number; onSave: (v: number) => void }) {
  const [editing, setEditing] = useState(false);
  const [val, setVal] = useState("");

  if (!editing) {
    return (
      <span className="rounded-md border border-primary/30 bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
        <button onClick={() => { setEditing(true); setVal(String(limite)); }}>
          P1
        </button>
      </span>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Input inputMode="decimal" value={val} onChange={(e) => setVal(e.target.value)} className="h-7 w-24 text-xs" placeholder="Limite" />
      <button className="text-positive" onClick={() => { onSave(parseValor(val)); setEditing(false); }}>
        <Check className="size-4" />
      </button>
      <button className="text-muted-foreground" onClick={() => setEditing(false)}>
        <X className="size-4" />
      </button>
    </div>
  );
}

function CardForm({ onAdd, isPending }: { onAdd: (c: Omit<HobbyCard, "id">) => void; isPending: boolean }) {
  const [open, setOpen] = useState(false);
  const [piloto, setPiloto] = useState("");
  const [nome, setNome] = useState("");
  const [setColecao, setSetColecao] = useState("Topps NOW");
  const [tipo, setTipo] = useState<CardTipo>("base");
  const [numeracao, setNumeracao] = useState("");
  const [valorPago, setValorPago] = useState("");
  const [valorEstimado, setValorEstimado] = useState("");

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="border-dashed text-xs" onClick={() => setOpen(true)}>
        <Plus className="mr-1 size-3" /> card
      </Button>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!piloto.trim() || !nome.trim()) return;
    onAdd({
      piloto: piloto.trim(),
      nome: nome.trim(),
      setColecao: setColecao.trim() || "Topps",
      tipo,
      numeracao: numeracao.trim() || undefined,
      valorPago: valorPago ? parseValor(valorPago) : undefined,
      valorEstimado: valorEstimado ? parseValor(valorEstimado) : undefined,
      dataAquisicao: hoje(),
      quantidade: 1,
    });
    setPiloto("");
    setNome("");
    setNumeracao("");
    setValorPago("");
    setValorEstimado("");
    setOpen(false);
  }

  return (
    <form onSubmit={submit} className="space-y-2 rounded-xl border bg-muted/30 p-3">
      <div className="grid grid-cols-2 gap-2">
        <Input value={piloto} onChange={(e) => setPiloto(e.target.value)} placeholder="Piloto" className="h-8 text-xs" />
        <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Nome do card" className="h-8 text-xs" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input value={setColecao} onChange={(e) => setSetColecao(e.target.value)} placeholder="Set (Topps NOW)" className="h-8 text-xs" />
        <Input value={numeracao} onChange={(e) => setNumeracao(e.target.value)} placeholder="Numeração /99" className="h-8 text-xs" />
      </div>
      <div className="flex flex-wrap gap-1">
        {CARD_TIPOS.map((t) => (
          <button
            key={t.value}
            type="button"
            onClick={() => setTipo(t.value)}
            className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
              tipo === t.value ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-2 gap-2">
        <Input inputMode="decimal" value={valorPago} onChange={(e) => setValorPago(e.target.value)} placeholder="Pago (R$)" className="h-8 text-xs" />
        <Input inputMode="decimal" value={valorEstimado} onChange={(e) => setValorEstimado(e.target.value)} placeholder="Vale hoje (R$)" className="h-8 text-xs" />
      </div>
      <div className="flex gap-2">
        <Button size="sm" type="submit" disabled={isPending}>Salvar</Button>
        <Button size="sm" variant="ghost" type="button" onClick={() => setOpen(false)}>Cancelar</Button>
      </div>
    </form>
  );
}

function MetaForm({ onAdd }: { onAdd: (m: Omit<HobbyMeta, "id">) => void }) {
  const [open, setOpen] = useState(false);
  const [titulo, setTitulo] = useState("");
  const [total, setTotal] = useState("10");

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="border-dashed text-xs" onClick={() => setOpen(true)}>
        <Plus className="mr-1 size-3" /> meta
      </Button>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!titulo.trim() || !Number(total)) return;
    onAdd({ titulo: titulo.trim(), total: Number(total), atual: 0, concluida: false });
    setTitulo("");
    setTotal("10");
    setOpen(false);
  }

  return (
    <form onSubmit={submit} className="flex items-center gap-2">
      <Input value={titulo} onChange={(e) => setTitulo(e.target.value)} placeholder="Meta..." className="h-7 text-xs" />
      <Input type="number" value={total} onChange={(e) => setTotal(e.target.value)} className="h-7 w-14 text-xs" />
      <Button size="sm" type="submit" className="h-7 text-xs">Ok</Button>
      <button type="button" className="text-muted-foreground" onClick={() => setOpen(false)}>
        <X className="size-4" />
      </button>
    </form>
  );
}

function CompraForm({ onAdd, isPending }: { onAdd: (c: any) => void; isPending: boolean }) {
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [valor, setValor] = useState("");
  const [categoria, setCategoria] = useState<HobbyCategoria>("singles");
  const [tipo, setTipo] = useState<HobbyTipoCompra>("planejada");
  const [data, setData] = useState(hoje);

  if (!open) {
    return (
      <Button variant="outline" className="w-full border-dashed text-sm font-medium" onClick={() => setOpen(true)}>
        <Plus className="mr-1.5 size-4" /> nova compra
      </Button>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = parseValor(valor);
    if (!desc.trim() || !v) return;
    onAdd({ descricao: desc.trim(), valor: v, categoria, tipo, data });
    setDesc("");
    setValor("");
    setOpen(false);
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border bg-muted/30 p-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Descrição</Label>
          <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Norris Topps..." />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Valor</Label>
          <Input inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Categoria</Label>
          <div className="flex flex-wrap gap-1">
            {CATEGORIAS.map((c) => (
              <button
                key={c.value}
                type="button"
                onClick={() => setCategoria(c.value)}
                className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
                  categoria === c.value ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Tipo</Label>
          <div className="flex gap-1">
            {(["planejada", "impulsiva"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTipo(t)}
                className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
                  tipo === t ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      </div>
      <Input type="date" value={data} onChange={(e) => setData(e.target.value)} className="h-8 text-xs" />
      <div className="flex gap-2">
        <Button size="sm" type="submit" disabled={isPending}>
          <ShoppingBag className="mr-1 size-3" /> Adicionar
        </Button>
        <Button size="sm" variant="ghost" type="button" onClick={() => setOpen(false)}>Cancelar</Button>
      </div>
    </form>
  );
}

function WishlistForm({ onAdd, isPending }: { onAdd: (item: any) => void; isPending: boolean }) {
  const [open, setOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [prioridade, setPrioridade] = useState<WishlistPrioridade>("visual");
  const [preco, setPreco] = useState("");

  if (!open) {
    return (
      <Button variant="outline" size="sm" className="w-full border-dashed text-sm font-medium" onClick={() => setOpen(true)}>
        <Star className="mr-1.5 size-4" /> adicionar item
      </Button>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    onAdd({ nome: nome.trim(), prioridade, precoMedio: preco ? parseValor(preco) : undefined, status: "quero" as const });
    setNome("");
    setPreco("");
    setOpen(false);
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border bg-muted/30 p-3">
      <div className="space-y-1">
        <Label className="text-xs">Nome do item</Label>
        <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Norris Topps NOW numbered" />
      </div>
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Prioridade</Label>
          <div className="flex flex-wrap gap-1">
            {PRIORIDADES.map((p) => (
              <button
                key={p.value}
                type="button"
                onClick={() => setPrioridade(p.value)}
                className={`rounded-full border px-2 py-0.5 text-[10px] transition-colors ${
                  prioridade === p.value ? "border-primary bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Preço médio (opcional)</Label>
          <Input inputMode="decimal" value={preco} onChange={(e) => setPreco(e.target.value)} placeholder="0,00" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" type="submit" disabled={isPending}>Adicionar</Button>
        <Button size="sm" variant="ghost" type="button" onClick={() => setOpen(false)}>Cancelar</Button>
      </div>
    </form>
  );
}

function VendaForm({ onAdd, isPending }: { onAdd: (v: any) => void; isPending: boolean }) {
  const [open, setOpen] = useState(false);
  const [desc, setDesc] = useState("");
  const [valor, setValor] = useState("");
  const [canal, setCanal] = useState("");

  if (!open) {
    return (
      <Button variant="outline" className="w-full border-dashed text-sm font-medium" onClick={() => setOpen(true)}>
        <Tag className="mr-1.5 size-4" /> nova venda
      </Button>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = parseValor(valor);
    if (!desc.trim() || !v) return;
    onAdd({ descricao: desc.trim(), valorPedido: v, status: "anunciado" as VendaStatus, canal: canal.trim() || undefined, data: hoje() });
    setDesc("");
    setValor("");
    setCanal("");
    setOpen(false);
  }

  return (
    <form onSubmit={submit} className="space-y-3 rounded-xl border bg-muted/30 p-3">
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-xs">Descrição</Label>
          <Input value={desc} onChange={(e) => setDesc(e.target.value)} placeholder="Card Argentina Panini" />
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Valor pedido</Label>
          <Input inputMode="decimal" value={valor} onChange={(e) => setValor(e.target.value)} placeholder="0,00" />
        </div>
      </div>
      <div className="space-y-1">
        <Label className="text-xs">Canal (opcional)</Label>
        <Input value={canal} onChange={(e) => setCanal(e.target.value)} placeholder="whatsapp, marketplace..." />
      </div>
      <div className="flex gap-2">
        <Button size="sm" type="submit" disabled={isPending}>Anunciar</Button>
        <Button size="sm" variant="ghost" type="button" onClick={() => setOpen(false)}>Cancelar</Button>
      </div>
    </form>
  );
}

function VendaItem({ venda, onUpdate, onDelete }: { venda: HobbyVenda; onUpdate: (v: HobbyVenda) => void; onDelete: () => void }) {
  const statusLabels: Record<VendaStatus, string> = { anunciado: "anunciado", negociando: "em preparo", vendido: "vendido" };
  const statusColors: Record<VendaStatus, string> = {
    anunciado: "border-blue-500/30 bg-blue-500/20 text-blue-400",
    negociando: "border-yellow-500/30 bg-yellow-500/20 text-yellow-400",
    vendido: "border-green-500/30 bg-green-500/20 text-green-400",
  };
  const nextStatus: Record<VendaStatus, VendaStatus | null> = { anunciado: "negociando", negociando: "vendido", vendido: null };
  const next = nextStatus[venda.status];

  return (
    <div className="flex items-center gap-3 rounded-xl border bg-card p-3">
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium">{venda.descricao}</p>
        <span className={`mt-0.5 inline-block rounded-full border px-2 py-0.5 text-[10px] font-medium ${statusColors[venda.status]}`}>
          {statusLabels[venda.status]}
        </span>
      </div>
      <span className="num text-sm font-semibold">
        {venda.status === "negociando" ? "separando" : brl(venda.valorPedido)}
      </span>
      {next && (
        <button aria-label="Avançar status" className="text-muted-foreground hover:text-foreground" onClick={() => onUpdate({ ...venda, status: next })}>
          <Check className="size-4" />
        </button>
      )}
      <button aria-label="Remover" className="text-muted-foreground hover:text-destructive" onClick={onDelete}>
        <Trash2 className="size-4" />
      </button>
    </div>
  );
}

function EstoqueForm({ onAdd }: { onAdd: (e: Omit<HobbyEstoque, "id">) => void }) {
  const [adding, setAdding] = useState(false);
  const [tipo, setTipo] = useState("");
  const [qtd, setQtd] = useState("0");
  const [min, setMin] = useState("5");

  if (!adding) {
    return (
      <Button variant="outline" size="sm" className="w-full border-dashed text-sm font-medium" onClick={() => setAdding(true)}>
        <Plus className="mr-1.5 size-4" /> novo acessório
      </Button>
    );
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!tipo.trim()) return;
    onAdd({ tipo: tipo.trim(), quantidade: Number(qtd) || 0, quantidadeMinima: Number(min) || 5 });
    setTipo("");
    setQtd("0");
    setAdding(false);
  }

  return (
    <form onSubmit={submit} className="space-y-2 rounded-xl border bg-muted/30 p-3">
      <Input value={tipo} onChange={(e) => setTipo(e.target.value)} placeholder="sleeves, top_loaders..." className="h-8 text-xs" />
      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-1">
          <Label className="text-[10px]">Quantidade</Label>
          <Input type="number" value={qtd} onChange={(e) => setQtd(e.target.value)} className="h-7 text-xs" />
        </div>
        <div className="space-y-1">
          <Label className="text-[10px]">Mínimo alerta</Label>
          <Input type="number" value={min} onChange={(e) => setMin(e.target.value)} className="h-7 text-xs" />
        </div>
      </div>
      <div className="flex gap-2">
        <Button size="sm" type="submit">Salvar</Button>
        <Button size="sm" variant="ghost" type="button" onClick={() => setAdding(false)}>Cancelar</Button>
      </div>
    </form>
  );
}
