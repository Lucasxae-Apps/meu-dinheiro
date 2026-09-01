-- Migration 010: Cartões de crédito
-- Permite cadastrar cartões e associar lançamentos de crédito a um cartão,
-- para somar a fatura de cada cartão no fim do mês.

create table if not exists cartoes (
  id text primary key,
  nome text not null,
  bandeira text,               -- ex: Visa, Mastercard, Elo
  cor text not null default '#6366f1',  -- cor pra identificar visualmente
  limite numeric(12,2),        -- limite total do cartão (opcional)
  dia_fechamento int,          -- dia do fechamento da fatura (opcional; usa config global se null)
  dia_vencimento int,          -- dia do vencimento da fatura (opcional)
  ativo boolean not null default true,
  created_at timestamptz not null default now()
);

-- Associa lançamento a um cartão (só faz sentido pra meio_pagamento = 'credito')
alter table lancamentos
  add column if not exists cartao_id text references cartoes(id) on delete set null;

create index if not exists idx_lancamentos_cartao on lancamentos(cartao_id);

-- Seed: um cartão de exemplo pra não começar vazio
insert into cartoes (id, nome, bandeira, cor, dia_fechamento, dia_vencimento)
values ('cartao-principal', 'Cartão principal', 'Mastercard', '#6366f1', 25, 5)
on conflict (id) do nothing;
