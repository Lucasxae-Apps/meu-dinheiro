import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Trash2, Pencil, Check, X, Loader2, CreditCard, Plus } from "lucide-react";
import { PageHeader, Section, Stat } from "@/components/fin";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  brl,
  faturaPorCartao,
  nomeMes,
  uid,
  parseValor,
  type Cartao,
  type Lancamento,
  type MeioPagamento,
} from "@/lib/finance";
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
  useConfiguracoes,
  useCartoes,
  useUpsertCartao,
  useDeleteCartao,
} from "@/lib/hooks";

export const Route = createFileRoute("/lancamentos")({
  head: () => ({
    meta: [
      { title: "Lançamentos — Controle financeiro pessoal" },
      {
        name: "description",
        content:
          "Registro rápido de gastos do mês com categoria livre, filtro por mês e por categoria.",
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

const MEIOS_PAGAMENTO: { value: MeioPagamento; label: string }[] = [
  { value: "debito", label: "Débito" },
  { value: "credito", label: "Crédito" },
  { value: "pix", label: "Pix" },
  { value: "dinheiro", label: "Dinheiro" },
];

function Lancamentos() {
  const { mes } = useMes();
  const { data: lancamentos = [], isLoading } = useLancamentos(mes);
  const { data: entradas = [] } = useEntradas(mes);
  const { data: investimentos = [] } = useInvestimentos(mes);
  const { data: contas = [] } = useContasFixas(mes);
  const { data: assinaturas = [] } = useAssinaturas();
  const { data: config } = useConfiguracoes();
  const { data: cartoes = [] } = useCartoes();

  const cartoesAtivos = cartoes.filter((c) => c.ativo);

  const addMutation = useAddLancamento(mes);
  const updateMutation = useUpdateLancamento(mes);
  const deleteMutation = useDeleteLancamento(mes);

  const [data, setData] = useState(hoje);
  const [categoria, setCategoria] = useState("");
  const [valor, setValor] = useState("");
  const [nota, setNota] = useState("");
  const [meioPagamento, setMeioPagamento] = useState<MeioPagamento>("debito");
  const [mesRefFatura, setMesRefFatura] = useState(mes); // mês da fatura (editável)
  const [cartaoId, setCartaoId] = useState<string>("");
  const [filtroCat, setFiltroCat] = useState("");
  const [editando, setEditando] = useState<string | null>(null);
  const [rascunho, setRascunho] = useState<Lancamento | null>(null);

  // Cálculos derivados
  const totalAssinaturas = assinaturas.filter((a) => a.ativa).reduce((a, s) => a + s.valor, 0);
  const entradasOficiais = entradas
    .filter((e) => e.oficial && !e.vinculadaInvestimento)
    .reduce((a, e) => a + e.valor, 0);
  const totalContas = contas.reduce(
    (a, c) => (c.id === "assinaturas" ? a + totalAssinaturas : a + (c.valorReal ?? c.valor)),
    0,
  );
  // Livre = entradas oficiais do mês (salário + extras oficiais, tipo um pix
  // avulso lançado só nesse mês) menos o que sai pro salário (30% + viagem) e
  // contas fixas. Aluguel/dividendos reinvestidos não contam — pass-through.
  const aporteSalario = investimentos
    .filter((i) => i.origemSalario !== false)
    .reduce((a, i) => a + i.aporteMensal, 0);
  const livre = entradasOficiais - aporteSalario - totalContas;

  const ehHobby = (l: Lancamento) => l.categoria.trim().toLowerCase() === HOBBY_CATEGORIA;
  const gastoSemHobby = lancamentos.filter((l) => !ehHobby(l)).reduce((a, l) => a + l.valor, 0);
  const gastoHobby = lancamentos.filter(ehHobby).reduce((a, l) => a + l.valor, 0);
  const gastoTotal = gastoSemHobby + gastoHobby;
  // A sobra do mês considera TODO gasto (incl. hobby) — é dinheiro que saiu de verdade.
  const restante = livre - gastoTotal;
  const usadoPct = livre > 0 ? Math.round((gastoTotal / livre) * 100) : 0;

  // Faturas por cartão
  const faturas = useMemo(() => faturaPorCartao(lancamentos), [lancamentos]);
  const totalCredito = Array.from(faturas.values()).reduce((a, v) => a + v, 0);

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
        .filter((l) =>
          filtroCat ? l.categoria.toLowerCase().includes(filtroCat.toLowerCase()) : true,
        )
        .sort((a, b) => b.data.localeCompare(a.data)),
    [lancamentos, filtroCat],
  );

  const totalFiltrado = lista.reduce((a, l) => a + l.valor, 0);

  const nomeCartao = (id?: string) => cartoes.find((c) => c.id === id)?.nome;
  const corCartao = (id?: string) => cartoes.find((c) => c.id === id)?.cor ?? "#6366f1";

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
      meioPagamento,
      mesReferenciaFatura: meioPagamento === "credito" ? mesRefFatura : undefined,
      cartaoId: meioPagamento === "credito" && cartaoId ? cartaoId : undefined,
    });
    setValor("");
    setNota("");
  }

  function salvarEdicao() {
    if (!rascunho) return;
    const ehCredito = rascunho.meioPagamento === "credito";
    updateMutation.mutate({
      ...rascunho,
      mesReferenciaFatura: ehCredito ? rascunho.mesReferenciaFatura : undefined,
      cartaoId: ehCredito ? rascunho.cartaoId : undefined,
    });
    setEditando(null);
    setRascunho(null);
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Lançamentos" subtitle="O que substitui a planilha" />

      {/* Big numbers do mês */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Stat
          label="Já gasto"
          value={gastoTotal}
          hint={`${usadoPct}% do teto · hobby incluso`}
          tone={gastoTotal > livre ? "destructive" : "default"}
        />
        <Stat
          label="Quanto falta"
          value={restante}
          tone={restante < 0 ? "destructive" : "positive"}
          hint={`de ${brl(livre)} livres`}
        />
        <Stat
          label="No crédito"
          value={totalCredito}
          hint={`${faturas.size} cartão(ões) com fatura`}
        />
        <Stat
          label="Hobby (cards F1)"
          value={gastoHobby}
          hint={`${lancamentos.length} lançamento(s) no mês`}
          tone="muted"
        />
      </div>

      <div className="grid gap-8 xl:grid-cols-[380px_1fr]">
        <form
          onSubmit={adicionar}
          className="space-y-3 rounded-xl border bg-card p-4 xl:sticky xl:top-8 xl:self-start"
        >
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

          {/* Meio de pagamento */}
          <div className="space-y-1.5">
            <Label>Meio de pagamento</Label>
            <div className="flex flex-wrap gap-1.5">
              {MEIOS_PAGAMENTO.map((m) => (
                <button
                  key={m.value}
                  type="button"
                  onClick={() => setMeioPagamento(m.value)}
                  className={`rounded-full border px-3 py-1 text-xs transition-colors ${
                    meioPagamento === m.value
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-secondary text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {m.label}
                </button>
              ))}
            </div>
            {meioPagamento === "credito" && (
              <div className="mt-2 space-y-2.5">
                {/* Escolha de cartão */}
                <div className="space-y-1.5">
                  <Label>Qual cartão?</Label>
                  {cartoesAtivos.length === 0 ? (
                    <p className="text-xs text-muted-foreground">
                      Nenhum cartão cadastrado — cadastre abaixo na lista de cartões.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-1.5">
                      {cartoesAtivos.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => setCartaoId(cartaoId === c.id ? "" : c.id)}
                          className={`flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs transition-colors ${
                            cartaoId === c.id
                              ? "border-primary bg-primary/10 text-foreground"
                              : "bg-secondary text-muted-foreground hover:text-foreground"
                          }`}
                        >
                          <span
                            className="size-2 rounded-full"
                            style={{ backgroundColor: c.cor }}
                          />
                          {c.nome}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="mesRefFatura">Fatura de qual mês?</Label>
                  <Input
                    id="mesRefFatura"
                    type="month"
                    value={mesRefFatura}
                    onChange={(e) => setMesRefFatura(e.target.value)}
                  />
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <CreditCard className="size-3" />
                    Esse gasto vai impactar o orçamento de{" "}
                    <span className="font-medium">{nomeMes(mesRefFatura)}</span>
                  </p>
                </div>
              </div>
            )}
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
            {addMutation.isPending ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              "Adicionar gasto"
            )}
          </Button>
        </form>

        <div className="space-y-8">
          {/* Faturas por cartão */}
          {faturas.size > 0 && (
            <Section
              title="Faturas do mês"
              description={`${brl(totalCredito)} no crédito em ${nomeMes(mes)}`}
            >
              <div className="grid gap-3 sm:grid-cols-2">
                {cartoes
                  .filter((c) => (faturas.get(c.id) ?? 0) > 0)
                  .map((c) => {
                    const total = faturas.get(c.id) ?? 0;
                    const pctLimite = c.limite && c.limite > 0 ? (total / c.limite) * 100 : null;
                    return (
                      <div key={c.id} className="rounded-xl border bg-card p-4">
                        <div className="flex items-center gap-2">
                          <span
                            className="size-3 rounded-full"
                            style={{ backgroundColor: c.cor }}
                          />
                          <span className="text-sm font-semibold">{c.nome}</span>
                          {c.bandeira && (
                            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                              {c.bandeira}
                            </span>
                          )}
                        </div>
                        <p className="num mt-2 text-2xl font-semibold">{brl(total)}</p>
                        {pctLimite !== null && (
                          <>
                            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-secondary">
                              <div
                                className="h-full rounded-full transition-all"
                                style={{
                                  width: `${Math.min(pctLimite, 100)}%`,
                                  backgroundColor: pctLimite > 90 ? "#ef4444" : c.cor,
                                }}
                              />
                            </div>
                            <p className="num mt-1 text-[10px] text-muted-foreground">
                              {pctLimite.toFixed(0)}% do limite de {brl(c.limite!)}
                            </p>
                          </>
                        )}
                      </div>
                    );
                  })}
              </div>
            </Section>
          )}

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
              <ul className="mt-3 divide-y rounded-xl border bg-card xl:max-h-[calc(100vh-320px)] xl:overflow-y-auto">
                {lista.length === 0 && (
                  <li className="p-4 text-sm text-muted-foreground">
                    Nenhum lançamento nesse recorte.
                  </li>
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
                      {/* Meio de pagamento na edição */}
                      <div className="flex flex-wrap gap-1.5">
                        {MEIOS_PAGAMENTO.map((m) => (
                          <button
                            key={m.value}
                            type="button"
                            onClick={() => setRascunho({ ...rascunho, meioPagamento: m.value })}
                            className={`rounded-full border px-2.5 py-1 text-xs transition-colors ${
                              rascunho.meioPagamento === m.value
                                ? "border-primary bg-primary text-primary-foreground"
                                : "bg-secondary text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {m.label}
                          </button>
                        ))}
                      </div>
                      {rascunho.meioPagamento === "credito" && (
                        <>
                          {cartoesAtivos.length > 0 && (
                            <div className="flex flex-wrap gap-1.5">
                              {cartoesAtivos.map((c) => (
                                <button
                                  key={c.id}
                                  type="button"
                                  onClick={() =>
                                    setRascunho({
                                      ...rascunho,
                                      cartaoId: rascunho.cartaoId === c.id ? undefined : c.id,
                                    })
                                  }
                                  className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors ${
                                    rascunho.cartaoId === c.id
                                      ? "border-primary bg-primary/10 text-foreground"
                                      : "bg-secondary text-muted-foreground hover:text-foreground"
                                  }`}
                                >
                                  <span
                                    className="size-2 rounded-full"
                                    style={{ backgroundColor: c.cor }}
                                  />
                                  {c.nome}
                                </button>
                              ))}
                            </div>
                          )}
                          <Input
                            type="month"
                            value={rascunho.mesReferenciaFatura ?? mes}
                            onChange={(e) =>
                              setRascunho({ ...rascunho, mesReferenciaFatura: e.target.value })
                            }
                          />
                        </>
                      )}
                      <Input
                        placeholder="Nota"
                        value={rascunho.nota ?? ""}
                        onChange={(e) => setRascunho({ ...rascunho, nota: e.target.value })}
                      />
                      <div className="flex gap-2">
                        <Button
                          size="sm"
                          onClick={salvarEdicao}
                          disabled={updateMutation.isPending}
                        >
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
                        <p className="truncate text-sm font-medium">
                          {l.categoria}
                          {l.meioPagamento === "credito" && (
                            <CreditCard className="ml-1 inline size-3 text-muted-foreground" />
                          )}
                        </p>
                        <p className="num text-xs text-muted-foreground">
                          {l.data.split("-").reverse().join("/")}
                          {l.meioPagamento === "credito" &&
                            l.cartaoId &&
                            nomeCartao(l.cartaoId) && (
                              <span className="ml-1 inline-flex items-center gap-1">
                                ·
                                <span
                                  className="inline-block size-1.5 rounded-full"
                                  style={{ backgroundColor: corCartao(l.cartaoId) }}
                                />
                                {nomeCartao(l.cartaoId)}
                              </span>
                            )}
                          {l.meioPagamento === "credito" &&
                            l.mesReferenciaFatura &&
                            l.mesReferenciaFatura !== l.data.slice(0, 7) && (
                              <span className="ml-1 text-amber-600">
                                · fatura de {nomeMes(l.mesReferenciaFatura)}
                              </span>
                            )}
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

          {/* Gestão de cartões */}
          <CartoesManager cartoes={cartoes} />
        </div>
      </div>
      {/* end grid xl:grid-cols-[380px_1fr] */}
    </div>
  );
}

// ── Gestão de cartões ──

function CartoesManager({ cartoes }: { cartoes: Cartao[] }) {
  const upsert = useUpsertCartao();
  const del = useDeleteCartao();
  const [aberto, setAberto] = useState(false);
  const [nome, setNome] = useState("");
  const [bandeira, setBandeira] = useState("");
  const [cor, setCor] = useState("#6366f1");
  const [limite, setLimite] = useState("");
  const [fechamento, setFechamento] = useState("");
  const [vencimento, setVencimento] = useState("");

  function salvar(e: React.FormEvent) {
    e.preventDefault();
    if (!nome.trim()) return;
    upsert.mutate(
      {
        nome: nome.trim(),
        bandeira: bandeira.trim() || undefined,
        cor,
        limite: limite ? parseValor(limite) : undefined,
        diaFechamento: fechamento ? Number(fechamento) : undefined,
        diaVencimento: vencimento ? Number(vencimento) : undefined,
        ativo: true,
      },
      {
        onSuccess: () => {
          setNome("");
          setBandeira("");
          setLimite("");
          setFechamento("");
          setVencimento("");
          setAberto(false);
        },
      },
    );
  }

  return (
    <Section
      title="Meus cartões"
      description={`${cartoes.length} cadastrado(s)`}
      action={
        <button
          className="flex items-center gap-1 text-xs font-medium text-primary"
          onClick={() => setAberto((v) => !v)}
        >
          <Plus className="size-3.5" /> {aberto ? "Fechar" : "Novo cartão"}
        </button>
      }
    >
      {aberto && (
        <form onSubmit={salvar} className="mb-3 space-y-3 rounded-xl border bg-card p-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-nome">Nome</Label>
              <Input
                id="c-nome"
                placeholder="ex: Nubank"
                value={nome}
                onChange={(e) => setNome(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-bandeira">Bandeira</Label>
              <Input
                id="c-bandeira"
                placeholder="ex: Mastercard"
                value={bandeira}
                onChange={(e) => setBandeira(e.target.value)}
              />
            </div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="c-limite">Limite</Label>
              <Input
                id="c-limite"
                inputMode="decimal"
                placeholder="0,00"
                value={limite}
                onChange={(e) => setLimite(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-fech">Fechamento</Label>
              <Input
                id="c-fech"
                inputMode="numeric"
                placeholder="dia"
                value={fechamento}
                onChange={(e) => setFechamento(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="c-venc">Vencimento</Label>
              <Input
                id="c-venc"
                inputMode="numeric"
                placeholder="dia"
                value={vencimento}
                onChange={(e) => setVencimento(e.target.value)}
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="c-cor" className="text-xs">
              Cor
            </Label>
            <input
              id="c-cor"
              type="color"
              value={cor}
              onChange={(e) => setCor(e.target.value)}
              className="h-8 w-12 cursor-pointer rounded border bg-transparent"
            />
            <Button type="submit" size="sm" className="ml-auto" disabled={upsert.isPending}>
              {upsert.isPending ? <Loader2 className="size-4 animate-spin" /> : "Salvar cartão"}
            </Button>
          </div>
        </form>
      )}
      {cartoes.length === 0 ? (
        <p className="rounded-xl border bg-card/50 p-4 text-sm text-muted-foreground">
          Nenhum cartão cadastrado ainda.
        </p>
      ) : (
        <ul className="divide-y rounded-xl border bg-card">
          {cartoes.map((c) => (
            <li key={c.id} className="flex items-center gap-3 p-3">
              <span className="size-3 shrink-0 rounded-full" style={{ backgroundColor: c.cor }} />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{c.nome}</p>
                <p className="text-xs text-muted-foreground">
                  {c.bandeira ? `${c.bandeira} · ` : ""}
                  {c.limite ? `limite ${brl(c.limite)}` : "sem limite definido"}
                  {c.diaFechamento ? ` · fecha dia ${c.diaFechamento}` : ""}
                </p>
              </div>
              <button
                aria-label="Remover cartão"
                className="text-muted-foreground hover:text-destructive"
                onClick={() => del.mutate(c.id)}
              >
                <Trash2 className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </Section>
  );
}
