import { useCallback, useEffect, useState } from "react";

export type Entrada = {
  id: string;
  nome: string;
  valor: number;
  oficial: boolean;
  /** Já entra como aporte em Investimentos (ex: aluguel → renda fixa) — não soma no teto oficial. */
  vinculadaInvestimento?: boolean | undefined;
  nota?: string | undefined;
};
export type Investimento = {
  id: string;
  nome: string;
  aporteMensal: number;
  acumulado: number;
  alvo?: number | undefined;
  origemAluguel?: boolean | undefined;
  /** Se o aporte sai do salário (30%, viagem) ou de outra entrada (aluguel, dividendos). Default true. */
  origemSalario?: boolean | undefined;
  nota?: string | undefined;
};
export type ContaFixa = {
  id: string;
  nome: string;
  valor: number;
  pago: boolean;
  pagoEm?: string | undefined;
  nota?: string | undefined;
};
export type MeioPagamento = "credito" | "debito" | "pix" | "dinheiro";

export type Cartao = {
  id: string;
  nome: string;
  bandeira?: string | undefined;
  cor: string;
  limite?: number | undefined;
  diaFechamento?: number | undefined;
  diaVencimento?: number | undefined;
  ativo: boolean;
};

export type Lancamento = {
  id: string;
  data: string; // yyyy-mm-dd
  categoria: string;
  valor: number;
  nota?: string | undefined;
  meioPagamento: MeioPagamento;
  mesReferenciaFatura?: string | undefined; // yyyy-mm — preenchido apenas para cartão de crédito
  cartaoId?: string | undefined; // preenchido apenas para cartão de crédito
};
export type DespesaIrregular = {
  id: string;
  descricao: string;
  valor?: number | undefined;
  data?: string | undefined;
  nota?: string | undefined;
};

export type FinanceState = {
  entradas: Entrada[];
  investimentos: Investimento[];
  contas: ContaFixa[];
  lancamentos: Lancamento[];
  irregulares: DespesaIrregular[];
  rendimentoMensal: number; // 0.012
  incluirAluguelNaMeta: boolean;
  mesReferencia: string; // yyyy-mm dos "pagos" das contas
};

export const uid = () => Math.random().toString(36).slice(2, 10);

export const seed: FinanceState = {
  entradas: [
    { id: "salario", nome: "Salário", valor: 4768.21, oficial: true },
    {
      id: "aluguel",
      nome: "Aluguel de imóvel",
      valor: 1500,
      oficial: true,
      nota: "Imóvel é metade meu, metade do meu irmão",
    },
    {
      id: "dividendos",
      nome: "Dividendos",
      valor: 50,
      oficial: true,
      nota: "Reinvestidos automaticamente",
    },
    {
      id: "mesada",
      nome: "Mesada",
      valor: 500,
      oficial: false,
      nota: "Renda instável — bônus à parte, fora de todo cálculo oficial",
    },
  ],
  investimentos: [
    {
      id: "reserva",
      nome: "Reserva de emergência",
      aporteMensal: 900,
      acumulado: 6000,
      nota: "Inter — sem alvo definido",
    },
    {
      id: "italia",
      nome: "Meta Itália",
      aporteMensal: 1000,
      acumulado: 3000,
      alvo: 20000,
      nota: "Nubank — prazo e alvo a definir",
    },
    {
      id: "rendafixa",
      nome: "Aluguel → renda fixa",
      aporteMensal: 1500,
      acumulado: 6000,
      origemAluguel: true,
      nota: "100% do aluguel é investido, nunca gasto",
    },
    { id: "dividendos-inv", nome: "Dividendos reinvestidos", aporteMensal: 50, acumulado: 2500 },
  ],
  contas: [
    { id: "ipva", nome: "IPVA", valor: 116, pago: false },
    { id: "seguro", nome: "Seguro", valor: 305.55, pago: false },
    { id: "ingles", nome: "Inglês", valor: 360, pago: false },
    { id: "academia", nome: "Academia", valor: 137.5, pago: false },
    { id: "assinaturas", nome: "Assinaturas", valor: 160.5, pago: false },
    {
      id: "gasolina",
      nome: "Gasolina",
      valor: 500,
      pago: false,
      nota: "Gasto real ~R$400, R$500 como buffer",
    },
  ],
  lancamentos: [],
  irregulares: [
    { id: uid(), descricao: "Revisão do carro", nota: "Sai da renda fixa quando aparecer" },
  ],
  rendimentoMensal: 0.012,
  incluirAluguelNaMeta: true,
  mesReferencia: new Date().toISOString().slice(0, 7),
};

export const META_GRANDE = 100000;
export const HOBBY_REFERENCIA = 300;
export const HOBBY_CATEGORIA = "cards f1";

const KEY = "financas-v1";

export function useFinance() {
  const [state, setState] = useState<FinanceState>(seed);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setState({ ...seed, ...JSON.parse(raw) });
    } catch {
      /* ignora */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignora */
    }
  }, [state, hydrated]);

  const update = useCallback((fn: (s: FinanceState) => FinanceState) => setState((s) => fn(s)), []);

  return { state, update, hydrated };
}

export const brl = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL", minimumFractionDigits: 2 });

export const mesAtual = () => new Date().toISOString().slice(0, 7);

export function nomeMes(ym: string) {
  const [y, m] = ym.split("-").map(Number) as [number, number];
  return new Date(y, m - 1, 1).toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
}

