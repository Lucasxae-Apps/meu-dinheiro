-- Adiciona coluna para registrar o valor real gasto em cada conta fixa por mês.
-- Quando preenchido, a diferença (valor planejado - valor_real) é economia
-- que volta pro "livre pra gastar".
-- NULL significa que o valor real ainda não foi informado (usa o planejado).

alter table contas_status
  add column if not exists valor_real numeric(12,2);
