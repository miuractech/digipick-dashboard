create table public.devices (
  id uuid not null default gen_random_uuid (),
  company_id uuid not null,
  device_name text not null,
  amc_id text null,
  mac_address text not null,
  make text null,
  model text null,
  serial_number text null,
  purchase_date date null,
  warranty_expiry_date date null,
  amc_start_date date null,
  amc_end_date date null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint devices_pkey primary key (id),
  constraint devices_mac_address_key unique (mac_address),
  constraint devices_company_id_fkey foreign KEY (company_id) references company_details (id) on delete CASCADE
) TABLESPACE pg_default;

create index IF not exists idx_devices_amc_end_date on public.devices using btree (amc_end_date) TABLESPACE pg_default;

create index IF not exists idx_devices_amc_id on public.devices using btree (amc_id) TABLESPACE pg_default;

create index IF not exists idx_devices_company_id on public.devices using btree (company_id) TABLESPACE pg_default;

create index IF not exists idx_devices_created_at on public.devices using btree (created_at) TABLESPACE pg_default;

create index IF not exists idx_devices_device_name on public.devices using btree (device_name) TABLESPACE pg_default;

create index IF not exists idx_devices_mac_address on public.devices using btree (mac_address) TABLESPACE pg_default;

create index IF not exists idx_devices_warranty_expiry on public.devices using btree (warranty_expiry_date) TABLESPACE pg_default;

create trigger trigger_update_devices_updated_at BEFORE
update on devices for EACH row
execute FUNCTION update_devices_updated_at ();