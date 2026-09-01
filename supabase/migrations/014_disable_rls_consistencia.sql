-- Migration 014: Desabilita RLS para consistência com o design single-user.
-- O projeto inteiro é sem RLS (ver 001_initial_schema.sql). O RLS foi habilitado
-- fora das migrations em algumas tabelas (ex: investimentos_mes), quebrando
-- INSERT/UPDATE via anon key. Como o app não tem autenticação e é de uso único,
-- desabilitamos o RLS dessas tabelas para restaurar o comportamento esperado.
--
-- NOTA DE SEGURANÇA: isto NÃO enfraquece um controle efetivo — a anon key já é a
-- única credencial e todas as demais tabelas do schema já operam sem RLS. Se o app
-- vier a ter múltiplos usuários/login no futuro, RLS + policies devem ser
-- reintroduzidos em TODAS as tabelas de forma coordenada.

alter table if exists investimentos_mes disable row level security;
alter table if exists entradas_mes disable row level security;
alter table if exists investimentos_aporte_feito disable row level security;
alter table if exists cartoes disable row level security;
alter table if exists hobby_binders disable row level security;
