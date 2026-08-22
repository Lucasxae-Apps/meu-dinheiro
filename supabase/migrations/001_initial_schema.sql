-- Meu Dinheiro — Schema inicial
-- Sem RLS por enquanto (app pessoal, single user)

-- Entradas mensais (salário, aluguel, etc.)
create table if not exists entradas (
  id text primary key,
  nome text not null,
  valor numeric(12,2) not null default 0,
  oficial boolean not null default true,
  nota text,
  created_at timestamptz not null default now()
);

-- Investimentos e metas
create table if not exists investimentos (
  id text primary key,
  nome text not null,
  aporte_mensal numeric(12,2) not null default 0,
  acumulado numeric(12,2) not null default 0,
  alvo numeric(12,2),
  origem_aluguel boolean not null default false,
  nota text,
  created_at timestamptz not null default now()
);

-- Contas fixas (modelo base — valor planejado)
create table if not exists contas_fixas (
  id text primary key,
  nome text not null,
  valor numeric(12,2) not null default 0,
  nota text,
  created_at timestamptz not null default now()
);

-- Status de pagamento por mês (1 registro por conta por mês)
create table if not exists contas_status (
  id uuid primary key default gen_random_uuid(),
  conta_id text not null references contas_fixas(id) on delete cascade,
  mes text not null, -- formato yyyy-mm
  pago boolean not null default false,
  pago_em date,
  created_at timestamptz not null default now(),
  unique(conta_id, mes)
);

-- Lançamentos (gastos variáveis)
create table if not exists lancamentos (
  id text primary key,
  data date not null,
  mes text not null generated always as (
    lpad(extract(year from data)::text, 4, '0') || '-' || lpad(extract(month from data)::text, 2, '0')
  ) stored,
  categoria text not null,
  valor numeric(12,2) not null default 0,
  nota text,
  created_at timestamptz not null default now()
);

-- Despesas irregulares
create table if not exists despesas_irregulares (
  id text primary key,
  descricao text not null,
  valor numeric(12,2),
  data date,
  nota text,
  created_at timestamptz not null default now()
);

-- Configurações gerais (single row)
create table if not exists configuracoes (
  id int primary key default 1 check (id = 1),
  rendimento_mensal numeric(6,4) not null default 0.012,
  incluir_aluguel_na_meta boolean not null default true,
  updated_at timestamptz not null default now()
);

-- Índices para queries por mês
create index if not exists idx_lancamentos_mes on lancamentos(mes);
create index if not exists idx_contas_status_mes on contas_status(mes);

-- Seed da configuração
insert into configuracoes (id, rendimento_mensal, incluir_aluguel_na_meta)
values (1, 0.012, true)
on conflict (id) do nothing;
