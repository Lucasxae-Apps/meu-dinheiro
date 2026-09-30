import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Loader2,
  Pencil,
  Check,
  X,
  Plus,
  Minus,
  Trash2,
  ArrowUpRight,
  ArrowDownRight,
  ChevronDown,
} from "lucide-react";
import { Bar, PageHeader, Section } from "@/components/fin";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  brl,
  formatarPrazo,
  formatValorInput,
  META_GRANDE,
  mesesParaMeta,
  nomeMes,
  parseValor,
  type Investimento,
} from "@/lib/finance";
import { useMes } from "@/lib/mes-context";
import {
  useInvestimentos,
  useUpdateInvestimento,
  useSetInvestimentoMes,
  useConfiguracoes,
  useUpdateConfiguracoes,
  useInvestimentoMovimentos,
  useAddMovimento,
  useDeleteMovimento,
  useCotacoes,
  type TipoMovimento,
  type InvestimentoMovimento,
} from "@/lib/hooks";

export const Route = createFileRoute("/investimentos")({
  head: () => ({
    meta: [
      { title: "Investimentos e metas — Controle financeiro pessoal" },
      {
        name: "description",
        content:
          "Caixinhas, aportes e retiradas com motivo, progresso da Meta 100k e cotações do dólar, euro e bitcoin.",
      },
      { property: "og:title", content: "Investimentos e metas — Controle financeiro pessoal" },
      {
        property: "og:description",
        content:
          "Cada caixinha com seu histórico de movimentações — o que entrou, o que saiu e por quê.",
      },
    ],
  }),
  component: Investimentos,
});

