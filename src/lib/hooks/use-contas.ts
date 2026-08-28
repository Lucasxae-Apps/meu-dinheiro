import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";
import type { ContaFixa } from "../finance";

export type ContaComStatus = ContaFixa & { statusId?: string; valorReal?: number };

export function useContasFixas(mes: string) {
  return useQuery({
    queryKey: ["contas_fixas", mes],
    queryFn: async (): Promise<ContaComStatus[]> => {
      // Busca contas + join com status do mês
      const { data: contas, error: e1 } = await supabase
        .from("contas_fixas")
        .select("*")
        .order("created_at");
      if (e1) throw e1;

      const { data: status, error: e2 } = await supabase
        .from("contas_status")
        .select("*")
        .eq("mes", mes);
      if (e2) throw e2;

      const statusMap = new Map(
        (status ?? []).map((s) => [s.conta_id, s]),
      );

      return (contas ?? []).map((c) => {
        const s = statusMap.get(c.id);
        return {
          id: c.id,
          nome: c.nome,
          valor: Number(c.valor),
          nota: c.nota ?? undefined,
          pago: s?.pago ?? false,
          pagoEm: s?.pago_em ?? undefined,
          valorReal: s?.valor_real != null ? Number(s.valor_real) : undefined,
          statusId: s?.id,
        };
      });
    },
  });
}

export function useTogglePago(mes: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      contaId,
      pago,
      pagoEm,
    }: {
      contaId: string;
      pago: boolean;
      pagoEm?: string;
    }) => {
      if (pago) {
        // Upsert: marca como pago
        const { error } = await supabase.from("contas_status").upsert(
          {
            conta_id: contaId,
            mes,
            pago: true,
            pago_em: pagoEm ?? new Date().toISOString().slice(0, 10),
          },
          { onConflict: "conta_id,mes" },
        );
        if (error) throw error;
      } else {
        // Remove status (volta ao "não pago")
        const { error } = await supabase
          .from("contas_status")
          .delete()
          .eq("conta_id", contaId)
          .eq("mes", mes);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contas_fixas", mes] }),
  });
}

export function useUpdatePagoEm(mes: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ contaId, pagoEm }: { contaId: string; pagoEm: string }) => {
      const { error } = await supabase
        .from("contas_status")
        .update({ pago_em: pagoEm })
        .eq("conta_id", contaId)
        .eq("mes", mes);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contas_fixas", mes] }),
  });
}

export function useUpsertContaFixa() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (conta: { id: string; nome: string; valor: number; nota?: string }) => {
      const { error } = await supabase.from("contas_fixas").upsert({
        id: conta.id,
        nome: conta.nome,
        valor: conta.valor,
        nota: conta.nota ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contas_fixas"] }),
  });
}

export function useUpdateValorReal(mes: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ contaId, valorReal }: { contaId: string; valorReal: number | null }) => {
      const { error } = await supabase.from("contas_status").upsert(
        {
          conta_id: contaId,
          mes,
          pago: true,
          valor_real: valorReal,
        },
        { onConflict: "conta_id,mes" },
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["contas_fixas", mes] }),
  });
}
