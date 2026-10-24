-- Afhaalcodes met een cryptografisch veilige bron i.p.v. random().
create extension if not exists pgcrypto;

create or replace function public.gen_pickup_code() returns text
language plpgsql
as $$
declare
  alphabet text := '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
  bytes bytea;
  code text;
  i int;
  free boolean;
begin
  loop
    bytes := gen_random_bytes(6);
    code := '';
    for i in 0..5 loop
      code := code || substr(alphabet, 1 + (get_byte(bytes, i) % 32), 1);
    end loop;
    select not exists (select 1 from public.orders where pickup_code = code) into free;
    exit when free;
  end loop;
  return code;
end;
$$;
