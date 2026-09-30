import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import { uid } from "../finance";

export type TipoMovimento = "aporte" | "retirada";

export type InvestimentoMovimento = {
  id: string;
  investimentoId: string;
  tipo: TipoMovimento;
  valor: number;
  motivo?: string | undefined;
  data: string; // yyyy-mm-dd
};

/** Histórico completo de movimentações (todas as caixinhas), mais recentes primeiro. */
export function useInvestimentoMovimentos(investimentoId?: string) {
  return useQuery({
    queryKey: ["investimento_movimentos", investimentoId ?? "todos"],
    queryFn: async (): Promise<InvestimentoMovimento[]> => {
      let query = supabase
        .from("investimento_movimentos")
        .select("*")
        .order("data", { ascending: false })
        .order("created_at", { ascending: false });
      if (investimentoId) query = query.eq("investimento_id", investimentoId);
      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r["id"],
        investimentoId: r["investimento_id"],
        tipo: r["tipo"],
        valor: Number(r["valor"]),
        motivo: r["motivo"] ?? undefined,
        data: r["data"],
      }));
    },
  });
}

/**
 * Registra um aporte ou retirada numa caixinha: grava o movimento e ajusta
 * o acumulado (soma se aporte, subtrai se retirada — nunca deixa negativo).
 */
export function useAddMovimento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      investimentoId,
      tipo,
      valor,
      motivo,
      data,
      acumuladoAtual,
    }: {
      investimentoId: string;
      tipo: TipoMovimento;
      valor: number;
      motivo?: string;
      data: string;
      acumuladoAtual: number;
    }) => {
      const { error: eIns } = await supabase.from("investimento_movimentos").insert({
        id: uid(),
        investimento_id: investimentoId,
        tipo,
        valor,
        motivo: motivo?.trim() || null,
        data,
      });
      if (eIns) throw eIns;

      const novoAcumulado =
        tipo === "aporte" ? acumuladoAtual + valor : Math.max(0, acumuladoAtual - valor);
      const { error: eUpd } = await supabase
        .from("investimentos")
        .update({ acumulado: novoAcumulado })
        .eq("id", investimentoId);
      if (eUpd) throw eUpd;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["investimento_movimentos"] });
      qc.invalidateQueries({ queryKey: ["investimentos"] });
    },
  });
}

/** Remove um movimento e estorna o efeito no acumulado. */
export function useDeleteMovimento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      investimentoId,
      tipo,
      valor,
      acumuladoAtual,
    }: {
      id: string;
      investimentoId: string;
      tipo: TipoMovimento;
      valor: number;
      acumuladoAtual: number;
    }) => {
      const { error: eDel } = await supabase.from("investimento_movimentos").delete().eq("id", id);
      if (eDel) throw eDel;

      const acumuladoEstornado =
        tipo === "aporte" ? Math.max(0, acumuladoAtual - valor) : acumuladoAtual + valor;
      const { error: eUpd } = await supabase
        .from("investimentos")
        .update({ acumulado: acumuladoEstornado })
        .eq("id", investimentoId);
      if (eUpd) throw eUpd;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["investimento_movimentos"] });
      qc.invalidateQueries({ queryKey: ["investimentos"] });
    },
  });
}
