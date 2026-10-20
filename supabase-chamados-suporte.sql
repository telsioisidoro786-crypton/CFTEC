-- ============================================================
-- CHAMADOS DE SUPORTE (Helpdesk do Técnico de Suporte)
-- Correr no SQL Editor do Supabase
-- ============================================================
create table if not exists public.chamados_suporte (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  cliente text not null,
  nif text,
  software text,
  problema text not null,
  resolucao text,
  estado text not null default 'Pendente'
    check (estado in ('Pendente', 'Em Resolução', 'Resolvido')),
  prioridade text not null default 'Média'
    check (prioridade in ('Baixa', 'Média', 'Crítica'))
);

-- índice para a lista do painel (mais recentes primeiro)
create index if not exists chamados_suporte_created_idx on public.chamados_suporte (created_at desc);

-- RLS activo SEM políticas públicas: leitura/escrita só via middleware service-role
alter table public.chamados_suporte enable row level security;

-- trigger updated_at
create or replace function public.set_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_chamados_updated on public.chamados_suporte;
create trigger trg_chamados_updated
  before update on public.chamados_suporte
  for each row execute function public.set_updated_at();
