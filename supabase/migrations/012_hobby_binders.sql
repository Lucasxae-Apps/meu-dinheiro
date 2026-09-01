-- Migration 012: Binders do hobby
-- Organiza a coleção de cards em "binders" (coleções temáticas do usuário).
-- Cada card pertence a um binder. Binders são livres, mas já semeamos os do usuário.

alter table hobby_colecao
  add column if not exists binder text not null default 'Outros';

create index if not exists idx_hobby_colecao_binder on hobby_colecao(binder);

-- Tabela de binders: define os slots do binder virtual e uma cor/ordem.
create table if not exists hobby_binders (
  id uuid primary key default gen_random_uuid(),
  nome text not null unique,
  cor text not null default '#6366f1',
  slots int not null default 9,        -- páginas do binder (grade 3x3 por padrão)
  ordem int not null default 0,
  created_at timestamptz not null default now()
);

-- Seed: os binders do Lucas
insert into hobby_binders (nome, cor, slots, ordem) values
  ('Cards Topps Now',        '#ef4444', 18, 1),
  ('Cards Lewis',            '#22c55e', 9,  2),
  ('Cards Max',              '#3b82f6', 9,  3),
  ('Cards Equipes',          '#f59e0b', 9,  4),
  ('Cards Capacetes',        '#a855f7', 9,  5),
  ('Cards Fotos de Carros',  '#14b8a6', 9,  6),
  ('Cards Legends/Ícones',   '#eab308', 9,  7),
  ('Cards Chefes de Equipe', '#ec4899', 9,  8),
  ('Cards F2/F3',            '#6b7280', 9,  9)
on conflict (nome) do nothing;
