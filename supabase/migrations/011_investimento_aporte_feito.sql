-- Migration 011: Check de "investido" por mês
-- Marca se o aporte de um investimento foi realizado em determinado mês.
-- Ao marcar, o app soma o aporte no acumulado do investimento.
-- Guardamos o valor aportado pra permitir estorno exato ao desmarcar.

create table if not exists investimentos_aporte_feito (
  id uuid primary key default gen_random_uuid(),
  investimento_id text not null references investimentos(id) on delete cascade,
  mes text not null, -- yyyy-mm
  valor_aportado numeric(12,2) not null,
  feito_em timestamptz not null default now(),
  unique(investimento_id, mes)
);

create index if not exists idx_aporte_feito_mes on investimentos_aporte_feito(mes);