/**
 * Calcula o mês/ano em que uma compra de cartão de crédito impacta o orçamento.
 *
 * Regra:
 * - Se o dia da compra > dia de fechamento → impacta o mês SEGUINTE
 * - Se o dia da compra <= dia de fechamento → impacta o mês ATUAL
 *
 * @param dataCompra - Data da compra no formato yyyy-mm-dd
 * @param diaFechamento - Dia do mês em que a fatura fecha (ex: 25)
 * @returns string no formato yyyy-mm representando o mês que a compra impacta
 */
export function calcularMesReferenciaFatura(dataCompra: string, diaFechamento: number): string {
  const [ano, mes, dia] = dataCompra.split("-").map(Number) as [number, number, number];

  if (dia > diaFechamento) {
    // Compra feita DEPOIS do fechamento → vai pra fatura do mês seguinte
    const proxMes = mes === 12 ? 1 : mes + 1;
    const proxAno = mes === 12 ? ano + 1 : ano;
    return `${String(proxAno).padStart(4, "0")}-${String(proxMes).padStart(2, "0")}`;
  }

  // Compra feita ANTES ou NO dia do fechamento → fatura do mês atual
  return `${String(ano).padStart(4, "0")}-${String(mes).padStart(2, "0")}`;
}

/**
 * Retorna o mês efetivo que um lançamento impacta no orçamento.
 * - Cartão de crédito: usa mesReferenciaFatura (ou fallback para data se não preenchido)
 * - Outros meios: usa a data da transação
 */
export function mesEfetivoLancamento(l: Lancamento): string {
  if (l.meioPagamento === "credito" && l.mesReferenciaFatura) {
    return l.mesReferenciaFatura;
  }
  return l.data.slice(0, 7);
}

export function totais(state: FinanceState, mes = mesAtual()) {
  const entradasOficiais = state.entradas.filter((e) => e.oficial).reduce((a, e) => a + e.valor, 0);
  const mesada = state.entradas.filter((e) => !e.oficial).reduce((a, e) => a + e.valor, 0);
  const investimentos = state.investimentos.reduce((a, i) => a + i.aporteMensal, 0);
  const contas = state.contas.reduce((a, c) => a + c.valor, 0);
  const livre = entradasOficiais - investimentos - contas;
  const doMes = state.lancamentos.filter((l) => mesEfetivoLancamento(l) === mes);
  const ehHobby = (l: Lancamento) => l.categoria.trim().toLowerCase() === HOBBY_CATEGORIA;
  const gastoHobby = doMes.filter(ehHobby).reduce((a, l) => a + l.valor, 0);
  // Hobby sai da mesada, então não consome o teto do "livre pra gastar".
  const gasto = doMes.filter((l) => !ehHobby(l)).reduce((a, l) => a + l.valor, 0);
  const gastoTotal = gasto + gastoHobby;

  const acumuladoTotal = state.investimentos.reduce((a, i) => a + i.acumulado, 0);
  const acumuladoAluguel = state.investimentos
    .filter((i) => i.origemAluguel)
    .reduce((a, i) => a + i.acumulado, 0);
  const aporteAluguel = state.investimentos
    .filter((i) => i.origemAluguel)
    .reduce((a, i) => a + i.aporteMensal, 0);
  const acumuladoMeta = state.incluirAluguelNaMeta
    ? acumuladoTotal
    : acumuladoTotal - acumuladoAluguel;
  const aporteMeta = state.incluirAluguelNaMeta ? investimentos : investimentos - aporteAluguel;

  return {
    entradasOficiais,
    mesada,
    investimentos,
    contas,
    comprometido: investimentos + contas,
    livre,
    gasto,
    gastoTotal,
    restante: livre - gasto,
    gastoHobby,
    lancamentosDoMes: doMes,
    acumuladoTotal,
    acumuladoAluguel,
    aporteAluguel,
    acumuladoMeta,
    aporteMeta,
  };
}

/** Meses até bater a meta grande, com aportes mensais + rendimento composto. */
export function mesesParaMeta(atual: number, aporte: number, taxa: number, alvo = META_GRANDE) {
  if (atual >= alvo) return 0;
  if (aporte <= 0 && taxa <= 0) return null;
  let saldo = atual;
  for (let m = 1; m <= 1200; m++) {
    saldo = saldo * (1 + taxa) + aporte;
    if (saldo >= alvo) return m;
  }
  return null;
}

export function formatarPrazo(meses: number | null) {
  if (meses === null) return "sem previsão";
  if (meses === 0) return "meta batida";
  const anos = Math.floor(meses / 12);
  const resto = meses % 12;
  if (!anos) return `${meses} ${meses === 1 ? "mês" : "meses"}`;
  return `${anos}a ${resto}m`;
}

/** Converte string digitada (com vírgula ou ponto) para número. */
export function parseValor(str: string): number {
  // Remove pontos de milhar e troca vírgula por ponto decimal
  const limpo = str.replace(/\./g, "").replace(",", ".");
  return Number(limpo) || 0;
}

/**
 * Soma a fatura de cada cartão para os lançamentos de crédito informados.
 * Retorna um mapa cartaoId -> total.
 */
export function faturaPorCartao(lancamentos: Lancamento[]): Map<string, number> {
  const mapa = new Map<string, number>();
  for (const l of lancamentos) {
    if (l.meioPagamento !== "credito" || !l.cartaoId) continue;
    mapa.set(l.cartaoId, (mapa.get(l.cartaoId) ?? 0) + l.valor);
  }
  return mapa;
}

/** Formata número para exibição em input (com vírgula decimal, sem símbolo). */
export function formatValorInput(valor: number): string {
  return valor.toFixed(2).replace(".", ",");
}
