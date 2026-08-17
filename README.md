# Meu Dinheiro

CONTEXTO

Sou desenvolvedor, 21 anos, ainda cursando faculdade. Quero um app pessoal (MVP,

web, mobile-first) pra substituir uma planilha manual de controle financeiro.

Uso sozinho — sem login complexo ou múltiplos usuários por enquanto.

MEU PERFIL FINANCEIRO (dados reais pra povoar o MVP como seed data)

Entradas mensais:

- Salário: R$ 4.768,21

- Aluguel de imóvel: R$ 1.500,00 (obs: imóvel é metade meu, metade do meu

  irmão — só uma nota no cadastro, não precisa de sistema multiusuário)

- Dividendos (reinvestidos automaticamente): ~R$ 50,00

- Mesada: R$ 500,00 — NÃO entra no total de entradas nem em nenhum cálculo

  oficial. É renda instável que pretendo perder em algum momento, então trato

  como bônus à parte, nunca como base do orçamento.

Investimentos/metas mensais:

- Reserva de emergência (Inter): R$ 900,00/mês, sem valor-alvo definido

- Meta Itália (Nubank): R$ 1.000,00/mês — meta de viagem, tem prazo/valor-alvo

  a definir. Quando a viagem acontecer, esse R$1.000 muda de destino e passa

  a virar aporte extra de investimento.

- Aluguel → renda fixa: R$ 1.500,00/mês (100% do aluguel é investido, nunca

  gasto)

- Dividendos reinvestidos: ~R$ 50,00/mês

- Rendimento médio da carteira: ~1,2% ao mês (parte rende 112% do CDI, parte

  100% do CDI)

- Total já investido hoje: ~R$ 17.000–18.000 (dos quais ~R$6.000 vieram do

  aluguel acumulado)

- Meta grande: R$ 100.000 investidos (fora o valor do apartamento e fora o

  aluguel) antes de comprar um segundo imóvel e um carro

Contas fixas mensais:

- IPVA: R$ 116,00

- Seguro: R$ 305,55

- Inglês: R$ 360,00

- Academia: R$ 137,50

- Assinaturas: R$ 160,50

- Gasolina: R$ 500,00 (gasto real fica perto de R$400, mas deixo R$500

  reservado como buffer pros meses que gasto mais)

Livre pra gastar (o que sobra pra gasto variável do mês):

- Teto mensal: R$ 1.288,66 (= entradas sem mesada − investimentos − contas

  fixas)

- Não quero esse valor dividido em subcategorias fixas/travadas (tipo

  "roupa: R$X", "lazer: R$Y") — prefiro um teto único e flexível

- Dentro dele, tenho uma referência mental de ~R$300/mês pro meu hobby

  (colecionar cards de F1 Topps) — não é um limite rígido, é só algo que

  quero visualizar separado do resto pra não achar que "gastei tudo à toa"

- Despesas irregulares (ex: revisão do carro) não têm linha mensal fixa —

  saem da renda fixa quando aparecem. Quero isso visível como categoria,

  mesmo sem valor mensal fixo, pra não ficar invisível no controle.

- Nutricionista (R$172/mês) e o próprio hobby, quando cobertos, saem da

  mesada — ou seja, ficam fora do orçamento "oficial" também.

ESTRUTURA DO APP — 4 ABAS

1) Visão geral (tela inicial)

   - Cards no topo: entradas do mês, total já comprometido (investimentos +

     contas fixas), livre pra gastar (teto) e quanto já foi gasto dele até

     agora

   - Barra de progresso simples mostrando "quanto ainda resta" do livre pra

     gastar no mês corrente

   - Bloco de investimentos acumulados: total geral investido + progresso em

     direção aos R$100.000 (com opção de incluir ou não o valor do aluguel

     nesse cálculo — os dois jeitos de contar fazem sentido pra mim)

   - Nada de gráfico de pizza — prefiro números diretos e uma ou duas barras

     de progresso

2) Lançamentos

   - Formulário rápido pra adicionar gasto: data, categoria (campo de texto

     livre ou tag simples, sem lista travada), valor, nota opcional

   - Lista cronológica dos lançamentos do mês, editável/removível

   - Filtro simples por mês e por categoria (pra eu conseguir ver, por

     exemplo, quanto gastei com o hobby quando eu quiser, mesmo sem limite

     travado)

   - Essa é a aba que substitui a planilha — precisa ser rápida de usar no

     celular

3) Investimentos e metas

   - Uma linha/card por item: Reserva de emergência, Meta Itália, Aluguel

     (renda fixa), Dividendos, e a Meta 100k

   - Cada um mostra: aporte mensal planejado, valor acumulado até hoje, e

     barra de progresso quando houver valor-alvo (Meta Itália e Meta 100k)

   - Campo pra taxa de rendimento mensal (hoje ~1,2%), usado só pra projetar

     quanto tempo falta pra bater a Meta 100k, considerando o acumulado indo

     pra ela

4) Contas fixas

   - Lista das contas com valor planejado, checkbox de "pago" e campo de

     data de pagamento (igual ao que eu já uso hoje: IPVA, Seguro, Inglês,

     Academia, Assinaturas, Gasolina)

   - Espaço separado (lista simples, sem valor mensal fixo) pra anotar

     despesas irregulares cobertas pela renda fixa, tipo revisão do carro

REGRAS DE CÁLCULO

- Total entradas (oficial) = salário + aluguel + dividendos (mesada NUNCA

  entra nesse total)

- Livre pra gastar = total entradas − total investimentos − total contas

  fixas

- Quanto resta no mês = livre pra gastar − soma dos lançamentos do mês

  corrente

- Progresso Meta 100k = acumulado total investido (com toggle pra incluir

  ou excluir o valor vindo do aluguel) / 100.000

ESTILO

- Direto, limpo, sem gamificação, sem emoji em excesso na interface

- Mobile-first, já que vou lançar gasto no dia a dia pelo celular

- Suporte a modo escuro

- Tom da copy: nem meio "app corporativo de banco", nem infantilizado —

  como se eu mesmo tivesse organizado

FORA DE ESCOPO NESSA V1 (não construir agora)

- Login/múltiplos usuários

- Integração bancária automática (Open Finance, etc)

- Categorização automática por IA

- Relatórios anuais ou exportação

- Notificações/lembretes

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/fb1de4fa-9acd-4c9f-a3ae-591bcaaf0667).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
