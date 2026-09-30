-- Aluguel e dividendos já entram 100% como aporte em Investimentos
-- (rendafixa, dividendos-inv). Contá-los também como "entrada oficial"
-- duplicaria o dinheiro no cálculo de sobra. Marcamos como vinculadas a
-- investimento: aparecem em Entradas como referência, mas não somam no
-- bucket oficial nem no teto de gastos.
alter table entradas
  add column if not exists vinculada_investimento boolean not null default false;

update entradas
  set oficial = false, vinculada_investimento = true
  where id in ('aluguel', 'dividendos');
