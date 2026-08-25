import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../supabase";

// ── Types ──

export type HobbyCategoria = "singles" | "packs" | "acessorios" | "frete" | "outros";
export type HobbyTipoCompra = "planejada" | "impulsiva";
export type WishlistPrioridade = "favorito" | "raro" | "completar_time" | "visual";
export type WishlistStatus = "quero" | "acompanhando_preco" | "comprado";
export type VendaStatus = "anunciado" | "negociando" | "vendido";

export type HobbyBudget = {
  id: string;
  mes: string;
  valorLimite: number;
};

export type HobbyWishlistItem = {
  id: string;
  nome: string;
  prioridade: WishlistPrioridade;
  precoMedio?: number;
  status: WishlistStatus;
  notas?: string;
};

export type HobbyCompra = {
  id: string;
  descricao: string;
  valor: number;
  categoria: HobbyCategoria;
  tipo: HobbyTipoCompra;
  data: string; // yyyy-mm-dd
  wishlistId?: string;
  notas?: string;
};

export type HobbyEstoque = {
  id: string;
  tipo: string;
  quantidade: number;
  quantidadeMinima: number;
};

export type HobbyVenda = {
  id: string;
  descricao: string;
  valorPedido: number;
  status: VendaStatus;
  canal?: string;
  data: string;
  notas?: string;
};

// ── Budget ──

export function useHobbyBudget(mes: string) {
  return useQuery({
    queryKey: ["hobby_budget", mes],
    queryFn: async (): Promise<HobbyBudget | null> => {
      const { data, error } = await supabase
        .from("hobby_budget")
        .select("*")
        .eq("mes", mes)
        .maybeSingle();
      if (error) throw error;
      if (!data) return null;
      return {
        id: data.id,
        mes: data.mes,
        valorLimite: Number(data.valor_limite),
      };
    },
  });
}

export function useUpsertHobbyBudget() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ mes, valorLimite }: { mes: string; valorLimite: number }) => {
      const { error } = await supabase.from("hobby_budget").upsert(
        { mes, valor_limite: valorLimite },
        { onConflict: "mes" },
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hobby_budget"] }),
  });
}

// ── Wishlist ──

export function useHobbyWishlist() {
  return useQuery({
    queryKey: ["hobby_wishlist"],
    queryFn: async (): Promise<HobbyWishlistItem[]> => {
      const { data, error } = await supabase
        .from("hobby_wishlist")
        .select("*")
        .neq("status", "comprado")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => {
        const item: HobbyWishlistItem = {
          id: r.id,
          nome: r.nome,
          prioridade: r.prioridade as WishlistPrioridade,
          status: r.status as WishlistStatus,
        };
        if (r.preco_medio != null) item.precoMedio = Number(r.preco_medio);
        if (r.notas != null) item.notas = r.notas;
        return item;
      });
    },
  });
}

export function useAddHobbyWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Omit<HobbyWishlistItem, "id">) => {
      const { error } = await supabase.from("hobby_wishlist").insert({
        nome: item.nome,
        prioridade: item.prioridade,
        preco_medio: item.precoMedio ?? null,
        status: item.status,
        notas: item.notas ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hobby_wishlist"] }),
  });
}

export function useUpdateHobbyWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: HobbyWishlistItem) => {
      const { error } = await supabase
        .from("hobby_wishlist")
        .update({
          nome: item.nome,
          prioridade: item.prioridade,
          preco_medio: item.precoMedio ?? null,
          status: item.status,
          notas: item.notas ?? null,
        })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hobby_wishlist"] }),
  });
}

export function useDeleteHobbyWishlist() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hobby_wishlist").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hobby_wishlist"] }),
  });
}

// ── Compras ──

