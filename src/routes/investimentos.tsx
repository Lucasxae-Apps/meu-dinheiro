import { createFileRoute } from "@tanstack/react-router";
import { Bar, PageHeader, Section } from "@/components/fin";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  brl,
  formatarPrazo,
  META_GRANDE,
  mesesParaMeta,
  totais,
  useFinance,
} from "@/lib/finance";

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
        content: "Reserva, Meta Itália, aluguel em renda fixa, dividendos e a Meta 100k em um lugar só.",
      },
    ],
  }),
  component: Investimentos,
});

function Investimentos() {
  const { state, update } = useFinance();
  const t = totais(state);
  const metaPct = (t.acumuladoMeta / META_GRANDE) * 100;
  const prazo = formatarPrazo(mesesParaMeta(t.acumuladoMeta, t.aporteMeta, state.rendimentoMensal));

  const setInv = (id: string, patch: Partial<{ aporteMensal: number; acumulado: number; alvo: number }>) =>
    update((s) => ({
      ...s,
      investimentos: s.investimentos.map((i) => (i.id === id ? { ...i, ...patch } : i)),
    }));

  return (
    <div className="space-y-8">
      <PageHeader title="Investimentos e metas" subtitle={`${brl(t.investimentos)} de aporte planejado por mês`} />

      <Section title="Carteira" description="Aporte mensal, acumulado e progresso quando há alvo">
        <div className="space-y-3">
          {state.investimentos.map((i) => {
            const pct = i.alvo ? (i.acumulado / i.alvo) * 100 : null;
            return (
              <div key={i.id} className="space-y-3 rounded-xl border bg-card p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold">{i.nome}</p>
                    {i.nota ? <p className="text-xs text-muted-foreground">{i.nota}</p> : null}
                  </div>
                  <span className="num text-lg font-semibold">{brl(i.acumulado)}</span>
                </div>
                {pct !== null && (
                  <>
                    <Bar value={pct} />
                    <p className="num text-xs text-muted-foreground">
                      {pct.toFixed(1)}% de {brl(i.alvo!)}
                    </p>
                  </>
                )}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">Aporte mensal</Label>
                    <Input
                      inputMode="decimal"
                      value={String(i.aporteMensal)}
                      onChange={(e) =>
                        setInv(i.id, { aporteMensal: Number(e.target.value.replace(",", ".")) || 0 })
                      }
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Acumulado</Label>
                    <Input
                      inputMode="decimal"
                      value={String(i.acumulado)}
                      onChange={(e) =>
                        setInv(i.id, { acumulado: Number(e.target.value.replace(",", ".")) || 0 })
                      }
                    />
                  </div>
                  {i.alvo !== undefined && (
                    <div className="col-span-2 space-y-1.5">
                      <Label className="text-xs">Valor-alvo</Label>
                      <Input
                        inputMode="decimal"
                        value={String(i.alvo)}
                        onChange={(e) => setInv(i.id, { alvo: Number(e.target.value.replace(",", ".")) || 0 })}
                      />
                    </div>
                  )}
                </div>
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
              {state.incluirAluguelNaMeta ? "Contando o aluguel" : "Sem o aluguel"}
            </span>
            <span className="num text-2xl font-semibold">{brl(t.acumuladoMeta)}</span>
          </div>
          <Bar value={metaPct} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="num">{metaPct.toFixed(1)}%</span>
            <span className="num">faltam {brl(Math.max(0, META_GRANDE - t.acumuladoMeta))}</span>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Rendimento médio mensal (%)</Label>
            <Input
              inputMode="decimal"
              value={String((state.rendimentoMensal * 100).toFixed(2))}
              onChange={(e) =>
                update((s) => ({
                  ...s,
                  rendimentoMensal: (Number(e.target.value.replace(",", ".")) || 0) / 100,
                }))
              }
            />
            <p className="text-xs text-muted-foreground">
              Parte rende 112% do CDI, parte 100% — use a média.
            </p>
          </div>
          <p className="text-sm">
            Nesse ritmo: <span className="font-semibold">{prazo}</span> até os R$100 mil.
          </p>
        </div>
      </Section>
    </div>
  );
}
