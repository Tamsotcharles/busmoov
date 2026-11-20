-- Références courtes (Adrien, 20 nov. 2026).
--   Dossier : DOS-10001, demande : DEM-10001 (même numéro, séquence commune),
--   devis   : DEV-10001-1, -2, -3 (numéro du dossier + rang).
-- Les références existantes ne changent pas. Les devis d'un ancien dossier
-- (DOS-001243684D) gardent l'ancien format DEV-AAAAMM-XXXXXX.
-- Les références sont posées par les triggers quand la colonne est NULL :
-- le front et les fonctions n'en génèrent plus.

create sequence if not exists public.reference_seq start with 10001;

create or replace function public.generate_reference(prefix text, seq_name text)
returns text language plpgsql as $$
declare
  next_val bigint;
begin
  if prefix in ('DOS', 'DEM') then
    return prefix || '-' || nextval('public.reference_seq');
  end if;
  execute format('select nextval(%L)', seq_name) into next_val;
  return prefix || '-' || lpad(next_val::text, 6, '0') || upper(substring(md5(random()::text) from 1 for 4));
end;
$$;

create or replace function public.trigger_devis_reference()
returns trigger language plpgsql set search_path to public as $$
declare
  dos_ref text;
  num text;
  rang int;
  candidate text;
begin
  if new.reference is not null then
    return new;
  end if;
  select reference into dos_ref from public.dossiers where id = new.dossier_id;
  if dos_ref ~ '^DOS-\d+$' then
    num := substring(dos_ref from '\d+');
    perform pg_advisory_xact_lock(hashtext(new.dossier_id::text));
    select count(*) + 1 into rang from public.devis where dossier_id = new.dossier_id;
    loop
      candidate := 'DEV-' || num || '-' || rang;
      exit when not exists (select 1 from public.devis where reference = candidate);
      rang := rang + 1;
    end loop;
    new.reference := candidate;
  else
    new.reference := 'DEV-' || to_char(now(), 'YYYYMM') || '-' || upper(substring(md5(random()::text) from 1 for 6));
  end if;
  return new;
end;
$$;
