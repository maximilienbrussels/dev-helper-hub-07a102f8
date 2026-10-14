-- Academy-beheer: coverafbeelding per kaart (mediabibliotheek of externe URL).
alter table public.academies
  add column if not exists cover_image_url text,
  add column if not exists cover_image_alt text;

comment on column public.academies.cover_image_url is 'URL van de coverafbeelding (mediabibliotheek of extern), getoond op de academykaart.';
comment on column public.academies.cover_image_alt is 'Alt-tekst van de coverafbeelding, voor schermlezers en SEO.';
