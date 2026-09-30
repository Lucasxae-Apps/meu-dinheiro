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
          origemSalario: r["origem_salario"] ?? true,
          nota: r["nota"] ?? undefined,
        }));
      }

      // Busca overrides de aporte com vigência ATÉ o mês alvo (mes <= alvo).
      // O override vale "deste mês em diante" até ser substituído por um mais recente.
      // Assim, editar o aporte em setembro afeta setembro em diante, não o passado.
      const { data: overrides, error: e2 } = await supabase
        .from("investimentos_mes")
        .select("*")
        .lte("mes", mes)
        .order("mes", { ascending: true });
      if (e2) throw e2;

      // Para cada investimento, fica com o override de maior `mes` (o mais recente vigente).
      const overrideMap = new Map<string, Record<string, unknown>>();
      for (const o of overrides ?? []) {
        overrideMap.set(o["investimento_id"] as string, o); // ordenado asc → último vence
      }

      return (investimentos ?? []).map((r) => {
        const override = overrideMap.get(r["id"]);
        return {
          id: r["id"],
          nome: r["nome"],
          aporteMensal: override ? Number(override["aporte_mensal"]) : Number(r["aporte_mensal"]),
          acumulado: Number(r["acumulado"]),
          alvo: r["alvo"] != null ? Number(r["alvo"]) : undefined,
          origemAluguel: r["origem_aluguel"] ?? undefined,
          origemSalario: r["origem_salario"] ?? true,
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
    mutationFn: async ({
      investimentoId,
      mes,
      aporteMensal,
      nota,
    }: {
      investimentoId: string;
      mes: string;
      aporteMensal: number;
      nota?: string;
    }) => {
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
          origem_salario: inv.origemSalario ?? true,
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
        origem_salario: inv.origemSalario ?? true,
        nota: inv.nota ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["investimentos"] }),
  });
}

/** Retorna o set de IDs de investimentos cujo aporte já foi marcado como feito no mês. */
export function useAportesFeitos(mes: string) {
  return useQuery({
    queryKey: ["aportes_feitos", mes],
    queryFn: async (): Promise<Set<string>> => {
      const { data, error } = await supabase
        .from("investimentos_aporte_feito")
        .select("investimento_id")
        .eq("mes", mes);
      if (error) throw error;
      return new Set((data ?? []).map((r) => r["investimento_id"] as string));
    },
  });
}

/**
 * Marca o aporte de um investimento como feito no mês:
 * registra o valor aportado e soma ao acumulado do investimento.
 * É idempotente — se já estiver marcado, não faz nada.
 */
export function useMarcarAporte() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      investimentoId,
      mes,
      aporte,
      acumuladoAtual,
    }: {
      investimentoId: string;
      mes: string;
      aporte: number;
      acumuladoAtual: number;
    }) => {
      // Evita dupla contagem: só soma se ainda não houver registro
      const { data: existente, error: eSel } = await supabase
        .from("investimentos_aporte_feito")
        .select("id")
        .eq("investimento_id", investimentoId)
        .eq("mes", mes)
        .maybeSingle();
      if (eSel) throw eSel;
      if (existente) return;

      const { error: eIns } = await supabase.from("investimentos_aporte_feito").insert({
        investimento_id: investimentoId,
        mes,
        valor_aportado: aporte,
      });
      if (eIns) throw eIns;

      const { error: eUpd } = await supabase
        .from("investimentos")
        .update({ acumulado: acumuladoAtual + aporte })
        .eq("id", investimentoId);
      if (eUpd) throw eUpd;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aportes_feitos"] });
      qc.invalidateQueries({ queryKey: ["investimentos"] });
    },
  });
}

/**
 * Desmarca o aporte: estorna o valor aportado do acumulado e remove o registro.
 */
export function useDesmarcarAporte() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      investimentoId,
      mes,
      acumuladoAtual,
    }: {
      investimentoId: string;
      mes: string;
      acumuladoAtual: number;
    }) => {
      const { data: registro, error: eSel } = await supabase
        .from("investimentos_aporte_feito")
        .select("valor_aportado")
        .eq("investimento_id", investimentoId)
        .eq("mes", mes)
        .maybeSingle();
      if (eSel) throw eSel;
      if (!registro) return;

      const valorAportado = Number(registro["valor_aportado"]);

      const { error: eDel } = await supabase
        .from("investimentos_aporte_feito")
        .delete()
        .eq("investimento_id", investimentoId)
        .eq("mes", mes);
      if (eDel) throw eDel;

      const { error: eUpd } = await supabase
        .from("investimentos")
        .update({ acumulado: Math.max(0, acumuladoAtual - valorAportado) })
        .eq("id", investimentoId);
      if (eUpd) throw eUpd;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["aportes_feitos"] });
      qc.invalidateQueries({ queryKey: ["investimentos"] });
    },
  });
}
