-- Histórico de movimentações das caixinhas de investimento: aportes e
-- retiradas com motivo. Substitui o controle "só aporte mensal" por um
-- livro-caixa real, essencial pra deixar claro quanto saiu da reserva de
-- emergência e por quê.
create table if not exists investimento_movimentos (
  id text primary key,
  investimento_id text not null references investimentos(id) on delete cascade,
  tipo text not null check (tipo in ('aporte', 'retirada')),
  valor numeric not null check (valor > 0),
  motivo text,
  data date not null default current_date,
  created_at timestamptz not null default now()
);

create index if not exists investimento_movimentos_investimento_id_idx
  on investimento_movimentos(investimento_id);

alter table investimento_movimentos disable row level security;
