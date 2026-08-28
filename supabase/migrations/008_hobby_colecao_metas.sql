-- Migration 008: Coleção de cards + Metas do hobby

-- Coleção: inventário de cards que o usuário possui
create table if not exists hobby_colecao (
  id uuid primary key default gen_random_uuid(),
  piloto text not null,            -- ex: Norris, Hamilton, Verstappen
  nome text not null,              -- ex: Topps NOW #42
  set_colecao text not null default 'Topps',  -- ex: Topps NOW, Topps Chrome, Topps Flagship
  tipo text not null default 'base',
  -- valores: base, numbered, limited, auto, relic, insert
  numeracao text,                  -- ex: /99, /50, /25 (null se base)
  valor_pago numeric(12,2),        -- quanto pagou
  valor_estimado numeric(12,2),    -- quanto acha que vale hoje
  data_aquisicao date not null default current_date,
  quantidade int not null default 1,
  notas text,
  created_at timestamptz not null default now(),
  constraint chk_colecao_tipo check (tipo in ('base', 'numbered', 'limited', 'auto', 'relic', 'insert'))
);

-- Metas de coleção: objetivos com progresso
create table if not exists hobby_metas (
  id uuid primary key default gen_random_uuid(),
  titulo text not null,            -- ex: Fechar base set Topps Chrome 2026
  descricao text,                  -- detalhes opcionais
  total int not null,              -- total de itens do objetivo (ex: 100 cards)
  atual int not null default 0,    -- quantos já tem
  prazo date,                      -- deadline opcional
  concluida boolean not null default false,
  created_at timestamptz not null default now()
);

-- Índices
create index if not exists idx_hobby_colecao_piloto on hobby_colecao(piloto);
create index if not exists idx_hobby_colecao_set on hobby_colecao(set_colecao);
create index if not exists idx_hobby_colecao_tipo on hobby_colecao(tipo);
create index if not exists idx_hobby_metas_concluida on hobby_metas(concluida);

-- Seed: alguns cards de exemplo
insert into hobby_colecao (piloto, nome, set_colecao, tipo, numeracao, valor_pago, valor_estimado, data_aquisicao) values
  ('Norris', 'Topps NOW #12 Sprint Win', 'Topps NOW', 'numbered', '/99', 85, 120, '2026-08-20'),
  ('Norris', 'Topps Chrome Base', 'Topps Chrome', 'base', null, 3.50, 5, '2026-07-10'),
  ('Hamilton', 'Topps Flagship #1', 'Topps Flagship', 'base', null, 2, 3, '2026-06-15'),
  ('Hamilton', 'Topps NOW #7 Last Mercedes Race', 'Topps NOW', 'limited', '/49', 150, 220, '2026-09-01'),
  ('Verstappen', 'Topps Chrome Gold', 'Topps Chrome', 'numbered', '/50', 60, 95, '2026-08-05'),
  ('Verstappen', 'Topps Flagship Base', 'Topps Flagship', 'base', null, 1.50, 2, '2026-06-20'),
  ('Piastri', 'Topps NOW #28 Podium', 'Topps NOW', 'base', null, 8, 12, '2026-09-10'),
  ('Colapinto', 'Topps Chrome RC', 'Topps Chrome', 'base', null, 5, 15, '2026-09-12'),
  ('Senna', 'Topps Legends Insert', 'Topps Legends', 'insert', null, 25, 40, '2026-07-25'),
  ('Leclerc', 'Topps NOW #15 Ferrari 1-2', 'Topps NOW', 'base', null, 6, 8, '2026-08-14');

-- Seed: metas de exemplo
insert into hobby_metas (titulo, descricao, total, atual, prazo) values
  ('Fechar base set Topps Chrome 2026', 'Todos os 100 cards base do set', 100, 47, '2026-12-31'),
  ('Coleção Norris completa', 'Todos os Norris de 2026 (NOW + Chrome + Flagship)', 12, 5, null),
  ('10 numbered cards', 'Ter pelo menos 10 cards numerados no acervo', 10, 3, '2027-03-01');

-- Seed extra: suportes no estoque
insert into hobby_estoque_acessorios (tipo, quantidade, quantidade_minima) values
  ('suportes', 0, 3)
on conflict do nothing;
