-- Marca quais investimentos são custeados pelo salário (30% + viagem) vs.
-- por outras entradas que já são pass-through (aluguel investido 100% em
-- renda fixa, dividendos reinvestidos). Isso permite calcular corretamente
-- quanto sobra do salário pra gastar: salário - aportes do salário -
-- contas fixas - gasto do mês.
alter table investimentos
  add column if not exists origem_salario boolean not null default true;

update investimentos
  set origem_salario = false
  where id in ('rendafixa', 'dividendos-inv');
