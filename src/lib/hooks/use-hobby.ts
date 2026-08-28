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

// ── Types: Coleção e Metas ──

export type CardTipo = "base" | "numbered" | "limited" | "auto" | "relic" | "insert";

export type HobbyCard = {
  id: string;
  piloto: string;
  nome: string;
  setColecao: string;
  tipo: CardTipo;
  numeracao?: string | undefined;
  valorPago?: number | undefined;
  valorEstimado?: number | undefined;
  dataAquisicao: string;
  quantidade: number;
  notas?: string | undefined;
};

export type HobbyMeta = {
  id: string;
  titulo: string;
  descricao?: string | undefined;
  total: number;
  atual: number;
  prazo?: string | undefined;
  concluida: boolean;
};

// ── Coleção ──

export function useHobbyColecao() {
  return useQuery({
    queryKey: ["hobby_colecao"],
    queryFn: async (): Promise<HobbyCard[]> => {
      const { data, error } = await supabase
        .from("hobby_colecao")
        .select("*")
        .order("piloto")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id,
        piloto: r.piloto,
        nome: r.nome,
        setColecao: r.set_colecao,
        tipo: r.tipo as CardTipo,
        numeracao: r.numeracao ?? undefined,
        valorPago: r.valor_pago != null ? Number(r.valor_pago) : undefined,
        valorEstimado: r.valor_estimado != null ? Number(r.valor_estimado) : undefined,
        dataAquisicao: r.data_aquisicao,
        quantidade: Number(r.quantidade),
        notas: r.notas ?? undefined,
      }));
    },
  });
}

export function useAddHobbyCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (card: Omit<HobbyCard, "id">) => {
      const { error } = await supabase.from("hobby_colecao").insert({
        piloto: card.piloto,
        nome: card.nome,
        set_colecao: card.setColecao,
        tipo: card.tipo,
        numeracao: card.numeracao ?? null,
        valor_pago: card.valorPago ?? null,
        valor_estimado: card.valorEstimado ?? null,
        data_aquisicao: card.dataAquisicao,
        quantidade: card.quantidade,
        notas: card.notas ?? null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hobby_colecao"] }),
  });
}

export function useUpdateHobbyCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (card: HobbyCard) => {
      const { error } = await supabase
        .from("hobby_colecao")
        .update({
          piloto: card.piloto,
          nome: card.nome,
          set_colecao: card.setColecao,
          tipo: card.tipo,
          numeracao: card.numeracao ?? null,
          valor_pago: card.valorPago ?? null,
          valor_estimado: card.valorEstimado ?? null,
          data_aquisicao: card.dataAquisicao,
          quantidade: card.quantidade,
          notas: card.notas ?? null,
        })
        .eq("id", card.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hobby_colecao"] }),
  });
}

export function useDeleteHobbyCard() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hobby_colecao").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hobby_colecao"] }),
  });
}

// ── Metas ──

export function useHobbyMetas() {
  return useQuery({
    queryKey: ["hobby_metas"],
    queryFn: async (): Promise<HobbyMeta[]> => {
      const { data, error } = await supabase
        .from("hobby_metas")
        .select("*")
        .order("concluida")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((r) => ({
        id: r.id,
        titulo: r.titulo,
        descricao: r.descricao ?? undefined,
        total: Number(r.total),
        atual: Number(r.atual),
        prazo: r.prazo ?? undefined,
        concluida: Boolean(r.concluida),
      }));
    },
  });
}

export function useAddHobbyMeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (meta: Omit<HobbyMeta, "id">) => {
      const { error } = await supabase.from("hobby_metas").insert({
        titulo: meta.titulo,
        descricao: meta.descricao ?? null,
        total: meta.total,
        atual: meta.atual,
        prazo: meta.prazo ?? null,
        concluida: meta.concluida,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hobby_metas"] }),
  });
}

export function useUpdateHobbyMeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (meta: HobbyMeta) => {
      const { error } = await supabase
        .from("hobby_metas")
        .update({
          titulo: meta.titulo,
          descricao: meta.descricao ?? null,
          total: meta.total,
          atual: meta.atual,
          prazo: meta.prazo ?? null,
          concluida: meta.concluida,
        })
        .eq("id", meta.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hobby_metas"] }),
  });
}

export function useDeleteHobbyMeta() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("hobby_metas").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["hobby_metas"] }),
  });
}
