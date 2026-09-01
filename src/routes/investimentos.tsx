import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Pencil, Check, X, CircleCheck, Circle } from "lucide-react";
import { Bar, PageHeader, Section } from "@/components/fin";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
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
  useAportesFeitos,
  useMarcarAporte,
  useDesmarcarAporte,
} from "@/lib/hooks";

export const Route = createFileRoute("/investimentos")({
  head: () => ({
    meta: [
      { title: "Investimentos e metas — Controle financeiro pessoal" },
      {
        name: "description",
        content:
          "Aportes mensais, valores acumulados, Meta Itália e projeção de quanto falta para os R$100 mil investidos.",
      },
      { property: "og:title", content: "Investimentos e metas — Controle financeiro pessoal" },
      {
        property: "og:description",
        content:
          "Reserva, Meta Itália, aluguel em renda fixa, dividendos e a Meta 100k em um lugar só.",
      },
    ],
  }),
  component: Investimentos,
});

function Investimentos() {
  const { mes } = useMes();
  const { data: investimentos = [], isLoading: loadingInv } = useInvestimentos(mes);
  const { data: config, isLoading: loadingCfg } = useConfiguracoes();
  const updateInv = useUpdateInvestimento();
  const setInvMes = useSetInvestimentoMes();
  const updateCfg = useUpdateConfiguracoes();
  const { data: aportesFeitos = new Set<string>() } = useAportesFeitos(mes);
  const marcarAporte = useMarcarAporte();
  const desmarcarAporte = useDesmarcarAporte();

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [rascunhoFields, setRascunhoFields] = useState({
    aporteMensal: "",
    acumulado: "",
    alvo: "",
  });
  const [editandoMeta, setEditandoMeta] = useState(false);
  const [rascunhoRendimento, setRascunhoRendimento] = useState("");

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

    // Aporte tem vigência "deste mês em diante": grava um override no mês
    // selecionado com o NOVO valor. Meses anteriores continuam com o valor
    // que já estava vigente (base ou override anterior), então o passado não muda.
    if (novoAporte !== inv.aporteMensal) {
      setInvMes.mutate({ investimentoId: inv.id, mes, aporteMensal: novoAporte });
    }

    // Acumulado e alvo não têm recorte mensal — atualiza direto na base.
    if (novoAcumulado !== inv.acumulado || novoAlvo !== inv.alvo) {
      updateInv.mutate({ ...inv, acumulado: novoAcumulado, alvo: novoAlvo });
    }

    setEditandoId(null);
  }

  function cancelarEdicao() {
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
        title="Investimentos e metas"
        subtitle={`${nomeMes(mes)} · ${brl(totalAporte)} de aporte planejado`}
      />

      <Section title="Carteira" description="Aporte do mês, acumulado e progresso quando há alvo">
        <div className="space-y-3">
          {investimentos.map((i) => {
            const pct = i.alvo ? (i.acumulado / i.alvo) * 100 : null;
            const isEditing = editandoId === i.id;
            const feito = aportesFeitos.has(i.id);
            const togglePending = marcarAporte.isPending || desmarcarAporte.isPending;

            function toggleAporte() {
              if (feito) {
                desmarcarAporte.mutate({ investimentoId: i.id, mes, acumuladoAtual: i.acumulado });
              } else {
                marcarAporte.mutate({
                  investimentoId: i.id,
                  mes,
                  aporte: i.aporteMensal,
                  acumuladoAtual: i.acumulado,
                });
              }
            }

            return (
              <div key={i.id} className="space-y-3 rounded-xl border bg-card p-4">
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

                {!isEditing && (
                  <button
                    type="button"
                    onClick={toggleAporte}
                    disabled={togglePending}
                    className={`flex w-full items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm transition-colors ${
                      feito
                        ? "border-positive/40 bg-positive/10 text-positive"
                        : "bg-secondary/50 text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {togglePending ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : feito ? (
                      <CircleCheck className="size-4" />
                    ) : (
                      <Circle className="size-4" />
                    )}
                    <span className="flex-1">
                      {feito ? "Aporte deste mês investido" : "Marcar aporte como investido"}
                    </span>
                    <span className="num font-medium">{brl(i.aporteMensal)}</span>
                  </button>
                )}

                {isEditing ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs">Aporte neste mês</Label>
                        <Input
                          inputMode="decimal"
                          value={rascunhoFields.aporteMensal}
                          onChange={(e) =>
                            setRascunhoFields({ ...rascunhoFields, aporteMensal: e.target.value })
                          }
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs">Acumulado total</Label>
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
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        onClick={() => salvarEdicao(i)}
                        disabled={setInvMes.isPending || updateInv.isPending}
                      >
                        <Check className="size-4" /> Salvar
                      </Button>
                      <Button size="sm" variant="ghost" onClick={cancelarEdicao}>
                        <X className="size-4" /> Cancelar
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <span className="text-xs text-muted-foreground">Aporte neste mês</span>
                        <p className="num font-semibold">{brl(i.aporteMensal)}</p>
                      </div>
                      <div>
                        <span className="text-xs text-muted-foreground">Acumulado total</span>
                        <p className="num font-semibold">{brl(i.acumulado)}</p>
                      </div>
                      {i.alvo !== undefined && (
                        <div className="col-span-2">
                          <span className="text-xs text-muted-foreground">Valor-alvo</span>
                          <p className="num font-semibold">{brl(i.alvo)}</p>
                        </div>
                      )}
                    </div>
                    {pct !== null && (
                      <>
                        <Bar value={pct} />
                        <p className="num text-xs text-muted-foreground">
                          {pct.toFixed(1)}% de {brl(i.alvo!)}
                        </p>
                      </>
                    )}
                  </>
                )}

                {i.id === "italia" && (
                  <p className="text-xs text-muted-foreground">
                    Depois da viagem, esse aporte vira aporte extra de investimento.
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      <Section title="Meta 100k" description="Fora o valor do apartamento">
        <div className="space-y-4 rounded-xl border bg-card p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground">
              {incluirAluguelNaMeta ? "Contando o aluguel" : "Sem o aluguel"}
            </span>
            <span className="num text-2xl font-semibold">{brl(acumuladoMeta)}</span>
          </div>
          <Bar value={metaPct} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="num">{metaPct.toFixed(1)}%</span>
            <span className="num">faltam {brl(Math.max(0, META_GRANDE - acumuladoMeta))}</span>
          </div>

          {editandoMeta ? (
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Rendimento médio mensal (%)</Label>
                <Input
                  inputMode="decimal"
                  value={rascunhoRendimento}
                  onChange={(e) => setRascunhoRendimento(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Parte rende 112% do CDI, parte 100% — use a média.
                </p>
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={salvarMeta} disabled={updateCfg.isPending}>
                  <Check className="size-4" /> Salvar
                </Button>
                <Button size="sm" variant="ghost" onClick={() => setEditandoMeta(false)}>
                  <X className="size-4" /> Cancelar
                </Button>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-muted-foreground">Rendimento mensal</span>
                <p className="num text-sm font-semibold">{(rendimentoMensal * 100).toFixed(2)}%</p>
              </div>
              <button
                aria-label="Editar rendimento"
                className="text-muted-foreground hover:text-foreground"
                onClick={iniciarEdicaoMeta}
              >
                <Pencil className="size-4" />
              </button>
            </div>
          )}

          <p className="text-sm">
            Nesse ritmo: <span className="font-semibold">{prazo}</span> até os R$100 mil.
          </p>
        </div>
      </Section>
    </div>
  );
}
