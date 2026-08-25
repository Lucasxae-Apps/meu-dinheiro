-- Migration 006: Hobby — colecionáveis (cards F1 e futuras categorias)

-- Orçamento do hobby por mês
create table if not exists hobby_budget (
  id uuid primary key default gen_random_uuid(),
  mes text not null unique, -- yyyy-mm
  valor_limite numeric(12,2) not null default 300,
  created_at timestamptz not null default now()
);

-- Wishlist de itens desejados
create table if not exists hobby_wishlist (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  prioridade text not null default 'visual',
  -- valores: favorito, raro, completar_time, visual
  preco_medio numeric(12,2),
  status text not null default 'quero',
  -- valores: quero, acompanhando_preco, comprado
  notas text,
  created_at timestamptz not null default now(),
  constraint chk_wishlist_prioridade check (prioridade in ('favorito', 'raro', 'completar_time', 'visual')),
  constraint chk_wishlist_status check (status in ('quero', 'acompanhando_preco', 'comprado'))
);

-- Compras do hobby
create table if not exists hobby_compras (
  id uuid primary key default gen_random_uuid(),
  descricao text not null,
  valor numeric(12,2) not null,
  categoria text not null default 'singles',
  -- valores: singles, packs, acessorios, frete, outros
  tipo text not null default 'planejada',
  -- valores: planejada, impulsiva
  data date not null default current_date,
  wishlist_id uuid references hobby_wishlist(id) on delete set null,
  notas text,
  created_at timestamptz not null default now(),
  constraint chk_compra_categoria check (categoria in ('singles', 'packs', 'acessorios', 'frete', 'outros')),
  constraint chk_compra_tipo check (tipo in ('planejada', 'impulsiva'))
);

-- Estoque de acessórios (sleeves, top loaders, etc.)
create table if not exists hobby_estoque_acessorios (
  id uuid primary key default gen_random_uuid(),
  tipo text not null,
  -- valores comuns: sleeves, top_loaders, caixa_organizadora, binder
  quantidade int not null default 0,
  quantidade_minima int not null default 5,
  created_at timestamptz not null default now()
);

-- Vendas de cards/lotes
create table if not exists hobby_vendas (
  id uuid primary key default gen_random_uuid(),
  descricao text not null,
  valor_pedido numeric(12,2) not null,
  status text not null default 'anunciado',
  -- valores: anunciado, negociando, vendido
  canal text,
  -- ex: whatsapp, marketplace, discord
  data date not null default current_date,
  notas text,
  created_at timestamptz not null default now(),
  constraint chk_venda_status check (status in ('anunciado', 'negociando', 'vendido'))
);

-- Índices
create index if not exists idx_hobby_budget_mes on hobby_budget(mes);
create index if not exists idx_hobby_compras_data on hobby_compras(data);
create index if not exists idx_hobby_vendas_status on hobby_vendas(status);
