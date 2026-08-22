import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { Lancamento } from "../finance";
import { uid } from "../finance";

export function useLancamentos(mes: string) {
  return useQuery({
    queryKey: ["lancamentos", mes],
    queryFn: async (): Promise<Lancamento[]> => {
      const { data, error } = await supabase
        .from("lancamentos")
        .select("*")
        .eq("mes", mes)
        .order("data", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id,
        data: r.data,
        categoria: r.categoria,
        valor: Number(r.valor),
        nota: r.nota ?? undefined,
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
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lancamentos", mes] }),
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
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lancamentos", mes] }),
  });
}
