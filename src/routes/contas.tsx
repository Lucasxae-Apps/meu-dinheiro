import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { PageHeader, Section } from "@/components/fin";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { brl, mesAtual, nomeMes, totais, uid, useFinance } from "@/lib/finance";

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
  component: Contas;
});

function Contas() {
  const { state, update } = useFinance();
  const t = totais(state);
  const [descricao, setDescricao] = useState("");
  const [valor, setValor] = useState("");

  const pago = state.contas.filter((c) => c.pago).reduce((a, c) => a + c.valor, 0);

  return (
    <div className="space-y-8">
      <PageHeader title="Contas fixas" subtitle={`${nomeMes(mesAtual())} · ${brl(pago)} de ${brl(t.contas)} pagos`} />

      <Section title="Do mês" description="Marque conforme for pagando">
        <ul className="divide-y rounded-xl border bg-card">
          {state.contas.map((c) => (
            <li key={c.id} className="space-y-2 p-3">
              <div className="flex items-center gap-3">
                <Checkbox
                  id={c.id}
                  checked={c.pago}
                  onCheckedChange={(v) =>
                    update((s) => ({
                      ...s,
                      contas: s.contas.map((x) =>
                        x.id === c.id
                          ? {
                              ...x,
                              pago: Boolean(v),
                              pagoEm: v ? (x.pagoEm ?? new Date().toISOString().slice(0, 10)) : undefined,
                            }
                          : x,
                      ),
                    }))
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
                    update((s) => ({
                      ...s,
                      contas: s.contas.map((x) => (x.id === c.id ? { ...x, pagoEm: e.target.value } : x)),
                    }))
                  }
                />
              )}
            </li>
          ))}
        </ul>
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
            update((s) => ({
              ...s,
              irregulares: [
                ...s.irregulares,
                {
                  id: uid(),
                  descricao: descricao.trim(),
                  valor: valor ? Number(valor.replace(",", ".")) : undefined,
                  data: new Date().toISOString().slice(0, 10),
                },
              ],
            }));
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
          <Button type="submit" className="col-span-2">
            Anotar
          </Button>
        </form>

        <ul className="divide-y rounded-xl border bg-card">
          {state.irregulares.length === 0 && (
            <li className="p-4 text-sm text-muted-foreground">Nada anotado.</li>
          )}
          {state.irregulares.map((d) => (
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
                onClick={() =>
                  update((s) => ({ ...s, irregulares: s.irregulares.filter((x) => x.id !== d.id) }))
                }
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      </Section>
    </div>
  );
}
