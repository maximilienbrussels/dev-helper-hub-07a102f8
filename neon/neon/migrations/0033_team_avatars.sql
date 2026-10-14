-- Profielfoto's van teamleden (publieke pagina "Wie zijn we").
create table if not exists team_avatars (
  person_key text primary key,
  image_url text not null,
  updated_at timestamptz not null default now(),
  updated_by text
);