function Investimentos() {
  const { mes } = useMes();
  const { data: investimentos = [], isLoading: loadingInv } = useInvestimentos(mes);
  const { data: config, isLoading: loadingCfg } = useConfiguracoes();
  const { data: movimentos = [], isLoading: loadingMov } = useInvestimentoMovimentos();
  const { data: cotacoes = [] } = useCotacoes();
  const updateInv = useUpdateInvestimento();
  const setInvMes = useSetInvestimentoMes();
  const updateCfg = useUpdateConfiguracoes();
  const addMovimento = useAddMovimento();
  const deleteMovimento = useDeleteMovimento();

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [rascunhoFields, setRascunhoFields] = useState({
    aporteMensal: "",
    acumulado: "",
    alvo: "",
  });
  const [editandoMeta, setEditandoMeta] = useState(false);
  const [rascunhoRendimento, setRascunhoRendimento] = useState("");
  const [expandidoId, setExpandidoId] = useState<string | null>(null);
  const [movimentoDialog, setMovimentoDialog] = useState<{
    investimento: Investimento;
    tipo: TipoMovimento;
  } | null>(null);

  const rendimentoMensal = config?.rendimentoMensal ?? 0.012;
  const incluirAluguelNaMeta = config?.incluirAluguelNaMeta ?? true;

  const totalAporte = investimentos.reduce((a, i) => a + i.aporteMensal, 0);
  const acumuladoTotal = investimentos.reduce((a, i) => a + i.acumulado, 0);
  const acumuladoAluguel = investimentos
    .filter((i) => i.origemAluguel)
    .reduce((a, i) => a + i.acumulado, 0);
  const aporteAluguel = investimentos
    .filter((i) => i.origemAluguel)
    .reduce((a, i) => a + i.aporteMensal, 0);

  const acumuladoMeta = incluirAluguelNaMeta ? acumuladoTotal : acumuladoTotal - acumuladoAluguel;
  const aporteMeta = incluirAluguelNaMeta ? totalAporte : totalAporte - aporteAluguel;
  const metaPct = (acumuladoMeta / META_GRANDE) * 100;
  const prazo = formatarPrazo(mesesParaMeta(acumuladoMeta, aporteMeta, rendimentoMensal));

  function iniciarEdicao(inv: Investimento) {
    setEditandoId(inv.id);
    setRascunhoFields({
      aporteMensal: formatValorInput(inv.aporteMensal),
      acumulado: formatValorInput(inv.acumulado),
      alvo: inv.alvo !== undefined ? formatValorInput(inv.alvo) : "",
    });
  }

  function salvarEdicao(inv: Investimento) {
    const novoAporte = parseValor(rascunhoFields.aporteMensal);
    const novoAcumulado = parseValor(rascunhoFields.acumulado);
    const novoAlvo = inv.alvo !== undefined ? parseValor(rascunhoFields.alvo) : undefined;

    if (novoAporte !== inv.aporteMensal) {
      setInvMes.mutate({ investimentoId: inv.id, mes, aporteMensal: novoAporte });
    }
    if (novoAcumulado !== inv.acumulado || novoAlvo !== inv.alvo) {
      updateInv.mutate({ ...inv, acumulado: novoAcumulado, alvo: novoAlvo });
    }
    setEditandoId(null);
  }

  function iniciarEdicaoMeta() {
    setEditandoMeta(true);
    setRascunhoRendimento((rendimentoMensal * 100).toFixed(2).replace(".", ","));
  }

  function salvarMeta() {
    const val = parseValor(rascunhoRendimento);
    updateCfg.mutate({ rendimentoMensal: val / 100 });
    setEditandoMeta(false);
  }

  if (loadingInv || loadingCfg) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader
        title="Investimentos"
        subtitle={`${nomeMes(mes)} · ${brl(totalAporte)} de aporte planejado`}
      />

      {/* Hero: patrimônio + meta */}
      <div className="space-y-5 rounded-3xl border border-border/60 bg-gradient-to-br from-card to-secondary/40 p-6 shadow-sm">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs uppercase tracking-widest text-muted-foreground">
              Patrimônio investido {incluirAluguelNaMeta ? "" : "· sem o aluguel"}
            </p>
            <p className="num mt-1 text-4xl font-semibold tracking-tight">{brl(acumuladoMeta)}</p>
          </div>
          <div className="text-right">
            <p className="text-xs uppercase tracking-widest text-muted-foreground">Meta 100k</p>
            <p className="num mt-1 text-2xl font-semibold text-primary">{metaPct.toFixed(1)}%</p>
          </div>
        </div>
        <Progress value={Math.min(100, metaPct)} className="h-2.5" />
        <div className="flex flex-wrap items-center justify-between gap-2 text-sm">
          <span className="text-muted-foreground">
            Faltam{" "}
            <span className="num font-medium text-foreground">
              {brl(Math.max(0, META_GRANDE - acumuladoMeta))}
            </span>
          </span>
          <span>
            Nesse ritmo: <span className="font-semibold text-primary">{prazo}</span>
          </span>
        </div>

        {editandoMeta ? (
          <div className="flex flex-wrap items-end gap-3 border-t border-border/60 pt-4">
            <div className="space-y-1.5">
              <Label className="text-xs">Rendimento médio mensal (%)</Label>
              <Input
                inputMode="decimal"
                className="w-28"
                value={rascunhoRendimento}
                onChange={(e) => setRascunhoRendimento(e.target.value)}
              />
            </div>
            <Button size="sm" onClick={salvarMeta} disabled={updateCfg.isPending}>
              <Check className="size-4" /> Salvar
            </Button>
            <Button size="sm" variant="ghost" onClick={() => setEditandoMeta(false)}>
              <X className="size-4" /> Cancelar
            </Button>
          </div>
        ) : (
          <div className="flex items-center justify-between border-t border-border/60 pt-4 text-xs text-muted-foreground">
            <span>Rendimento médio mensal: {(rendimentoMensal * 100).toFixed(2)}%</span>
            <button
              className="flex items-center gap-1 font-medium text-primary hover:opacity-80"
              onClick={iniciarEdicaoMeta}
            >
              <Pencil className="size-3" /> Ajustar
            </button>
          </div>
        )}
      </div>

      {/* Cotações */}
      {cotacoes.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {cotacoes.map((c) => (
            <div
              key={c.par}
              className="rounded-2xl border border-border/60 bg-card p-3.5 text-center"
            >
              <p className="text-[11px] uppercase tracking-widest text-muted-foreground">
                {c.label}
              </p>
              <p className="num mt-1 text-base font-semibold">{brl(c.valor)}</p>
              {c.variacaoPct !== undefined && (
                <p
                  className={`num text-xs ${c.variacaoPct >= 0 ? "text-positive" : "text-destructive"}`}
                >
                  {c.variacaoPct >= 0 ? "+" : ""}
                  {c.variacaoPct.toFixed(2)}% 24h
                </p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Caixinhas */}
      <Section title="Caixinhas" description="Cada uma com seu saldo, aporte planejado e histórico">
        <div className="space-y-3">
          {investimentos.map((i) => {
            const pct = i.alvo ? (i.acumulado / i.alvo) * 100 : null;
            const isEditing = editandoId === i.id;
            const expandido = expandidoId === i.id;
            const movsDaCaixinha = movimentos.filter((m) => m.investimentoId === i.id);
            const totalRetiradoHistorico = movsDaCaixinha
              .filter((m) => m.tipo === "retirada")
              .reduce((a, m) => a + m.valor, 0);

            return (
              <div
                key={i.id}
                className="space-y-4 rounded-2xl border border-border/60 bg-card p-5 shadow-sm transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{i.nome}</p>
                    {i.nota ? <p className="text-xs text-muted-foreground">{i.nota}</p> : null}
                  </div>
                  {!isEditing && (
                    <button
                      aria-label="Editar"
                      className="mt-0.5 text-muted-foreground hover:text-foreground"
                      onClick={() => iniciarEdicao(i)}
                    >
                      <Pencil className="size-4" />
                    </button>
                  )}
                </div>

                {isEditing ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Aporte planejado/mês</Label>
                        <Input
                          inputMode="decimal"
                          value={rascunhoFields.aporteMensal}
                          onChange={(e) =>
                            setRascunhoFields({ ...rascunhoFields, aporteMensal: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Saldo (ajuste direto)</Label>
                        <Input
                          inputMode="decimal"
                          value={rascunhoFields.acumulado}
                          onChange={(e) =>
                            setRascunhoFields({ ...rascunhoFields, acumulado: e.target.value })
                          }
                        />
                      </div>
                      {i.alvo !== undefined && (
                        <div className="col-span-2 space-y-1.5">
                          <Label className="text-xs">Valor-alvo</Label>
                          <Input
                            inputMode="decimal"
                            value={rascunhoFields.alvo}
                            onChange={(e) =>
                              setRascunhoFields({ ...rascunhoFields, alvo: e.target.value })
                            }
                          />
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      O ajuste de saldo aqui é direto (correção), não vira um lançamento no
                      histórico. Pra registrar entrada/saída de dinheiro, use os botões Aportar /
                      Retirar.
                    </p>
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => salvarEdicao(i)}
                        disabled={setInvMes.isPending || updateInv.isPending}
                      >
                        <Check className="size-4" /> Salvar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => setEditandoId(null)}>
                        <X className="size-4" /> Cancelar
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="flex items-end justify-between">
                      <div>
                        <span className="text-xs text-muted-foreground">Saldo atual</span>
                        <p className="num text-2xl font-semibold">{brl(i.acumulado)}</p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-muted-foreground">Aporte/mês</span>
                        <p className="num text-sm font-medium">{brl(i.aporteMensal)}</p>
                      </div>
                    </div>

                    {pct !== null && (
                      <div className="space-y-1">
                        <Bar value={pct} />
                        <p className="num text-xs text-muted-foreground">
                          {pct.toFixed(1)}% de {brl(i.alvo!)}
                        </p>
                      </div>
                    )}

                    {totalRetiradoHistorico > 0 && (
                      <p className="rounded-lg bg-destructive/10 px-3 py-1.5 text-xs text-destructive">
                        Já saiu {brl(totalRetiradoHistorico)} dessa caixinha no total (histórico
                        completo)
                      </p>
                    )}

                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        variant="secondary"
                        className="flex-1"
                        onClick={() => setMovimentoDialog({ investimento: i, tipo: "aporte" })}
                      >
                        <Plus className="size-4" /> Aportar
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        className="flex-1"
                        onClick={() => setMovimentoDialog({ investimento: i, tipo: "retirada" })}
                      >
                        <Minus className="size-4" /> Retirar
                      </Button>
                    </div>

                    <button
                      className="flex w-full items-center justify-center gap-1 text-xs text-muted-foreground hover:text-foreground"
                      onClick={() => setExpandidoId(expandido ? null : i.id)}
                    >
                      {expandido
                        ? "Esconder histórico"
                        : `Ver histórico (${movsDaCaixinha.length})`}
                      <ChevronDown
                        className={`size-3.5 transition-transform ${expandido ? "rotate-180" : ""}`}
                      />
                    </button>

                    {expandido && (
                      <MovimentoHistorico
                        movimentos={movsDaCaixinha}
                        investimento={i}
                        onDelete={(m) =>
                          deleteMovimento.mutate({
                            id: m.id,
                            investimentoId: i.id,
                            tipo: m.tipo,
                            valor: m.valor,
                            acumuladoAtual: i.acumulado,
                          })
                        }
                        deleting={deleteMovimento.isPending}
                      />
                    )}
                  </>
                )}

                {i.id === "italia" && !isEditing && (
                  <p className="text-xs text-muted-foreground">
                    Depois da viagem, esse aporte vira aporte extra de investimento.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* Feed global de lançamentos */}
      {movimentos.length > 0 && (
        <Section
          title="Últimos lançamentos"
          description="Todas as caixinhas, mais recentes primeiro"
        >
          <ul className="divide-y rounded-2xl border border-border/60 bg-card">
            {movimentos.slice(0, 15).map((m) => {
              const inv = investimentos.find((i) => i.id === m.investimentoId);
              return (
                <li key={m.id} className="flex items-center gap-3 p-3">
                  <span
                    className={`flex size-8 shrink-0 items-center justify-center rounded-full ${
                      m.tipo === "aporte"
                        ? "bg-positive/10 text-positive"
                        : "bg-destructive/10 text-destructive"
                    }`}
                  >
                    {m.tipo === "aporte" ? (
                      <ArrowUpRight className="size-4" />
                    ) : (
                      <ArrowDownRight className="size-4" />
                    )}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{inv?.nome ?? m.investimentoId}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.data.split("-").reverse().join("/")}
                      {m.motivo ? ` · ${m.motivo}` : ""}
                    </p>
                  </div>
                  <span
                    className={`num text-sm font-semibold ${
                      m.tipo === "aporte" ? "text-positive" : "text-destructive"
                    }`}
                  >
                    {m.tipo === "aporte" ? "+" : "−"} {brl(m.valor)}
                  </span>
                </li>
              );
            })}
          </ul>
          {loadingMov && (
            <div className="flex justify-center py-3">
              <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
          )}
        </Section>
      )}

      {movimentoDialog && (
        <MovimentoDialogForm
          investimento={movimentoDialog.investimento}
          tipoInicial={movimentoDialog.tipo}
          onClose={() => setMovimentoDialog(null)}
          onSubmit={(payload) => {
            addMovimento.mutate(
              { ...payload, acumuladoAtual: movimentoDialog.investimento.acumulado },
              { onSuccess: () => setMovimentoDialog(null) },
            );
          }}
          pending={addMovimento.isPending}
        />
      )}
    </div>
  );
}

// ── Histórico de movimentos de uma caixinha ──

function MovimentoHistorico({
  movimentos,
  onDelete,
  deleting,
}: {
  movimentos: InvestimentoMovimento[];
  investimento: Investimento;
  onDelete: (m: InvestimentoMovimento) => void;
  deleting: boolean;
}) {
  if (movimentos.length === 0) {
    return <p className="text-xs text-muted-foreground">Nenhum lançamento registrado ainda.</p>;
  }
  return (
    <ul className="divide-y rounded-xl border bg-secondary/30">
      {movimentos.map((m) => (
        <li key={m.id} className="flex items-center gap-2 p-2.5 text-xs">
          <span
            className={`shrink-0 rounded-full px-2 py-0.5 font-medium ${
              m.tipo === "aporte"
                ? "bg-positive/15 text-positive"
                : "bg-destructive/15 text-destructive"
            }`}
          >
            {m.tipo === "aporte" ? "Aporte" : "Retirada"}
          </span>
          <span className="min-w-0 flex-1 truncate text-muted-foreground">
            {m.data.split("-").reverse().join("/")}
            {m.motivo ? ` · ${m.motivo}` : ""}
          </span>
          <span className="num font-semibold">{brl(m.valor)}</span>
          <button
            aria-label="Remover lançamento"
            className="text-muted-foreground hover:text-destructive"
            onClick={() => onDelete(m)}
            disabled={deleting}
          >
            <Trash2 className="size-3.5" />
          </button>
        </li>
      ))}
    </ul>
  );
}

// ── Dialog: registrar aporte/retirada ──

function MovimentoDialogForm({
  investimento,
  tipoInicial,
  onClose,
  onSubmit,
  pending,
}: {
  investimento: Investimento;
  tipoInicial: TipoMovimento;
  onClose: () => void;
  onSubmit: (payload: {
    investimentoId: string;
    tipo: TipoMovimento;
    valor: number;
    motivo?: string;
    data: string;
  }) => void;
  pending: boolean;
}) {
  const [tipo, setTipo] = useState<TipoMovimento>(tipoInicial);
  const [valor, setValor] = useState(
    tipoInicial === "aporte" ? formatValorInput(investimento.aporteMensal) : "",
  );
  const [motivo, setMotivo] = useState("");
  const [data, setData] = useState(() => new Date().toISOString().slice(0, 10));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const v = parseValor(valor);
    if (!v) return;
    onSubmit({ investimentoId: investimento.id, tipo, valor: v, motivo: motivo.trim(), data });
  }

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="rounded-2xl sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>{investimento.nome}</DialogTitle>
          <DialogDescription>
            Saldo atual: {brl(investimento.acumulado)} · registra o lançamento e já ajusta o saldo
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={submit} className="space-y-4">
          <div className="flex gap-1.5">
            <button
              type="button"
              onClick={() => setTipo("aporte")}
              className={`flex-1 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                tipo === "aporte"
                  ? "border-positive bg-positive/10 font-medium text-positive"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              Aporte
            </button>
            <button
              type="button"
              onClick={() => setTipo("retirada")}
              className={`flex-1 rounded-full border px-3 py-1.5 text-sm transition-colors ${
                tipo === "retirada"
                  ? "border-destructive bg-destructive/10 font-medium text-destructive"
                  : "bg-secondary text-muted-foreground hover:text-foreground"
              }`}
            >
              Retirada
            </button>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mov-valor">Valor</Label>
            <Input
              id="mov-valor"
              autoFocus
              inputMode="decimal"
              placeholder="0,00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mov-data">Data</Label>
            <Input
              id="mov-data"
              type="date"
              value={data}
              onChange={(e) => setData(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="mov-motivo">
              {tipo === "retirada" ? "Motivo da retirada" : "Nota (opcional)"}
            </Label>
            <Input
              id="mov-motivo"
              placeholder={
                tipo === "retirada"
                  ? "ex: conserto do carro, emergência médica"
                  : "ex: aporte de outubro"
              }
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
            />
          </div>

          <DialogFooter>
            <Button type="submit" disabled={pending} className="w-full">
              {pending ? (
                <Loader2 className="size-4 animate-spin" />
              ) : tipo === "aporte" ? (
                "Registrar aporte"
              ) : (
                "Registrar retirada"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
