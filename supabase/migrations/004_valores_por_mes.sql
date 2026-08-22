-- Valores de entradas por mês (override do valor base)
-- Se não existir registro pro mês, usa o valor da tabela `entradas`
create table if not exists entradas_mes (
  id uuid primary key default gen_random_uuid(),
  entrada_id text not null references entradas(id) on delete cascade,
  mes text not null, -- yyyy-mm
  valor numeric(12,2) not null,
  nota text,
  created_at timestamptz not null default now(),
  unique(entrada_id, mes)
);

-- Valores de investimentos por mês (override do aporte base)
-- Se não existir registro pro mês, usa o valor da tabela `investimentos`
create table if not exists investimentos_mes (
  id uuid primary key default gen_random_uuid(),
  investimento_id text not null references investimentos(id) on delete cascade,
  mes text not null, -- yyyy-mm
  aporte_mensal numeric(12,2) not null,
  nota text,
  created_at timestamptz not null default now(),
  unique(investimento_id, mes)
);

create index if not exists idx_entradas_mes_mes on entradas_mes(mes);
create index if not exists idx_investimentos_mes_mes on investimentos_mes(mes);
