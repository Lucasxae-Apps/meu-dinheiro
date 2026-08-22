import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import { uid } from "../finance";

export type Assinatura = {
  id: string;
  nome: string;
  valor: number;
  diaCobranca: number;
  nota?: string;
  ativa: boolean;
};

const QUERY_KEY = ["assinaturas"];

export function useAssinaturas() {
  return useQuery({
    queryKey: QUERY_KEY,
    queryFn: async (): Promise<Assinatura[]> => {
      const { data, error } = await supabase
        .from("assinaturas")
        .select("*")
        .order("dia_cobranca");
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r["id"],
        nome: r["nome"],
        valor: Number(r["valor"]),
        diaCobranca: Number(r["dia_cobranca"]),
        nota: r["nota"] ?? undefined,
        ativa: r["ativa"],
      }));
    },
  });
}

export function useAddAssinatura() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: Omit<Assinatura, "id">) => {
      const { error } = await supabase.from("assinaturas").insert({
        id: uid(),
        nome: a.nome,
        valor: a.valor,
        dia_cobranca: a.diaCobranca,
        nota: a.nota ?? null,
        ativa: a.ativa,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useUpdateAssinatura() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (a: Assinatura) => {
      const { error } = await supabase
        .from("assinaturas")
        .update({
          nome: a.nome,
          valor: a.valor,
          dia_cobranca: a.diaCobranca,
          nota: a.nota ?? null,
          ativa: a.ativa,
        })
        .eq("id", a.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}

export function useDeleteAssinatura() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("assinaturas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: QUERY_KEY }),
  });
}
