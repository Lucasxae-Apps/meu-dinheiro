import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { Cartao } from "../finance";
import { uid } from "../finance";

function mapCartao(r: Record<string, unknown>): Cartao {
  return {
    id: r["id"] as string,
    nome: r["nome"] as string,
    bandeira: (r["bandeira"] as string | null) ?? undefined,
    cor: (r["cor"] as string | null) ?? "#6366f1",
    limite: r["limite"] != null ? Number(r["limite"]) : undefined,
    diaFechamento: r["dia_fechamento"] != null ? Number(r["dia_fechamento"]) : undefined,
    diaVencimento: r["dia_vencimento"] != null ? Number(r["dia_vencimento"]) : undefined,
    ativo: Boolean(r["ativo"] ?? true),
  };
}

export function useCartoes() {
  return useQuery({
    queryKey: ["cartoes"],
    queryFn: async (): Promise<Cartao[]> => {
      const { data, error } = await supabase.from("cartoes").select("*").order("created_at");
      if (error) throw error;
      return (data ?? []).map(mapCartao);
    },
  });
}

export function useUpsertCartao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (cartao: Omit<Cartao, "id"> & { id?: string }) => {
      const { error } = await supabase.from("cartoes").upsert({
        id: cartao.id ?? uid(),
        nome: cartao.nome,
        bandeira: cartao.bandeira ?? null,
        cor: cartao.cor,
        limite: cartao.limite ?? null,
        dia_fechamento: cartao.diaFechamento ?? null,
        dia_vencimento: cartao.diaVencimento ?? null,
        ativo: cartao.ativo,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cartoes"] }),
  });
}

export function useDeleteCartao() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("cartoes").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["cartoes"] });
      qc.invalidateQueries({ queryKey: ["lancamentos"] });
    },
  });
}
