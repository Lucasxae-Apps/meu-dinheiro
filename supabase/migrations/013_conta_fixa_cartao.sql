-- Migration 013: Cartão da conta fixa (apenas informativo)
-- Marca com qual cartão uma conta fixa é paga (ex: academia e gasolina no crédito).
-- Não altera cálculos de orçamento nem a somatória da fatura — é só visual.

alter table contas_fixas
  add column if not exists cartao_id text references cartoes(id) on delete set null;
