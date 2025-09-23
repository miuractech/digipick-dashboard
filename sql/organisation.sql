create table public.company_details (
  id uuid not null default gen_random_uuid (),
  name text not null,
  legal_name text null,
  gst_number text null,
  pan_number text null,
  cin_number text null,
  email text null,
  phone text null,
  address_line1 text null,
  address_line2 text null,
  city text null,
  state text null,
  postal_code text null,
  country text null default 'India'::text,
  archived boolean null default false,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint company_details_pkey primary key (id)
) TABLESPACE pg_default;

create index IF not exists idx_company_details_created_at on public.company_details using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_company_details_gst_number on public.company_details using btree (gst_number) TABLESPACE pg_default;

create index IF not exists idx_company_details_name on public.company_details using btree (name) TABLESPACE pg_default;

create index IF not exists idx_company_details_archived on public.company_details using btree (archived) TABLESPACE pg_default;

create trigger trigger_update_company_details_updated_at BEFORE
update on company_details for EACH row
execute FUNCTION update_company_details_updated_at ();