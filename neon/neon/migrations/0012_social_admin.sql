-- Social-beheer: verborgen berichten (Bluesky/Mastodon) en eigen berichten.
-- Idempotent: opnieuw uitvoeren mag geen fouten geven.

create table if not exists social_hidden_posts (
  id bigint generated always as identity primary key,
  platform text not null,
  post_id text not null,
  hidden_by text,
  reden text,
  created_at timestamptz not null default now(),
  constraint social_hidden_posts_unique unique (platform, post_id)
);

create index if not exists social_hidden_posts_platform_idx on social_hidden_posts(platform);

create table if not exists social_posts (
  id bigint generated always as identity primary key,
  platform text not null default 'eigen',
  tekst_nl text not null default '',
  tekst_fr text not null default '',
  tekst_en text not null default '',
  media_url text,
  media_id uuid,
  link text,
  gepubliceerd_op timestamptz not null default now(),
  actief boolean not null default true,
  created_by text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists social_posts_platform_idx on social_posts(platform);
create index if not exists social_posts_gepubliceerd_op_idx on social_posts(gepubliceerd_op desc);
create index if not exists social_posts_actief_idx on social_posts(actief);
