import { createFileRoute, Link } from "@tanstack/react-router";
import { Loader2 } from "lucide-react";
import { Bar, PageHeader, Section, Stat } from "@/components/fin";
import { brl, HOBBY_REFERENCIA, nomeMes, type Lancamento } from "@/lib/finance";
import { useMes } from "@/lib/mes-context";
import {
  useEntradas,
  useLancamentos,
  useInvestimentos,
  useContasFixas,
  useConfiguracoes,
  useAssinaturas,
} from "@/lib/hooks";

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

const HOBBY_CATEGORIA = "cards f1";

function Index() {
  const { mes } = useMes();
  const { data: entradas = [], isLoading: le } = useEntradas(mes);
  const { data: lancamentos = [], isLoading: ll } = useLancamentos(mes);
  const { data: investimentos = [], isLoading: li } = useInvestimentos(mes);
  const { data: contas = [], isLoading: lc } = useContasFixas(mes);
  const { data: config } = useConfiguracoes();
  const { data: assinaturas = [] } = useAssinaturas();

  const isLoading = le || ll || li || lc;

  // Cálculos derivados
  const totalAssinaturas = assinaturas.filter((a) => a.ativa).reduce((a, s) => a + s.valor, 0);
  const contasComAssinaturas = contas.map((c) =>
    c.id === "assinaturas" ? { ...c, valor: totalAssinaturas } : c,
  );
  const entradasOficiais = entradas.filter((e) => e.oficial).reduce((a, e) => a + e.valor, 0);
  const mesada = entradas.filter((e) => !e.oficial).reduce((a, e) => a + e.valor, 0);
  const totalInvestimentos = investimentos.reduce((a, i) => a + i.aporteMensal, 0);
  const totalContas = contasComAssinaturas.reduce((a, c) => a + c.valor, 0);
  const comprometido = totalInvestimentos + totalContas;
  const livre = entradasOficiais - comprometido;

  const ehHobby = (l: Lancamento) => l.categoria.trim().toLowerCase() === HOBBY_CATEGORIA;
  const gastoHobby = lancamentos.filter(ehHobby).reduce((a, l) => a + l.valor, 0);
  const gasto = lancamentos.filter((l) => !ehHobby(l)).reduce((a, l) => a + l.valor, 0);
  const restante = livre - gasto;
  const usadoPct = livre > 0 ? (gasto / livre) * 100 : 0;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="size-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Visão geral" subtitle={`${nomeMes(mes)} · dados salvos na nuvem`} />

      {/* Stats grid: 2 cols mobile, 4 cols desktop */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat label="Entradas do mês" value={entradasOficiais} hint="Sem a mesada" />
        <Stat label="Comprometido" value={comprometido} hint="Investimentos + contas fixas" />
        <Stat label="Livre pra gastar" value={livre} hint="Teto do mês" />
        <Stat
          label="Já gasto"
          value={gasto}
          tone={gasto > livre ? "destructive" : "default"}
          hint={`${lancamentos.length} lançamento(s) · hobby fora do teto`}
        />
      </div>

      {/* Desktop: 2 colunas lado a lado | Mobile: empilhado */}
      <div className="grid gap-8 md:grid-cols-2">
        {/* Coluna esquerda */}
        <div className="space-y-8">
          <Section title="Quanto ainda resta" description={`${brl(gasto)} de ${brl(livre)} usados`}>
            <div className="space-y-3 rounded-xl border bg-card p-4">
              <Bar value={usadoPct} tone={usadoPct > 100 ? "destructive" : usadoPct > 80 ? "warn" : "primary"} />
              <div className="flex items-baseline justify-between">
                <span className="text-xs text-muted-foreground">Restante</span>
                <span
                  className={`num text-2xl font-semibold ${restante < 0 ? "text-destructive" : "text-positive"}`}
                >
                  {brl(restante)}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                Hobby (cards F1) neste mês: <span className="num">{brl(gastoHobby)}</span> — sai da mesada,
                não desconta do teto. Referência de {brl(HOBBY_REFERENCIA)}, sem limite travado.
              </p>
            </div>
          </Section>

          <Section
            title="Contas fixas do mês"
            description={`${contasComAssinaturas.filter((c) => c.pago).length} de ${contasComAssinaturas.length} pagas`}
            action={
              <Link to="/contas" className="text-xs font-medium text-primary">
                Ver todas
              </Link>
            }
          >
            <ul className="divide-y rounded-xl border bg-card">
              {contasComAssinaturas.map((c) => (
                <li key={c.id} className="flex items-center gap-3 p-3">
                  <span
                    className={`size-2 shrink-0 rounded-full ${c.pago ? "bg-positive" : "bg-muted-foreground/30"}`}
                  />
                  <span
                    className={`flex-1 text-sm ${c.pago ? "text-muted-foreground line-through" : "font-medium"}`}
                  >
                    {c.nome}
                  </span>
                  <span className={`num text-sm ${c.pago ? "text-muted-foreground" : "font-semibold"}`}>
                    {brl(c.valor)}
                  </span>
                  {c.pago && c.pagoEm && (
                    <span className="text-xs text-muted-foreground">
                      {c.pagoEm.split("-").reverse().join("/")}
                    </span>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        </div>

        {/* Coluna direita */}
        <div className="space-y-8">
          <Section title="Fora do orçamento oficial" description="Bônus à parte, nunca base do mês">
            <div className="rounded-xl border border-dashed bg-card/50 p-4 text-sm">
              <div className="flex items-baseline justify-between">
                <span className="text-muted-foreground">Mesada</span>
                <span className="num font-semibold">{brl(mesada)}</span>
              </div>
              <p className="mt-2 text-xs text-muted-foreground">
                Cobre a nutricionista (R$ 172,00) e o hobby inteiro (R$ 300,00) — sobram R$ 28,00. Não entra em
                entradas nem em nenhum cálculo do teto.
              </p>
            </div>
          </Section>
        </div>
      </div>
    </div>
  );
}
