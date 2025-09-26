create table public.users (
  id uuid not null,
  email character varying(255) not null,
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  first_name character varying(100) null,
  last_name character varying(100) null,
  full_name character varying GENERATED ALWAYS as (
    case
      when (
        (first_name is not null)
        and (last_name is not null)
      ) then (
        ((first_name)::text || ' '::text) || (last_name)::text
      )
      when (first_name is not null) then (first_name)::text
      when (last_name is not null) then (last_name)::text
      else null::text
    end
  ) STORED (200) null,
  phone character varying(20) null,
  avatar_url text null,
  metadata jsonb null default '{}'::jsonb,
  constraint users_pkey primary key (id),
  constraint users_email_key unique (email),
  constraint users_id_fkey foreign KEY (id) references auth.users (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_users_created_at on public.users using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_users_email on public.users using btree (email) TABLESPACE pg_default;

create index IF not exists idx_users_full_name on public.users using btree (full_name) TABLESPACE pg_default;

create trigger users_updated_at BEFORE
update on users for EACH row
execute FUNCTION handle_updated_at ();