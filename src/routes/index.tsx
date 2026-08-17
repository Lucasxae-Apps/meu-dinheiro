import { createFileRoute, Link } from "@tanstack/react-router";
import { Bar, PageHeader, Section, Stat } from "@/components/fin";
import { Switch } from "@/components/ui/switch";
import {
  brl,
  formatarPrazo,
  HOBBY_REFERENCIA,
  META_GRANDE,
  mesAtual,
  mesesParaMeta,
  nomeMes,
  totais,
  useFinance,
} from "@/lib/finance";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Visão geral — Controle financeiro pessoal" },
      {
        name: "description",
        content:
          "Entradas do mês, valor comprometido, teto livre pra gastar e progresso dos investimentos rumo aos R$100 mil.",
      },
      { property: "og:title", content: "Visão geral — Controle financeiro pessoal" },
      {
        property: "og:description",
        content: "Entradas, comprometido, livre pra gastar e progresso dos investimentos em uma tela.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const { state, update, hydrated } = useFinance();
  const mes = mesAtual();
  const t = totais(state, mes);

  const usadoPct = t.livre > 0 ? (t.gasto / t.livre) * 100 : 0;
  const metaPct = (t.acumuladoMeta / META_GRANDE) * 100;
  const aporteTotal = t.aporteMeta;
  const prazo = formatarPrazo(mesesParaMeta(t.acumuladoMeta, aporteTotal, state.rendimentoMensal));

  return (
    <div className="space-y-8">
      <PageHeader title="Visão geral" subtitle={`${nomeMes(mes)} · atualizado no seu aparelho`} />

      <div className="grid grid-cols-2 gap-3">
        <Stat label="Entradas do mês" value={t.entradasOficiais} hint="Sem a mesada" />
        <Stat label="Comprometido" value={t.comprometido} hint="Investimentos + contas fixas" />
        <Stat label="Livre pra gastar" value={t.livre} hint="Teto do mês" />
        <Stat
          label="Já gasto"
          value={t.gasto}
          tone={t.gasto > t.livre ? "destructive" : "default"}
          hint={`${t.lancamentosDoMes.length} lançamento(s) · hobby fora do teto`}
        />
      </div>

      <Section title="Quanto ainda resta" description={`${brl(t.gasto)} de ${brl(t.livre)} usados`}>
        <div className="space-y-3 rounded-xl border bg-card p-4">
          <Bar value={usadoPct} tone={usadoPct > 100 ? "destructive" : usadoPct > 80 ? "warn" : "primary"} />
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground">Restante</span>
            <span
              className={`num text-2xl font-semibold ${t.restante < 0 ? "text-destructive" : "text-positive"}`}
            >
              {brl(t.restante)}
            </span>
          </div>
          <p className="text-xs text-muted-foreground">
            Hobby (cards F1) neste mês: <span className="num">{brl(t.gastoHobby)}</span> — sai da mesada,
            não desconta do teto. Referência de {brl(HOBBY_REFERENCIA)}, sem limite travado.
          </p>
        </div>
      </Section>


      <Section
        title="Investimentos acumulados"
        description="Total geral e progresso rumo aos R$100.000"
        action={
          <Link to="/investimentos" className="text-xs font-medium text-primary">
            Detalhes
          </Link>
        }
      >
        <div className="space-y-4 rounded-xl border bg-card p-4">
          <div className="flex items-baseline justify-between">
            <span className="text-xs text-muted-foreground">
              {state.incluirAluguelNaMeta ? "Total investido" : "Investido sem o aluguel"}
            </span>
            <span className="num text-2xl font-semibold">{brl(t.acumuladoMeta)}</span>
          </div>
          {!state.incluirAluguelNaMeta && (
            <p className="num text-xs text-muted-foreground">
              Total geral com o aluguel: {brl(t.acumuladoTotal)}
            </p>
          )}
          <Bar value={metaPct} />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span className="num">{metaPct.toFixed(1)}% da meta</span>
            <span className="num">faltam {brl(Math.max(0, META_GRANDE - t.acumuladoMeta))}</span>
          </div>
          <div className="flex items-center justify-between gap-4 rounded-lg bg-surface p-3">
            <div>
              <p className="text-xs font-medium">Incluir o que veio do aluguel</p>
              <p className="text-xs text-muted-foreground num">
                {brl(t.acumuladoAluguel)} acumulados e {brl(t.aporteAluguel)}/mês vindos do aluguel
              </p>
            </div>
            <Switch
              checked={state.incluirAluguelNaMeta}
              disabled={!hydrated}
              onCheckedChange={(v) => update((s) => ({ ...s, incluirAluguelNaMeta: v }))}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Aportando {brl(aporteTotal)}/mês a {(state.rendimentoMensal * 100).toFixed(2)}% ao mês: {prazo}{" "}
            até os R$100 mil.
          </p>
        </div>
      </Section>

      <Section title="Fora do orçamento oficial" description="Bônus à parte, nunca base do mês">
        <div className="rounded-xl border border-dashed bg-card/50 p-4 text-sm">
          <div className="flex items-baseline justify-between">
            <span className="text-muted-foreground">Mesada</span>
            <span className="num font-semibold">{brl(t.mesada)}</span>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Cobre a nutricionista (R$ 172,00) e o hobby inteiro (R$ 300,00) — sobram R$ 28,00. Não entra em
            entradas nem em nenhum cálculo do teto.
          </p>
        </div>
      </Section>
    </div>
  );
}
