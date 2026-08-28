import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo } from "react";
import { Loader2 } from "lucide-react";
import { Pie, PieChart, Cell } from "recharts";
import { Bar, PageHeader, Section, Stat } from "@/components/fin";
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@/components/ui/chart";
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
  const investimentosSemAluguel = investimentos
    .filter((i) => !i.origemAluguel)
    .reduce((a, i) => a + i.aporteMensal, 0);
  const aporteViagem = investimentos
    .filter((i) => i.id === "italia")
    .reduce((a, i) => a + i.aporteMensal, 0);
  const aporteInvestReal = investimentosSemAluguel - aporteViagem;
  const salario = entradas.find((e) => e.id === "salario")?.valor ?? entradasOficiais;
  const totalContas = contasComAssinaturas.reduce((a, c) => a + (c.valorReal ?? c.valor), 0);
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

      {/* Grid responsivo: 1 col mobile → 2 cols md → 3 cols xl */}
      <div className="grid gap-8 md:grid-cols-2 xl:grid-cols-3">
        {/* Coluna 1: Progresso */}
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

          {/* Gráfico: distribuição do salário */}
          <Section title="Pra onde vai o salário" description="% de cada destino">
            <SalarioChart
              investimentos={aporteInvestReal}
              viagem={aporteViagem}
              contas={totalContas}
              livre={salario - investimentosSemAluguel - totalContas}
              total={salario}
            />
          </Section>
        </div>

        {/* Coluna 2: Contas fixas */}
        <div className="space-y-8">
          <Section
            title="Contas fixas do mês"
            description={`${contasComAssinaturas.filter((c) => c.pago).length} de ${contasComAssinaturas.length} pagas`}
            action={
              <Link to="/contas" className="text-xs font-medium text-primary">
                Ver todas
              </Link>
            }
          >
            <ul className="divide-y rounded-xl border bg-card xl:max-h-[calc(100vh-280px)] xl:overflow-y-auto">
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

          {/* Gráfico: gastos por categoria — fica junto das contas no md, col própria no xl */}
          {lancamentos.length > 0 && (
            <Section title="Gastos por categoria" description="Breakdown do mês">
              <GastosChart lancamentos={lancamentos} />
            </Section>
          )}
        </div>

        {/* Coluna 3: Fora do orçamento / mesada */}
        <div className="space-y-8 md:col-span-2 xl:col-span-1">
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

// ── Gráfico: distribuição do salário ──

const SALARIO_COLORS = ["#22c55e", "#8b5cf6", "#f59e0b", "#3b82f6"];

const salarioChartConfig: ChartConfig = {
  investimentos: { label: "Investimentos", color: SALARIO_COLORS[0] as string },
  viagem: { label: "Viagem", color: SALARIO_COLORS[1] as string },
  contas: { label: "Contas fixas", color: SALARIO_COLORS[2] as string },
  livre: { label: "Livre pra gastar", color: SALARIO_COLORS[3] as string },
};

function SalarioChart({
  investimentos,
  viagem,
  contas,
  livre,
  total,
}: {
  investimentos: number;
  viagem: number;
  contas: number;
  livre: number;
  total: number;
}) {
  const data = [
    { name: "investimentos", value: investimentos, pct: total > 0 ? ((investimentos / total) * 100).toFixed(1) : "0" },
    { name: "viagem", value: viagem, pct: total > 0 ? ((viagem / total) * 100).toFixed(1) : "0" },
    { name: "contas", value: contas, pct: total > 0 ? ((contas / total) * 100).toFixed(1) : "0" },
    { name: "livre", value: Math.max(0, livre), pct: total > 0 ? ((Math.max(0, livre) / total) * 100).toFixed(1) : "0" },
  ];

  return (
    <div className="rounded-xl border bg-card p-4">
      <ChartContainer config={salarioChartConfig} className="mx-auto aspect-square max-h-[220px]">
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => {
                  const item = data.find((d) => d.name === name);
                  return `${brl(Number(value))} (${item?.pct}%)`;
                }}
              />
            }
          />
          <Pie data={data} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} strokeWidth={2}>
            {data.map((entry, idx) => (
              <Cell key={entry.name} fill={SALARIO_COLORS[idx]} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul className="mt-3 space-y-1.5">
        {data.map((d, idx) => (
          <li key={d.name} className="flex items-center gap-2 text-xs">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: SALARIO_COLORS[idx] }} />
            <span className="flex-1 text-muted-foreground">{salarioChartConfig[d.name]?.label}</span>
            <span className="num font-medium">{d.pct}%</span>
            <span className="num text-muted-foreground">{brl(d.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

// ── Gráfico: gastos por categoria ──

const GASTOS_COLORS = [
  "#ef4444",
  "#f59e0b",
  "#22c55e",
  "#3b82f6",
  "#a855f7",
  "#ec4899",
  "#14b8a6",
  "#f97316",
];

function GastosChart({ lancamentos }: { lancamentos: Lancamento[] }) {
  const { data: chartData, config } = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const l of lancamentos) {
      const cat = l.categoria.trim().toLowerCase();
      mapa.set(cat, (mapa.get(cat) ?? 0) + l.valor);
    }
    const sorted = Array.from(mapa.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 8);
    const total = sorted.reduce((a, [, v]) => a + v, 0);

    const items = sorted.map(([cat, valor], idx) => ({
      name: cat,
      value: valor,
      pct: total > 0 ? ((valor / total) * 100).toFixed(1) : "0",
      fill: GASTOS_COLORS[idx % GASTOS_COLORS.length],
    }));

    const cfg: ChartConfig = {};
    for (const item of items) {
      cfg[item.name] = { label: item.name, color: item.fill as string };
    }

    return { data: items, config: cfg };
  }, [lancamentos]);

  return (
    <div className="rounded-xl border bg-card p-4">
      <ChartContainer config={config} className="mx-auto aspect-square max-h-[220px]">
        <PieChart>
          <ChartTooltip
            content={
              <ChartTooltipContent
                formatter={(value, name) => {
                  const item = chartData.find((d) => d.name === name);
                  return `${brl(Number(value))} (${item?.pct}%)`;
                }}
              />
            }
          />
          <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={50} outerRadius={80} strokeWidth={2}>
            {chartData.map((entry) => (
              <Cell key={entry.name} fill={entry.fill} />
            ))}
          </Pie>
        </PieChart>
      </ChartContainer>
      <ul className="mt-3 space-y-1.5">
        {chartData.map((d) => (
          <li key={d.name} className="flex items-center gap-2 text-xs">
            <span className="size-2.5 rounded-full" style={{ backgroundColor: d.fill }} />
            <span className="flex-1 capitalize text-muted-foreground">{d.name}</span>
            <span className="num font-medium">{d.pct}%</span>
            <span className="num text-muted-foreground">{brl(d.value)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
