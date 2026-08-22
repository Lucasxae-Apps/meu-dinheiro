import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2, Loader2, Plus, Pencil, Check, X } from "lucide-react";
import { PageHeader, Section } from "@/components/fin";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { brl, nomeMes, parseValor, formatValorInput } from "@/lib/finance";
import { useMes } from "@/lib/mes-context";
import {
  useContasFixas,
  useTogglePago,
  useUpdatePagoEm,
  useDespesasIrregulares,
  useAddDespesaIrregular,
  useDeleteDespesaIrregular,
  useAssinaturas,
  useAddAssinatura,
  useUpdateAssinatura,
  useDeleteAssinatura,
} from "@/lib/hooks";
import type { Assinatura } from "@/lib/hooks";

export const Route = createFileRoute("/contas")({
  head: () => ({
    meta: [
      { title: "Contas fixas — Controle financeiro pessoal" },
      {
        name: "description",
        content:
          "IPVA, seguro, inglês, academia, assinaturas e gasolina com status de pago, data e despesas irregulares.",
      },
      { property: "og:title", content: "Contas fixas — Controle financeiro pessoal" },
      {
        property: "og:description",
        content: "Marque o que já foi pago no mês e anote despesas irregulares cobertas pela renda fixa.",
      },
    ],
  }),
  component: Contas,
});