export function useHobbyCompras(mes: string) {
  return useQuery({
    queryKey: ["hobby_compras", mes],
    queryFn: async (): Promise<HobbyCompra[]> => {
      // Filtra compras cujo mês (yyyy-mm) da data bate com o mês selecionado
      const inicio = `${mes}-01`;
      const [y, m] = mes.split("-").map(Number) as [number, number];
      const ultimoDia = new Date(y, m, 0).getDate();
      const fim = `${mes}-${String(ultimoDia).padStart(2, "0")}`;

      const { data, error } = await supabase
        .from("hobby_compras")
        .select("*")
        .gte("data", inicio)
        .lte("data", fim)
        .order("data", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id,
        descricao: r.descricao,
        valor: Number(r.valor),
        categoria: r.categoria as HobbyCategoria,
        tipo: r.tipo as HobbyTipoCompra,
        data: r.data,
        wishlistId: r.wishlist_id ?? undefined,
        notas: r.notas ?? undefined,
      }));
    },
  });
}

export function useAddHobbyCompra(mes: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (compra: Omit<HobbyCompra, "id">) => {
      const { error } = await supabase.from("hobby_compras").insert({
        descricao: compra.descricao,
        valor: compra.valor,
        categoria: compra.categoria,
        tipo: compra.tipo,
        data: compra.data,
        wishlist_id: compra.wishlistId ?? null,
        notas: compra.notas ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hobby_compras", mes] }),
  });
}

export function useDeleteHobbyCompra(mes: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hobby_compras").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hobby_compras", mes] }),
  });
}

// ── Estoque de acessórios ──

export function useHobbyEstoque() {
  return useQuery({
    queryKey: ["hobby_estoque"],
    queryFn: async (): Promise<HobbyEstoque[]> => {
      const { data, error } = await supabase
        .from("hobby_estoque_acessorios")
        .select("*")
        .order("tipo");
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id,
        tipo: r.tipo,
        quantidade: Number(r.quantidade),
        quantidadeMinima: Number(r.quantidade_minima),
      }));
    },
  });
}

export function useUpsertHobbyEstoque() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: HobbyEstoque) => {
      const { error } = await supabase.from("hobby_estoque_acessorios").upsert({
        id: item.id,
        tipo: item.tipo,
        quantidade: item.quantidade,
        quantidade_minima: item.quantidadeMinima,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hobby_estoque"] }),
  });
}

export function useAddHobbyEstoque() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (item: Omit<HobbyEstoque, "id">) => {
      const { error } = await supabase.from("hobby_estoque_acessorios").insert({
        tipo: item.tipo,
        quantidade: item.quantidade,
        quantidade_minima: item.quantidadeMinima,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hobby_estoque"] }),
  });
}

// ── Vendas ──

export function useHobbyVendas() {
  return useQuery({
    queryKey: ["hobby_vendas"],
    queryFn: async (): Promise<HobbyVenda[]> => {
      const { data, error } = await supabase
        .from("hobby_vendas")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id,
        descricao: r.descricao,
        valorPedido: Number(r.valor_pedido),
        status: r.status as VendaStatus,
        canal: r.canal ?? undefined,
        data: r.data,
        notas: r.notas ?? undefined,
      }));
    },
  });
}

export function useAddHobbyVenda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (venda: Omit<HobbyVenda, "id">) => {
      const { error } = await supabase.from("hobby_vendas").insert({
        descricao: venda.descricao,
        valor_pedido: venda.valorPedido,
        status: venda.status,
        canal: venda.canal ?? null,
        data: venda.data,
        notas: venda.notas ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hobby_vendas"] }),
  });
}

export function useUpdateHobbyVenda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (venda: HobbyVenda) => {
      const { error } = await supabase
        .from("hobby_vendas")
        .update({
          descricao: venda.descricao,
          valor_pedido: venda.valorPedido,
          status: venda.status,
          canal: venda.canal ?? null,
          data: venda.data,
          notas: venda.notas ?? null,
        })
        .eq("id", venda.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hobby_vendas"] }),
  });
}

export function useDeleteHobbyVenda() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hobby_vendas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hobby_vendas"] }),
  });
}
