import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { DespesaIrregular } from "../finance";
import { uid } from "../finance";

// ── Configurações ──

export type Configuracoes = {
  rendimentoMensal: number;
  incluirAluguelNaMeta: boolean;
};

export function useConfiguracoes() {
  return useQuery({
    queryKey: ["configuracoes"],
    queryFn: async (): Promise<Configuracoes> => {
      const { data, error } = await supabase
        .from("configuracoes")
        .select("*")
        .eq("id", 1)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        // Row ainda não existe — retorna defaults
        return { rendimentoMensal: 0.012, incluirAluguelNaMeta: true };
      }
      return {
        rendimentoMensal: Number(data["rendimento_mensal"]),
        incluirAluguelNaMeta: data["incluir_aluguel_na_meta"],
      };
    },
  });
}

export function useUpdateConfiguracoes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cfg: Partial<Configuracoes>) => {
      const payload: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (cfg.rendimentoMensal !== undefined) payload["rendimento_mensal"] = cfg.rendimentoMensal;
      if (cfg.incluirAluguelNaMeta !== undefined) payload["incluir_aluguel_na_meta"] = cfg.incluirAluguelNaMeta;
      const { error } = await supabase.from("configuracoes").update(payload).eq("id", 1);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["configuracoes"] }),
  });
}

// ── Despesas Irregulares ──

export function useDespesasIrregulares() {
  return useQuery({
    queryKey: ["despesas_irregulares"],
    queryFn: async (): Promise<DespesaIrregular[]> => {
      const { data, error } = await supabase
        .from("despesas_irregulares")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id,
        descricao: r.descricao,
        valor: r.valor != null ? Number(r.valor) : undefined,
        data: r.data ?? undefined,
        nota: r.nota ?? undefined,
      }));
    },
  });
}

export function useAddDespesaIrregular() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (d: Omit<DespesaIrregular, "id">) => {
      const { error } = await supabase.from("despesas_irregulares").insert({
        id: uid(),
        descricao: d.descricao,
        valor: d.valor ?? null,
        data: d.data ?? null,
        nota: d.nota ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["despesas_irregulares"] }),
  });
}

export function useDeleteDespesaIrregular() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("despesas_irregulares").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["despesas_irregulares"] }),
  });
}
