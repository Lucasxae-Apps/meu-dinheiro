-- Migration 005: Cartão de crédito — mês de referência da fatura
-- Adiciona lógica para que compras no cartão impactem o mês correto (fechamento da fatura)

-- 1. Adicionar dia de fechamento da fatura nas configurações
alter table configuracoes
  add column if not exists dia_fechamento_fatura int not null default 30;

-- 2. Adicionar meio de pagamento e mês de referência da fatura nos lançamentos
alter table lancamentos
  add column if not exists meio_pagamento text not null default 'debito';
-- Valores possíveis: 'credito', 'debito', 'pix', 'dinheiro'

alter table lancamentos
  add column if not exists mes_referencia_fatura text;
-- Formato yyyy-mm. NULL para não-cartão (usa o campo `mes` normal)

-- 3. Índice para consultas por mês de referência da fatura
create index if not exists idx_lancamentos_mes_ref_fatura
  on lancamentos(mes_referencia_fatura);

-- 4. Migração retroativa: calcula mes_referencia_fatura para lançamentos
-- existentes que sejam de cartão de crédito.
-- Como não temos histórico de qual era cartão, deixamos todos como 'debito'
-- (o campo mes_referencia_fatura fica NULL e o sistema usa `mes` normal).
-- O usuário pode reclassificar manualmente.

-- Constraint de validação: meio_pagamento só aceita valores conhecidos
alter table lancamentos
  add constraint chk_meio_pagamento
  check (meio_pagamento in ('credito', 'debito', 'pix', 'dinheiro'));
