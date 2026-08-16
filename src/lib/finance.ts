import { useCallback, useEffect, useState } from "react";

export type Entrada = { id: string; nome: string; valor: number; oficial: boolean; nota?: string | undefined };
export type Investimento = {
  id: string;
  nome: string;
  aporteMensal: number;
  acumulado: number;
  alvo?: number | undefined;
  origemAluguel?: boolean | undefined;
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
export type Lancamento = {
  id: string;
  data: string; // yyyy-mm-dd
  categoria: string;
  valor: number;
  nota?: string | undefined;
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
    { id: "dividendos", nome: "Dividendos", valor: 50, oficial: true, nota: "Reinvestidos automaticamente" },
    {
      id: "mesada",
      nome: "Mesada",
      valor: 500,
      oficial: false,
      nota: "Renda instável — bônus à parte, fora de todo cálculo oficial",
    },
  ],
  investimentos: [
    { id: "reserva", nome: "Reserva de emergência", aporteMensal: 900, acumulado: 6000, nota: "Inter — sem alvo definido" },
    { id: "italia", nome: "Meta Itália", aporteMensal: 1000, acumulado: 3000, alvo: 20000, nota: "Nubank — prazo e alvo a definir" },
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
    { id: "gasolina", nome: "Gasolina", valor: 500, pago: false, nota: "Gasto real ~R$400, R$500 como buffer" },
  ],
  lancamentos: [],
  irregulares: [{ id: uid(), descricao: "Revisão do carro", nota: "Sai da renda fixa quando aparecer" }],
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

export function totais(state: FinanceState, mes = mesAtual()) {
  const entradasOficiais = state.entradas.filter((e) => e.oficial).reduce((a, e) => a + e.valor, 0);
  const mesada = state.entradas.filter((e) => !e.oficial).reduce((a, e) => a + e.valor, 0);
  const investimentos = state.investimentos.reduce((a, i) => a + i.aporteMensal, 0);
  const contas = state.contas.reduce((a, c) => a + c.valor, 0);
  const livre = entradasOficiais - investimentos - contas;
  const doMes = state.lancamentos.filter((l) => l.data.slice(0, 7) === mes);
  const gasto = doMes.reduce((a, l) => a + l.valor, 0);
  const gastoHobby = doMes
    .filter((l) => l.categoria.trim().toLowerCase() === HOBBY_CATEGORIA)
    .reduce((a, l) => a + l.valor, 0);

  const acumuladoTotal = state.investimentos.reduce((a, i) => a + i.acumulado, 0);
  const acumuladoAluguel = state.investimentos
    .filter((i) => i.origemAluguel)
    .reduce((a, i) => a + i.acumulado, 0);
  const acumuladoMeta = state.incluirAluguelNaMeta ? acumuladoTotal : acumuladoTotal - acumuladoAluguel;

  return {
    entradasOficiais,
    mesada,
    investimentos,
    contas,
    comprometido: investimentos + contas,
    livre,
    gasto,
    restante: livre - gasto,
    gastoHobby,
    lancamentosDoMes: doMes,
    acumuladoTotal,
    acumuladoAluguel,
    acumuladoMeta,
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
