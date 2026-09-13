# Ranking online do ORBO (Supabase)

O jogo já tem o cliente pronto (`js/online.js`). Enquanto `HR.CONFIG.BACKEND` estiver vazio, os rankings mostram uma demonstração. Para ligar o ranking público de verdade:

## 1. Projeto
1. Crie um projeto no Supabase (ou use um existente só para o ORBO).
2. Em **Authentication → Sign In / Providers**, ative **Anonymous sign-ins** (cada aparelho vira um usuário anônimo; ninguém precisa criar conta).

## 2. Tabela e regras (SQL Editor)

```sql
create table if not exists public.orbo_players (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null check (char_length(name) between 2 and 18),
  flag text not null default '',
  best integer not null default 0 check (best between 0 and 100000),
  pct numeric(7,3) not null default 0 check (pct between 0 and 100),
  layers integer not null default 0 check (layers between 0 and 11),
  paths text not null default '',
  level integer not null default 1,
  cleared_at timestamptz,
  updated_at timestamptz not null default now()
);

alter table public.orbo_players enable row level security;

-- qualquer pessoa pode ver os rankings
create policy "orbo leitura publica" on public.orbo_players for select using (true);
-- cada jogador só grava a própria linha
create policy "orbo insere a propria linha" on public.orbo_players for insert with check (auth.uid() = id);
create policy "orbo atualiza a propria linha" on public.orbo_players for update using (auth.uid() = id) with check (auth.uid() = id);

create index if not exists orbo_players_pct on public.orbo_players (pct desc, cleared_at asc);
create index if not exists orbo_players_best on public.orbo_players (best desc);
```

## 3. Ligar no jogo
Em `js/config.js`, dentro de `HR.CONFIG`, adicione:

```js
BACKEND: { url: 'https://SEU-PROJETO.supabase.co', anonKey: 'SUA_CHAVE_ANON_PUBLICA', table: 'orbo_players' },
```

A chave *anon* é pública por natureza; a proteção vem das regras (RLS) acima.

## 4. O que é enviado
Ao fim de cada partida e ao atravessar um Arconte: nome escolhido, país (do idioma do aparelho), melhor pontuação do Infinito, % da jornada (60 % fases, 15 % estrelas, 25 % Arcontes), camadas atravessadas, caminho por camada (U/Q/F) e a data em que zerou.

## 5. Antitrapaça (próximo passo)
Os dados vêm do aparelho. Para competição com prêmio, valide no servidor antes de aceitar: uma Edge Function que recebe o resumo da partida, confere limites (pontuação por segundo, sequência de fases) e só então grava — e conceda o **prêmio misterioso** só depois de revisar a partida do primeiro colocado.
