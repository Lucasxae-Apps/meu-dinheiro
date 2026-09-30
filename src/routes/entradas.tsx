import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Loader2, Pencil, Check, X, Plus, Trash2, RotateCcw } from "lucide-react";
import { PageHeader, Section, Stat } from "@/components/fin";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { brl, formatValorInput, nomeMes, parseValor, uid, type Entrada } from "@/lib/finance";
import { useMes } from "@/lib/mes-context";
import {
  useEntradas,
  useSetEntradaMes,
  useResetEntradaMes,
  useUpsertEntrada,
  useDeleteEntrada,
} from "@/lib/hooks";

export const Route = createFileRoute("/entradas")({
  head: () => ({
    meta: [
      { title: "Entradas — Controle financeiro pessoal" },
      {
        name: "description",
        content: "Salário, mesada e extras do mês — o que entra e o que conta pro teto de gastos.",
      },
    ],
  }),
  component: Entradas,
});

function Entradas() {
  const { mes } = useMes();
  const { data: entradasBase = [] } = useEntradas(); // valores base, sem override
  const { data: entradas = [], isLoading } = useEntradas(mes);
  const setMes = useSetEntradaMes();
  const resetMes = useResetEntradaMes();
  const upsert = useUpsertEntrada();
  const del = useDeleteEntrada();

  const baseMap = new Map(entradasBase.map((e) => [e.id, e.valor]));

  const [editandoId, setEditandoId] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState("");

  const [novoAberto, setNovoAberto] = useState(false);
  const [novoNome, setNovoNome] = useState("");
  const [novoValor, setNovoValor] = useState("");
  const [novoOficial, setNovoOficial] = useState(true);
  const [novoSoEsteMes, setNovoSoEsteMes] = useState(true);

  // Entradas "só este mês" ficam com valor base 0 — escondemos elas nos
  // meses em que não têm override (valor 0), pra não virar lixo acumulado.
  const oficiais = entradas.filter((e) => e.oficial && !e.vinculadaInvestimento && e.valor !== 0);
  const vinculadas = entradas.filter((e) => e.vinculadaInvestimento);
  const extras = entradas.filter((e) => !e.oficial && !e.vinculadaInvestimento && e.valor !== 0);
  const totalOficial = oficiais.reduce((a, e) => a + e.valor, 0);
  const totalExtras = extras.reduce((a, e) => a + e.valor, 0);
  const salario = entradas.find((e) => e.id === "salario")?.valor;

  function iniciarEdicao(e: Entrada) {
    setEditandoId(e.id);
    setRascunho(formatValorInput(e.valor));
  }

  function salvarEdicao(e: Entrada) {
    const valor = parseValor(rascunho);
    const base = baseMap.get(e.id) ?? e.valor;
    if (valor === base) {
      // Volta a ser igual ao base — remove o override pra não sujar o histórico.
      resetMes.mutate({ entradaId: e.id, mes });
    } else {
      setMes.mutate({ entradaId: e.id, mes, valor });
    }
    setEditandoId(null);
  }

  function adicionar(ev: React.FormEvent) {
    ev.preventDefault();
    const nome = novoNome.trim();
    const valor = parseValor(novoValor);
    if (!nome || !valor) return;
    const id = uid();
    const limpar = () => {
      setNovoNome("");
      setNovoValor("");
      setNovoOficial(true);
      setNovoSoEsteMes(true);
      setNovoAberto(false);
    };
    if (novoSoEsteMes) {
      // Cria com base 0 (não repete em outros meses) e grava o valor real só neste mês.
      upsert.mutate(
        { id, nome, valor: 0, oficial: novoOficial },
        { onSuccess: () => setMes.mutate({ entradaId: id, mes, valor }, { onSuccess: limpar }) },
      );
    } else {
      upsert.mutate({ id, nome, valor, oficial: novoOficial }, { onSuccess: limpar });
    }
  }

  const temOverride = (id: string) => {
    const base = baseMap.get(id);
    const atual = entradas.find((e) => e.id === id)?.valor;
    return base !== undefined && atual !== undefined && base !== atual;
  };

  function EntradaItem({ e }: { e: Entrada }) {
    const isEditing = editandoId === e.id;
    const override = temOverride(e.id);
    return (
      <li className="flex items-center gap-3 p-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-medium">{e.nome}</p>
          {e.nota ? <p className="truncate text-xs text-muted-foreground">{e.nota}</p> : null}
          {override && (
            <p className="text-xs text-amber-600">
              Ajustado neste mês · base {brl(baseMap.get(e.id) ?? 0)}
            </p>
          )}
        </div>
        {isEditing ? (
          <>
            <Input
              autoFocus
              inputMode="decimal"
              className="w-28"
              value={rascunho}
              onChange={(ev) => setRascunho(ev.target.value)}
            />
            <button
              aria-label="Salvar"
              className="text-positive hover:opacity-80"
              onClick={() => salvarEdicao(e)}
              disabled={setMes.isPending || resetMes.isPending}
            >
              <Check className="size-4" />
            </button>
            <button
              aria-label="Cancelar"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => setEditandoId(null)}
            >
              <X className="size-4" />
            </button>
          </>
        ) : (
          <>
            <span className="num text-sm font-semibold">{brl(e.valor)}</span>
            {override && (
              <button
                aria-label="Voltar ao valor base"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => resetMes.mutate({ entradaId: e.id, mes })}
                disabled={resetMes.isPending}
              >
                <RotateCcw className="size-3.5" />
              </button>
            )}
            <button
              aria-label="Editar"
              className="text-muted-foreground hover:text-foreground"
              onClick={() => iniciarEdicao(e)}
            >
              <Pencil className="size-4" />
            </button>
            <button
              aria-label="Remover"
              className="text-muted-foreground hover:text-destructive"
              onClick={() => del.mutate(e.id)}
            >
              <Trash2 className="size-4" />
            </button>
          </>
        )}
      </li>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Entradas" subtitle={`${nomeMes(mes)} · quanto entrou nesse mês`} />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
        <Stat label="Salário" value={salario ?? 0} hint="Base do teto de gastos" />
        <Stat label="Entradas oficiais" value={totalOficial} hint="Conta pro teto de gastos" />
        <Stat label="Extras" value={totalExtras} hint="Mesada, bônus — fora do teto oficial" />
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="size-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          <Section
            title="Entradas oficiais"
            description="Contam pro teto de gastos do mês (salário e afins)"
          >
            <ul className="divide-y rounded-xl border bg-card">
              {oficiais.length === 0 && (
                <li className="p-4 text-sm text-muted-foreground">
                  Nenhuma entrada oficial ainda.
                </li>
              )}
              {oficiais.map((e) => (
                <EntradaItem key={e.id} e={e} />
              ))}
            </ul>
          </Section>

          {vinculadas.length > 0 && (
            <Section
              title="Vinculadas a investimentos"
              description="Já entram 100% como aporte em Investimentos — não somam no teto, só ficam aqui de referência"
            >
              <ul className="divide-y rounded-xl border bg-card">
                {vinculadas.map((e) => (
                  <EntradaItem key={e.id} e={e} />
                ))}
              </ul>
            </Section>
          )}

          <Section
            title="Extras"
            description="Mesada, bônus, renda instável — não entram no teto oficial de gastos"
          >
            <ul className="divide-y rounded-xl border bg-card">
              {extras.length === 0 && (
                <li className="p-4 text-sm text-muted-foreground">Nenhum extra cadastrado.</li>
              )}
              {extras.map((e) => (
                <EntradaItem key={e.id} e={e} />
              ))}
            </ul>
          </Section>

          <Section
            title="Nova entrada"
            action={
              <button
                className="flex items-center gap-1 text-xs font-medium text-primary"
                onClick={() => setNovoAberto((v) => !v)}
              >
                <Plus className="size-3.5" /> {novoAberto ? "Fechar" : "Adicionar"}
              </button>
            }
          >
            {novoAberto && (
              <form onSubmit={adicionar} className="space-y-3 rounded-xl border bg-card p-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="e-nome">Nome</Label>
                    <Input
                      id="e-nome"
                      placeholder="ex: Freela, 13º"
                      value={novoNome}
                      onChange={(e) => setNovoNome(e.target.value)}
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="e-valor">Valor</Label>
                    <Input
                      id="e-valor"
                      inputMode="decimal"
                      placeholder="0,00"
                      value={novoValor}
                      onChange={(e) => setNovoValor(e.target.value)}
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Tipo</Label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setNovoOficial(true)}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                        novoOficial
                          ? "border-primary bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Oficial · entra no teto
                    </button>
                    <button
                      type="button"
                      onClick={() => setNovoOficial(false)}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                        !novoOficial
                          ? "border-primary bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Extra · fora do teto
                    </button>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label>Vigência</Label>
                  <div className="flex gap-1.5">
                    <button
                      type="button"
                      onClick={() => setNovoSoEsteMes(true)}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                        novoSoEsteMes
                          ? "border-primary bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Só em {nomeMes(mes)}
                    </button>
                    <button
                      type="button"
                      onClick={() => setNovoSoEsteMes(false)}
                      className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                        !novoSoEsteMes
                          ? "border-primary bg-primary text-primary-foreground"
                          : "bg-secondary text-muted-foreground hover:text-foreground"
                      }`}
                    >
                      Todo mês
                    </button>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {novoSoEsteMes
                      ? "Ex: um pix avulso — conta só neste mês, some depois."
                      : "Vira uma entrada fixa, repete todo mês até você editar ou apagar."}
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={upsert.isPending}>
                  {upsert.isPending ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    "Salvar entrada"
                  )}
                </Button>
              </form>
            )}
          </Section>
        </>
      )}
    </div>
  );
}