function Contas() {
  const { mes } = useMes();
  const { data: contas = [], isLoading: loadingContas } = useContasFixas(mes);
  const { data: irregulares = [], isLoading: loadingIrreg } = useDespesasIrregulares();
  const { data: assinaturas = [], isLoading: loadingAss } = useAssinaturas();

  const togglePago = useTogglePago(mes);
  const updatePagoEm = useUpdatePagoEm(mes);
  const addIrregular = useAddDespesaIrregular();
  const deleteIrregular = useDeleteDespesaIrregular();
  const addAssinatura = useAddAssinatura();
  const updateAssinatura = useUpdateAssinatura();
  const deleteAssinatura = useDeleteAssinatura();

  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");

  // Assinaturas form
  const [showAssForm, setShowAssForm] = useState(false);
  const [assNome, setAssNome] = useState("");
  const [assValor, setAssValor] = useState("");
  const [assDia, setAssDia] = useState("1");
  const [editandoAss, setEditandoAss] = useState<string | null>(null);
  const [rascunhoAss, setRascunhoAss] = useState<Assinatura | null>(null);

  const totalAssinaturas = assinaturas.filter((a) => a.ativa).reduce((a, s) => a + s.valor, 0);

  // Sobrescreve o valor da conta "Assinaturas" com a soma real das assinaturas cadastradas
  const contasComAssinaturas = contas.map((c) =>
    c.id === "assinaturas" ? { ...c, valor: totalAssinaturas } : c,
  );

  const totalContas = contasComAssinaturas.reduce((a, c) => a + c.valor, 0);
  const pago = contasComAssinaturas.filter((c) => c.pago).reduce((a, c) => a + c.valor, 0);

  function adicionarAssinatura(e: React.FormEvent) {
    e.preventDefault();
    const v = parseValor(assValor);
    const d = Number(assDia);
    if (!assNome.trim() || !v || d < 1 || d > 31) return;
    addAssinatura.mutate({
      nome: assNome.trim(),
      valor: v,
      diaCobranca: d,
      ativa: true,
    });
    setAssNome("");
    setAssValor("");
    setAssDia("1");
    setShowAssForm(false);
  }

  function salvarEdicaoAss() {
    if (!rascunhoAss) return;
    updateAssinatura.mutate(rascunhoAss);
    setEditandoAss(null);
    setRascunhoAss(null);
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Contas fixas" subtitle={`${nomeMes(mes)} · ${brl(pago)} de ${brl(totalContas)} pagos`} />

      <Section title="Do mês" description="Marque conforme for pagando">
        {loadingContas ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {contasComAssinaturas.map((c) => (
              <li key={c.id} className="space-y-2 p-3">
                <div className="flex items-center gap-3">
                  <Checkbox
                    id={c.id}
                    checked={c.pago}
                    onCheckedChange={(v) =>
                      togglePago.mutate({
                        contaId: c.id,
                        pago: Boolean(v),
                        pagoEm: new Date().toISOString().slice(0, 10),
                      })
                    }
                  />
                  <div className="min-w-0 flex-1">
                    <Label htmlFor={c.id} className="text-sm font-medium">
                      {c.nome}
                    </Label>
                    {c.nota ? <p className="text-xs text-muted-foreground">{c.nota}</p> : null}
                  </div>
                  <span className={`num text-sm font-semibold ${c.pago ? "text-muted-foreground line-through" : ""}`}>
                    {brl(c.valor)}
                  </span>
                </div>
                {c.pago && (
                  <Input
                    type="date"
                    className="h-9"
                    value={c.pagoEm ?? ""}
                    onChange={(e) =>
                      updatePagoEm.mutate({ contaId: c.id, pagoEm: e.target.value })
                    }
                  />
                )}
              </li>
            ))}
          </ul>
        )}
      </Section>

      {/* Assinaturas */}
      <Section
        title="Assinaturas"
        description={`${assinaturas.filter((a) => a.ativa).length} ativas · total ${brl(totalAssinaturas)}/mês`}
        action={
          <button
            onClick={() => setShowAssForm(!showAssForm)}
            className="flex items-center gap-1 text-xs font-medium text-primary"
          >
            <Plus className="size-3.5" />
            Adicionar
          </button>
        }
      >
        {showAssForm && (
          <form onSubmit={adicionarAssinatura} className="space-y-3 rounded-xl border bg-card p-4">
            <div className="space-y-1.5">
              <Label htmlFor="ass-nome">Nome</Label>
              <Input
                id="ass-nome"
                placeholder="ex: Netflix, Spotify, iCloud"
                value={assNome}
                onChange={(e) => setAssNome(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="ass-valor">Valor</Label>
                <Input
                  id="ass-valor"
                  inputMode="decimal"
                  placeholder="0,00"
                  value={assValor}
                  onChange={(e) => setAssValor(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="ass-dia">Dia da cobrança</Label>
                <Input
                  id="ass-dia"
                  type="number"
                  min={1}
                  max={31}
                  value={assDia}
                  onChange={(e) => setAssDia(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={addAssinatura.isPending}>
                {addAssinatura.isPending ? <Loader2 className="size-4 animate-spin" /> : "Salvar"}
              </Button>
              <Button type="button" variant="ghost" onClick={() => setShowAssForm(false)}>
                Cancelar
              </Button>
            </div>
          </form>
        )}

        {loadingAss ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {assinaturas.length === 0 && (
              <li className="p-4 text-sm text-muted-foreground">Nenhuma assinatura cadastrada.</li>
            )}
            {assinaturas.map((a) =>
              editandoAss === a.id && rascunhoAss ? (
                <li key={a.id} className="space-y-2 p-3">
                  <Input
                    value={rascunhoAss.nome}
                    onChange={(e) => setRascunhoAss({ ...rascunhoAss, nome: e.target.value })}
                    placeholder="Nome"
                  />
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      inputMode="decimal"
                      value={String(rascunhoAss.valor).replace(".", ",")}
                      onChange={(e) =>
                        setRascunhoAss({
                          ...rascunhoAss,
                          valor: parseValor(e.target.value),
                        })
                      }
                      placeholder="Valor"
                    />
                    <Input
                      type="number"
                      min={1}
                      max={31}
                      value={String(rascunhoAss.diaCobranca)}
                      onChange={(e) =>
                        setRascunhoAss({
                          ...rascunhoAss,
                          diaCobranca: Number(e.target.value) || 1,
                        })
                      }
                      placeholder="Dia"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={salvarEdicaoAss} disabled={updateAssinatura.isPending}>
                      <Check className="size-4" /> Salvar
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => {
                        setEditandoAss(null);
                        setRascunhoAss(null);
                      }}
                    >
                      <X className="size-4" /> Cancelar
                    </Button>
                  </div>
                </li>
              ) : (
                <li
                  key={a.id}
                  className={`flex items-center gap-3 p-3 ${!a.ativa ? "opacity-50" : ""}`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{a.nome}</p>
                    <p className="text-xs text-muted-foreground">
                      Dia {a.diaCobranca}
                      {a.nota ? ` · ${a.nota}` : ""}
                    </p>
                  </div>
                  <span className="num text-sm font-semibold">{brl(a.valor)}</span>
                  <button
                    aria-label="Editar"
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => {
                      setEditandoAss(a.id);
                      setRascunhoAss(a);
                    }}
                  >
                    <Pencil className="size-4" />
                  </button>
                  <button
                    aria-label="Remover"
                    className="text-muted-foreground hover:text-destructive"
                    onClick={() => deleteAssinatura.mutate(a.id)}
                  >
                    <Trash2 className="size-4" />
                  </button>
                </li>
              ),
            )}
          </ul>
        )}
      </Section>

      <Section
        title="Despesas irregulares"
        description="Sem linha mensal fixa — saem da renda fixa quando aparecem"
      >
        <form
          className="grid grid-cols-[1fr_auto] gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            if (!descricao.trim()) return;
            addIrregular.mutate({
              descricao: descricao.trim(),
              valor: valor ? parseValor(valor) : undefined,
              data: new Date().toISOString().slice(0, 10),
            });
            setDescricao("");
            setValor("");
          }}
        >
          <Input
            placeholder="ex: revisão do carro"
            value={descricao}
            onChange={(e) => setDescricao(e.target.value)}
          />
          <Input
            className="w-24"
            inputMode="decimal"
            placeholder="valor"
            value={valor}
            onChange={(e) => setValor(e.target.value)}
          />
          <Button type="submit" className="col-span-2" disabled={addIrregular.isPending}>
            {addIrregular.isPending ? <Loader2 className="size-4 animate-spin" /> : "Anotar"}
          </Button>
        </form>

        {loadingIrreg ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="size-5 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <ul className="divide-y rounded-xl border bg-card">
            {irregulares.length === 0 && (
              <li className="p-4 text-sm text-muted-foreground">Nada anotado.</li>
            )}
            {irregulares.map((d) => (
              <li key={d.id} className="flex items-center gap-3 p-3">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{d.descricao}</p>
                  <p className="text-xs text-muted-foreground">
                    {d.data ? d.data.split("-").reverse().join("/") : "sem data"}
                    {d.nota ? ` · ${d.nota}` : ""}
                  </p>
                </div>
                {d.valor ? <span className="num text-sm font-semibold">{brl(d.valor)}</span> : null}
                <button
                  aria-label="Remover"
                  className="text-muted-foreground hover:text-destructive"
                  onClick={() => deleteIrregular.mutate(d.id)}
                >
                  <Trash2 className="size-4" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>
    </div>
  );
}
