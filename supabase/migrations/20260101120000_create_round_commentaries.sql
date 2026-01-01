-- Create table for storing AI generated round commentaries
create table if not exists public.round_commentaries (
    id uuid not null default gen_random_uuid(),
    tournament_id bigint not null references public.tournaments(id) on delete cascade,
    round integer not null,
    content jsonb not null,
    created_at timestamp with time zone not null default now(),
    
    constraint round_commentaries_pkey primary key (id),
    constraint round_commentaries_round_unique unique (tournament_id, round)
);

-- Enable RLS
alter table public.round_commentaries enable row level security;

-- Policies
create policy "Public read access"
    on public.round_commentaries
    for select
    using (true);

create policy "Authenticated insert/update access"
    on public.round_commentaries
    for all
    using (auth.role() = 'authenticated');
