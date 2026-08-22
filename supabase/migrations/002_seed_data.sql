-- Seed: dados iniciais do Meu Dinheiro
-- Rode depois da migration 001

-- Entradas
insert into entradas (id, nome, valor, oficial, nota) values
  ('salario', 'Salário', 4768.21, true, null),
  ('aluguel', 'Aluguel de imóvel', 1500.00, true, 'Imóvel é metade meu, metade do meu irmão'),
  ('dividendos', 'Dividendos', 50.00, true, 'Reinvestidos automaticamente'),
  ('mesada', 'Mesada', 500.00, false, 'Renda instável — bônus à parte, fora de todo cálculo oficial')
on conflict (id) do nothing;

-- Investimentos
insert into investimentos (id, nome, aporte_mensal, acumulado, alvo, origem_aluguel, nota) values
  ('reserva', 'Reserva de emergência', 900.00, 6000.00, null, false, 'Inter — sem alvo definido'),
  ('italia', 'Meta Itália', 1000.00, 3000.00, 20000.00, false, 'Nubank — prazo e alvo a definir'),
  ('rendafixa', 'Aluguel → renda fixa', 1500.00, 6000.00, null, true, '100% do aluguel é investido, nunca gasto'),
  ('dividendos-inv', 'Dividendos reinvestidos', 50.00, 2500.00, null, false, null)
on conflict (id) do nothing;

-- Contas fixas
insert into contas_fixas (id, nome, valor, nota) values
  ('ipva', 'IPVA', 116.00, null),
  ('seguro', 'Seguro', 305.55, null),
  ('ingles', 'Inglês', 360.00, null),
  ('academia', 'Academia', 137.50, null),
  ('assinaturas', 'Assinaturas', 160.50, null),
  ('gasolina', 'Gasolina', 500.00, 'Gasto real ~R$400, R$500 como buffer')
on conflict (id) do nothing;

-- Configurações
insert into configuracoes (id, rendimento_mensal, incluir_aluguel_na_meta)
values (1, 0.012, true)
on conflict (id) do nothing;

-- Despesa irregular de exemplo
insert into despesas_irregulares (id, descricao, valor, data, nota) values
  ('seed-revisao', 'Revisão do carro', null, null, 'Sai da renda fixa quando aparecer')
on conflict (id) do nothing;
