-- Migration 007: Seed data para hobby (colecionáveis F1)
-- Dados de exemplo para setembro 2026

-- Budget do mês
insert into hobby_budget (mes, valor_limite)
values ('2026-09', 300)
on conflict (mes) do nothing;

-- Wishlist
insert into hobby_wishlist (nome, prioridade, preco_medio, status, notas) values
  ('Norris . Topps NOW numbered', 'favorito', 90, 'quero', 'Numbered /99 — prioridade máxima'),
  ('Colapinto Limited Edition', 'visual', null, 'acompanhando_preco', 'Esperando preço cair'),
  ('Senna . legends', 'raro', 140, 'quero', 'Heritage collection — difícil de achar');

-- Estoque de acessórios
insert into hobby_estoque_acessorios (tipo, quantidade, quantidade_minima) values
  ('sleeves', 34, 10),
  ('top_loaders', 2, 5);

-- Vendas
insert into hobby_vendas (descricao, valor_pedido, status, canal, data) values
  ('Card Argentina . Panini', 120, 'vendido', 'whatsapp', '2026-09-10'),
  ('Lote comuns . 98 cards', 0, 'negociando', 'marketplace', '2026-09-15');

