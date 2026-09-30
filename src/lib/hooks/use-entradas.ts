import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { Entrada } from "../finance";

/** Retorna entradas com valor efetivo do mês (override se existir, senão valor base) */
export function useEntradas(mes?: string) {
  return useQuery({
    queryKey: ["entradas", mes ?? "base"],
    queryFn: async (): Promise<Entrada[]> => {
      const { data: entradas, error: e1 } = await supabase
        .from("entradas")
        .select("*")
        .order("created_at");
      if (e1) throw e1;

      // Se não tem mês, retorna valores base
      if (!mes) {
        return (entradas ?? []).map((r) => ({
          id: r["id"],
          nome: r["nome"],
          valor: Number(r["valor"]),
          oficial: r["oficial"],
          vinculadaInvestimento: r["vinculada_investimento"] ?? false,
          nota: r["nota"] ?? undefined,
        }));
      }

      // Busca overrides do mês
      const { data: overrides, error: e2 } = await supabase
        .from("entradas_mes")
        .select("*")
        .eq("mes", mes);
      if (e2) throw e2;

      const overrideMap = new Map((overrides ?? []).map((o) => [o["entrada_id"], o]));

      return (entradas ?? []).map((r) => {
        const override = overrideMap.get(r["id"]);
        return {
          id: r["id"],
          nome: r["nome"],
          valor: override ? Number(override["valor"]) : Number(r["valor"]),
          oficial: r["oficial"],
          vinculadaInvestimento: r["vinculada_investimento"] ?? false,
          nota: override?.["nota"] ?? r["nota"] ?? undefined,
        };
      });
    },
  });
}

/** Salva override de valor para uma entrada num mês específico */
export function useSetEntradaMes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      entradaId,
      mes,
      valor,
      nota,
    }: {
      entradaId: string;
      mes: string;
      valor: number;
      nota?: string;
    }) => {
      const { error } = await supabase.from("entradas_mes").upsert(
        {
          entrada_id: entradaId,
          mes,
          valor,
          nota: nota ?? null,
        },
        { onConflict: "entrada_id,mes" },
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["entradas"] }),
  });
}

/** Remove override — volta a usar valor base */
export function useResetEntradaMes() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ entradaId, mes }: { entradaId: string; mes: string }) => {
      const { error } = await supabase
        .from("entradas_mes")
        .delete()
        .eq("entrada_id", entradaId)
        .eq("mes", mes);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["entradas"] }),
  });
}

export function useUpsertEntrada() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (entrada: Entrada) => {
      const { error } = await supabase.from("entradas").upsert({
        id: entrada.id,
        nome: entrada.nome,
        valor: entrada.valor,
        oficial: entrada.oficial,
        vinculada_investimento: entrada.vinculadaInvestimento ?? false,
        nota: entrada.nota ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["entradas"] }),
  });
}

export function useDeleteEntrada() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("entradas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["entradas"] }),
  });
}
