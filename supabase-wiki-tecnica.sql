-- ============================================================
-- WIKI TÉCNICA — Base de conhecimento interna (Correr no SQL Editor do Supabase)
-- Soluções passo-a-passo que o Técnico de Suporte documenta e reutiliza
-- nos chamados. Sem políticas RLS: o middleware usa service-role e o
-- browser nunca acede à tabela directamente (padrão do projeto).
-- ============================================================
create table if not exists public.wiki_tecnica (
  id         uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  titulo     text not null,
  software   text,
  problema   text not null,
  solucao    text not null,
  tags       text,
  autor      text
);

-- updated_at automático
create or replace function public.set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists trg_wiki_updated_at on public.wiki_tecnica;
create trigger trg_wiki_updated_at
  before update on public.wiki_tecnica
  for each row execute function public.set_updated_at();
