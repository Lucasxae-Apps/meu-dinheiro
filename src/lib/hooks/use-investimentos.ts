import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { Investimento } from "../finance";

/** Retorna investimentos com aporte efetivo do mês (override se existir, senão valor base) */
export function useInvestimentos(mes?: string) {
  return useQuery({
    queryKey: ["investimentos", mes ?? "base"],
    queryFn: async (): Promise<Investimento[]> => {
      const { data: investimentos, error: e1 } = await supabase
        .from("investimentos")
        .select("*")
        .order("created_at");
      if (e1) throw e1;

      if (!mes) {
        return (investimentos ?? []).map((r) => ({
          id: r["id"],
          nome: r["nome"],
          aporteMensal: Number(r["aporte_mensal"]),
          acumulado: Number(r["acumulado"]),
          alvo: r["alvo"] != null ? Number(r["alvo"]) : undefined,
          origemAluguel: r["origem_aluguel"] ?? undefined,
          nota: r["nota"] ?? undefined,
        }));
      }

      // Busca overrides de aporte do mês
      const { data: overrides, error: e2 } = await supabase
        .from("investimentos_mes")
        .select("*")
        .eq("mes", mes);
      if (e2) throw e2;

      const overrideMap = new Map(
        (overrides ?? []).map((o) => [o["investimento_id"], o]),
      );

      return (investimentos ?? []).map((r) => {
        const override = overrideMap.get(r["id"]);
        return {
          id: r["id"],
          nome: r["nome"],
          aporteMensal: override ? Number(override["aporte_mensal"]) : Number(r["aporte_mensal"]),
          acumulado: Number(r["acumulado"]),
          alvo: r["alvo"] != null ? Number(r["alvo"]) : undefined,
          origemAluguel: r["origem_aluguel"] ?? undefined,
          nota: override?.["nota"] ?? r["nota"] ?? undefined,
        };
      });
    },
  });
}

/** Salva override de aporte para um investimento num mês específico */
export function useSetInvestimentoMes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ investimentoId, mes, aporteMensal, nota }: { investimentoId: string; mes: string; aporteMensal: number; nota?: string }) => {
      const { error } = await supabase.from("investimentos_mes").upsert(
        {
          investimento_id: investimentoId,
          mes,
          aporte_mensal: aporteMensal,
          nota: nota ?? null,
        },
        { onConflict: "investimento_id,mes" },
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["investimentos"] }),
  });
}

/** Remove override — volta a usar aporte base */
export function useResetInvestimentoMes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ investimentoId, mes }: { investimentoId: string; mes: string }) => {
      const { error } = await supabase
        .from("investimentos_mes")
        .delete()
        .eq("investimento_id", investimentoId)
        .eq("mes", mes);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["investimentos"] }),
  });
}

/** Atualiza dados base do investimento (acumulado, alvo, etc.) */
export function useUpdateInvestimento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inv: Investimento) => {
      const { error } = await supabase
        .from("investimentos")
        .update({
          nome: inv.nome,
          aporte_mensal: inv.aporteMensal,
          acumulado: inv.acumulado,
          alvo: inv.alvo ?? null,
          origem_aluguel: inv.origemAluguel ?? false,
          nota: inv.nota ?? null,
        })
        .eq("id", inv.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["investimentos"] }),
  });
}

export function useUpsertInvestimento() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (inv: Investimento) => {
      const { error } = await supabase.from("investimentos").upsert({
        id: inv.id,
        nome: inv.nome,
        aporte_mensal: inv.aporteMensal,
        acumulado: inv.acumulado,
        alvo: inv.alvo ?? null,
        origem_aluguel: inv.origemAluguel ?? false,
        nota: inv.nota ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["investimentos"] }),
  });
}
