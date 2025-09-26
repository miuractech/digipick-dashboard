create table public.service_requests (
  id uuid not null default gen_random_uuid (),
  ticket_no text not null,
  product text not null,
  serial_no text not null,
  service_type text not null,
  service_details text not null,
  organization_id uuid not null,
  device_id uuid not null,
  user_id uuid not null,
  date_of_request timestamp with time zone not null default timezone ('utc'::text, now()),
  date_of_service timestamp with time zone null,
  uploaded_reference text null,
  uploaded_file_url text null,
  mode_of_service text null,
  service_engineer text null,
  engineer_comments text null,
  status text not null default 'pending'::text,
  payment_details text null,
  created_at timestamp with time zone null default timezone ('utc'::text, now()),
  updated_at timestamp with time zone null default timezone ('utc'::text, now()),
  constraint service_requests_pkey primary key (id),
  constraint service_requests_ticket_no_key unique (ticket_no),
  constraint service_requests_device_id_fkey foreign KEY (device_id) references devices (id) on delete CASCADE,
  constraint service_requests_organization_id_fkey foreign KEY (organization_id) references company_details (id) on delete CASCADE,
  constraint service_requests_service_type_check check (
    (
      service_type = any (
        array[
          'demo_installation'::text,
          'repair'::text,
          'service'::text,
          'calibration'::text
        ]
      )
    )
  ),
  constraint service_requests_status_check check (
    (
      status = any (
        array[
          'pending'::text,
          'completed'::text,
          'cancelled'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_service_requests_ticket_no on public.service_requests using btree (ticket_no) TABLESPACE pg_default;

create index IF not exists idx_service_requests_organization_id on public.service_requests using btree (organization_id) TABLESPACE pg_default;

create index IF not exists idx_service_requests_device_id on public.service_requests using btree (device_id) TABLESPACE pg_default;

create index IF not exists idx_service_requests_user_id on public.service_requests using btree (user_id) TABLESPACE pg_default;

create index IF not exists idx_service_requests_status on public.service_requests using btree (status) TABLESPACE pg_default;

create index IF not exists idx_service_requests_service_type on public.service_requests using btree (service_type) TABLESPACE pg_default;

create index IF not exists idx_service_requests_date_of_request on public.service_requests using btree (date_of_request) TABLESPACE pg_default;

create index IF not exists idx_service_requests_date_of_service on public.service_requests using btree (date_of_service) TABLESPACE pg_default;

create trigger trigger_update_service_requests_updated_at BEFORE
update on service_requests for EACH row
execute FUNCTION update_service_requests_updated_at ();