import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { Lancamento, MeioPagamento } from "../finance";
import { uid } from "../finance";

/**
 * Busca lançamentos que impactam o orçamento de um determinado mês.
 *
 * A lógica é:
 * - Lançamentos com meio_pagamento = 'credito' usam mes_referencia_fatura
 * - Todos os outros usam o campo gerado `mes` (derivado da data)
 *
 * Usamos um OR no Supabase para trazer ambos os conjuntos.
 */
export function useLancamentos(mes: string) {
  return useQuery({
    queryKey: ["lancamentos", mes],
    queryFn: async (): Promise<Lancamento[]> => {
      // Busca: (não é crédito E mes = alvo) OU (é crédito E mes_referencia_fatura = alvo)
      const { data, error } = await supabase
        .from("lancamentos")
        .select("*")
        .or(
          `and(meio_pagamento.neq.credito,mes.eq.${mes}),and(meio_pagamento.eq.credito,mes_referencia_fatura.eq.${mes})`,
        )
        .order("data", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id,
        data: r.data,
        categoria: r.categoria,
        valor: Number(r.valor),
        nota: r.nota ?? undefined,
        meioPagamento: (r.meio_pagamento ?? "debito") as MeioPagamento,
        mesReferenciaFatura: r.mes_referencia_fatura ?? undefined,
        cartaoId: r.cartao_id ?? undefined,
      }));
    },
  });
}

export function useAddLancamento(mes: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (lancamento: Omit<Lancamento, "id"> & { id?: string }) => {
      const { error } = await supabase.from("lancamentos").insert({
        id: lancamento.id ?? uid(),
        data: lancamento.data,
        categoria: lancamento.categoria,
        valor: lancamento.valor,
        nota: lancamento.nota ?? null,
        meio_pagamento: lancamento.meioPagamento,
        mes_referencia_fatura: lancamento.mesReferenciaFatura ?? null,
        cartao_id: lancamento.cartaoId ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lancamentos"] }),
  });
}

export function useUpdateLancamento(mes: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (lancamento: Lancamento) => {
      const { error } = await supabase
        .from("lancamentos")
        .update({
          data: lancamento.data,
          categoria: lancamento.categoria,
          valor: lancamento.valor,
          nota: lancamento.nota ?? null,
          meio_pagamento: lancamento.meioPagamento,
          mes_referencia_fatura: lancamento.mesReferenciaFatura ?? null,
          cartao_id: lancamento.cartaoId ?? null,
        })
        .eq("id", lancamento.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lancamentos"] }),
  });
}

export function useDeleteLancamento(mes: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("lancamentos").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lancamentos"] }),
  });
}
