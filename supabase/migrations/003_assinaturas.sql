-- Assinaturas detalhadas (Netflix, Spotify, etc.)
create table if not exists assinaturas (
  id text primary key,
  nome text not null,
  valor numeric(12,2) not null default 0,
  dia_cobranca int not null default 1 check (dia_cobranca between 1 and 31),
  nota text,
  ativa boolean not null default true,
  created_at timestamptz not null default now()
);
