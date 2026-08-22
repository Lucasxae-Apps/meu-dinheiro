import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Trash2, Pencil, Check, X, Loader2 } from "lucide-react";
import { PageHeader, Section } from "@/components/fin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { brl, nomeMes, uid, parseValor, formatValorInput, type Lancamento } from "@/lib/finance";
import { useMes } from "@/lib/mes-context";
import {
  useLancamentos,
  useAddLancamento,
  useUpdateLancamento,
  useDeleteLancamento,
  useEntradas,
  useInvestimentos,
  useContasFixas,
  useAssinaturas,
} from "@/lib/hooks";

export const Route = createFileRoute("/lancamentos")({
  head: () => ({
    meta: [
      { title: "Lançamentos — Controle financeiro pessoal" },
      {
        name: "description",
        content: "Registro rápido de gastos do mês com categoria livre, filtro por mês e por categoria.",
      },
      { property: "og:title", content: "Lançamentos — Controle financeiro pessoal" },
      {
        property: "og:description",
        content: "Adicione, edite e filtre os gastos variáveis do mês direto do celular.",
      },
    ],
  }),
  component: Lancamentos,
});

const HOBBY_CATEGORIA = "cards f1";

const hoje = () => new Date().toISOString().slice(0, 10);

function Lancamentos() {
  const { mes } = useMes();
  const { data: lancamentos = [], isLoading } = useLancamentos(mes);
  const { data: entradas = [] } = useEntradas(mes);
  const { data: investimentos = [] } = useInvestimentos(mes);
  const { data: contas = [] } = useContasFixas(mes);
  const { data: assinaturas = [] } = useAssinaturas();

  const addMutation = useAddLancamento(mes);
  const updateMutation = useUpdateLancamento(mes);
  const deleteMutation = useDeleteLancamento(mes);

  const [data, setData] = useState(hoje);
  const [categoria, setCategoria] = useState("");
  const [valor, setValor] = useState("");
  const [nota, setNota] = useState("");
  const [filtroCat, setFiltroCat] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState<Lancamento | null>(null);

  // Cálculos derivados
  const totalAssinaturas = assinaturas.filter((a) => a.ativa).reduce((a, s) => a + s.valor, 0);
  const entradasOficiais = entradas.filter((e) => e.oficial).reduce((a, e) => a + e.valor, 0);
  const totalInvestimentos = investimentos.reduce((a, i) => a + i.aporteMensal, 0);
  const totalContas = contas.reduce((a, c) => (c.id === "assinaturas" ? a + totalAssinaturas : a + c.valor), 0);
  const livre = entradasOficiais - totalInvestimentos - totalContas;

  const ehHobby = (l: Lancamento) => l.categoria.trim().toLowerCase() === HOBBY_CATEGORIA;
  const gastoSemHobby = lancamentos.filter((l) => !ehHobby(l)).reduce((a, l) => a + l.valor, 0);
  const restante = livre - gastoSemHobby;

  const categorias = useMemo(() => {
    const mapa = new Map<string, string>();
    for (const c of [HOBBY_CATEGORIA, ...lancamentos.map((l) => l.categoria)]) {
      const chave = c.trim().toLowerCase();
      if (chave && !mapa.has(chave)) mapa.set(chave, c.trim());
    }
    return Array.from(mapa.values()).sort((a, b) => a.localeCompare(b, "pt-BR"));
  }, [lancamentos]);

  const sugestoes = useMemo(() => {
    const q = categoria.trim().toLowerCase();
    const base = q ? categorias.filter((c) => c.toLowerCase().includes(q)) : categorias;
    return base.filter((c) => c.toLowerCase() !== q).slice(0, 6);
  }, [categorias, categoria]);

  const lista = useMemo(
    () =>
      lancamentos
        .filter((l) => (filtroCat ? l.categoria.toLowerCase().includes(filtroCat.toLowerCase()) : true))
        .sort((a, b) => b.data.localeCompare(a.data)),
    [lancamentos, filtroCat],
  );

  const totalFiltrado = lista.reduce((a, l) => a + l.valor, 0);

  function adicionar(e: React.FormEvent) {
    e.preventDefault();
    const v = parseValor(valor);
    const digitada = categoria.trim();
    if (!v || !digitada) return;
    const existente = categorias.find((c) => c.toLowerCase() === digitada.toLowerCase());
    addMutation.mutate({
      id: uid(),
      data,
      categoria: existente ?? digitada,
      valor: v,
      nota: nota.trim() || undefined,
    });
    setValor("");
    setNota("");
  }

  function salvarEdicao() {
    if (!rascunho) return;
    updateMutation.mutate(rascunho);
    setEditando(null);
    setRascunho(null);
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Lançamentos" subtitle="O que substitui a planilha" />

      <form onSubmit={adicionar} className="space-y-3 rounded-xl border bg-card p-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label htmlFor="data">Data</Label>
            <Input id="data" type="date" value={data} onChange={(e) => setData(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="valor">Valor</Label>
            <Input
              id="valor"
              inputMode="decimal"
              placeholder="0,00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="categoria">Categoria</Label>
          <Input
            id="categoria"
            autoComplete="off"
            placeholder="ex: cards f1, mercado, rolê"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          />
          {sugestoes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-0.5">
              {sugestoes.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setCategoria(c)}
                  className="rounded-full border bg-secondary px-2.5 py-1 text-xs text-muted-foreground hover:text-foreground"
                >
                  {c}
                </button>
              ))}
            </div>
          )}
          <p className="text-xs text-muted-foreground">
            Gastos em "cards f1" contam como hobby: saem da mesada e não descontam do teto do mês.
          </p>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="nota">Nota (opcional)</Label>
          <Input id="nota" value={nota} onChange={(e) => setNota(e.target.value)} />
        </div>
        <Button type="submit" className="w-full" disabled={addMutation.isPending}>
          {addMutation.isPending ? <Loader2 className="size-4 animate-spin" /> : "Adicionar gasto"}
        </Button>
      </form>

      <Section
        title="Do mês"
        description={`${nomeMes(mes)} · ${brl(totalFiltrado)} no filtro atual · restam ${brl(restante)} do teto`}
      >
        <div className="grid grid-cols-1 gap-3">
          <Input
            placeholder="Filtrar categoria"
            value={filtroCat}
            onChange={(e) => setFiltroCat(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ul className="mt-3 divide-y rounded-xl border bg-card">
            {lista.length === 0 && (
              <li className="p-4 text-sm text-muted-foreground">Nenhum lançamento nesse recorte.</li>
            )}
            {lista.map((l) =>
              editando === l.id && rascunho ? (
                <li key={l.id} className="space-y-2 p-3">
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      type="date"
                      value={rascunho.data}
                      onChange={(e) => setRascunho({ ...rascunho, data: e.target.value })}
                    />
                    <Input
                      inputMode="decimal"
                      value={String(rascunho.valor)}
                      onChange={(e) =>
                        setRascunho({ ...rascunho, valor: parseValor(e.target.value) })
                      }
                    />
                  </div>
                  <Input
                    value={rascunho.categoria}
                    onChange={(e) => setRascunho({ ...rascunho, categoria: e.target.value })}
                  />
                  <Input
                    placeholder="Nota"
                    value={rascunho.nota ?? ""}
                    onChange={(e) => setRascunho({ ...rascunho, nota: e.target.value })}
                  />
                  <div className="flex gap-2">
                    <Button size="sm" onClick={salvarEdicao} disabled={updateMutation.isPending}>
                      <Check className="size-4" /> Salvar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditando(null);
                        setRascunho(null);
                      }}
                    >
                      <X className="size-4" /> Cancelar
                    </Button>
                  </div>
                </li>
              ) : (
                <li key={l.id} className="flex items-center gap-3 p-3">
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{l.categoria}</p>
                    <p className="num text-xs text-muted-foreground">
                      {l.data.split("-").reverse().join("/")}
                      {l.nota ? ` · ${l.nota}` : ""}
                    </p>
                  </div>
                  <span className="num text-sm font-semibold">{brl(l.valor)}</span>
                  <button
                    aria-label="Editar"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setEditando(l.id);
                      setRascunho(l);
                    }}
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    aria-label="Remover"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => deleteMutation.mutate(l.id)}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ),
            )}
          </ul>
        )}
      </Section>
    </div>
  );
}
