import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Trash2, Pencil, Check, X } from "lucide-react";
import { PageHeader, Section } from "@/components/fin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { brl, mesAtual, nomeMes, totais, uid, useFinance, type Lancamento } from "@/lib/finance";

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

const hoje = () => new Date().toISOString().slice(0, 10);

function Lancamentos() {
  const { state, update } = useFinance();
  const [data, setData] = useState(hoje);
  const [categoria, setCategoria] = useState("");
  const [valor, setValor] = useState("");
  const [nota, setNota] = useState("");
  const [mes, setMes] = useState(mesAtual);
  const [filtroCat, setFiltroCat] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState<Lancamento | null>(null);

  const t = totais(state, mes);

  const categorias = useMemo(
    () => Array.from(new Set(state.lancamentos.map((l) => l.categoria))).sort(),
    [state.lancamentos],
  );

  const lista = useMemo(
    () =>
      state.lancamentos
        .filter((l) => l.data.slice(0, 7) === mes)
        .filter((l) => (filtroCat ? l.categoria.toLowerCase().includes(filtroCat.toLowerCase()) : true))
        .sort((a, b) => b.data.localeCompare(a.data)),
    [state.lancamentos, mes, filtroCat],
  );

  const totalFiltrado = lista.reduce((a, l) => a + l.valor, 0);

  function adicionar(e: React.FormEvent) {
    e.preventDefault();
    const v = Number(valor.replace(",", "."));
    if (!v || !categoria.trim()) return;
    update((s) => ({
      ...s,
      lancamentos: [
        ...s.lancamentos,
        { id: uid(), data, categoria: categoria.trim(), valor: v, nota: nota.trim() || undefined },
      ],
    }));
    setValor("");
    setNota("");
  }

  function salvarEdicao() {
    if (!rascunho) return;
    update((s) => ({
      ...s,
      lancamentos: s.lancamentos.map((l) => (l.id === rascunho.id ? rascunho : l)),
    }));
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
            list="categorias"
            placeholder="ex: cards f1, mercado, rolê"
            value={categoria}
            onChange={(e) => setCategoria(e.target.value)}
          />
          <datalist id="categorias">
            {categorias.map((c) => (
              <option key={c} value={c} />
            ))}
          </datalist>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="nota">Nota (opcional)</Label>
          <Input id="nota" value={nota} onChange={(e) => setNota(e.target.value)} />
        </div>
        <Button type="submit" className="w-full">
          Adicionar gasto
        </Button>
      </form>

      <Section
        title="Do mês"
        description={`${nomeMes(mes)} · ${brl(totalFiltrado)} no filtro atual · restam ${brl(t.restante)} do teto`}
      >
        <div className="grid grid-cols-2 gap-3">
          <Input type="month" value={mes} onChange={(e) => setMes(e.target.value)} />
          <Input
            placeholder="Filtrar categoria"
            value={filtroCat}
            onChange={(e) => setFiltroCat(e.target.value)}
          />
        </div>

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
                      setRascunho({ ...rascunho, valor: Number(e.target.value.replace(",", ".")) || 0 })
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
                  <Button size="sm" onClick={salvarEdicao}>
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
                  onClick={() =>
                    update((s) => ({ ...s, lancamentos: s.lancamentos.filter((x) => x.id !== l.id) }))
                  }
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ),
          )}
        </ul>
      </Section>
    </div>
  );
}
