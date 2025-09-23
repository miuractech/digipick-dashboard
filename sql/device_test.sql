create table public.device_test (
  id uuid not null default gen_random_uuid (),
  created_at timestamp with time zone null default now(),
  updated_at timestamp with time zone null default now(),
  folder_name text not null,
  images text[] null default '{}'::text[],
  device_id uuid null,
  device_name text null,
  device_type text null,
  test_results jsonb null,
  test_date timestamp with time zone null,
  test_status text null,
  upload_batch text null,
  notes text null,
  metadata jsonb null default '{}'::jsonb,
  data jsonb null,
  data_type text null,
  constraint device_test_pkey primary key (id),
  constraint unique_folder_device unique (folder_name, device_id),
  constraint device_test_device_id_fkey foreign KEY (device_id) references devices (id),
  constraint device_test_test_status_check check (
    (
      test_status = any (
        array[
          'pending'::text,
          'passed'::text,
          'failed'::text,
          'incomplete'::text
        ]
      )
    )
  )
) TABLESPACE pg_default;

create index IF not exists idx_device_test_data on public.device_test using gin (data) TABLESPACE pg_default;

create index IF not exists idx_device_test_data_type on public.device_test using btree (data_type) TABLESPACE pg_default;

create index IF not exists idx_device_test_device_id on public.device_test using btree (device_id) TABLESPACE pg_default;

create index IF not exists idx_device_test_folder_name on public.device_test using btree (folder_name) TABLESPACE pg_default;

create index IF not exists idx_device_test_metadata on public.device_test using gin (metadata) TABLESPACE pg_default;

create index IF not exists idx_device_test_results on public.device_test using gin (test_results) TABLESPACE pg_default;

create index IF not exists idx_device_test_status on public.device_test using btree (test_status) TABLESPACE pg_default;

create index IF not exists idx_device_test_test_date on public.device_test using btree (test_date) TABLESPACE pg_default;

create trigger update_device_test_updated_at BEFORE
update on device_test for EACH row
execute FUNCTION update_updated_at_column ();


-- sample data
INSERT INTO "public"."device_test" ("id", "created_at", "updated_at", "folder_name", "images", "device_id", "device_name", "device_type", "test_results", "test_date", "test_status", "upload_batch", "notes", "metadata", "data", "data_type") VALUES ('023ea0da-e36b-4206-8d5e-0a5f4a0ce34d', '2025-09-11 07:51:52.418183+00', '2025-09-11 07:51:52.418183+00', 'Batch8', '{}', '607aecf5-5e45-4772-b7f2-c35d2f773f7b', null, null, '{"max": [[112, 112, 198]], "min": [[85, 83, 189]], "mean": [[99.0, 95.29, 194.29]], "range": [[27, 29, 9]], "result": [[[109, 83, 192], [112, 83, 195], [110, 84, 194], [106, 83, 189], [85, 111, 196], [86, 112, 198], [85, 111, 196]]], "variance": [[12.07, 14.59, 1.42]], "standard deviation": [[11.95, 13.9, 2.76]]}', '2025-09-11 13:21:52.223804+00', 'passed', 'batch_1757577112', null, '{"device_id": "607aecf5-5e45-4772-b7f2-c35d2f773f7b", "image_urls": [], "device_name": "RVTESTDEV2", "device_type": "texture-pred", "folder_hash": "6167318202e1ab85e39e7b6c61cb8529", "total_images": 0, "files_processed": ["upload_success.json", "stats.json"], "upload_timestamp": "2025-09-11T13:21:52.223804"}', null, 'image_analysis');
INSERT INTO "public"."device_test" ("id", "created_at", "updated_at", "folder_name", "images", "device_id", "device_name", "device_type", "test_results", "test_date", "test_status", "upload_batch", "notes", "metadata", "data", "data_type") VALUES ('d1d048d8-6c92-427a-89cb-a21667c4f960', '2025-09-11 07:25:10.170574+00', '2025-09-11 07:25:10.170574+00', 'Batch71', '{"2025-09-11 09:31:21.jpg","2025-09-11 09:31:05.jpg"}', '063bbb36-e3b5-4f39-9961-2379b3ec7df3', null, null, '{"max": [[76, 52, 128], [71, 53, 124]], "min": [[76, 52, 128], [71, 53, 124]], "mean": [[76.0, 52.0, 128.0], [71.0, 53.0, 124.0]], "range": [[0, 0, 0], [0, 0, 0]], "result": [[[76, 52, 128]], [[71, 53, 124]]], "variance": [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]], "standard deviation": [[0.0, 0.0, 0.0], [0.0, 0.0, 0.0]]}', '2025-09-11 12:55:09.949339+00', 'passed', 'batch_1757575509', null, '{"device_id": "063bbb36-e3b5-4f39-9961-2379b3ec7df3", "image_urls": ["2025-09-11 09:31:21.jpg", "2025-09-11 09:31:05.jpg"], "device_name": "TEST", "device_type": "image_analyzer", "folder_hash": "a837bbfc7fc1f172115b6817739c1220", "total_images": 2, "files_processed": ["2025-09-11 09:31:21.jpg", "2025-09-11 09:31:05.jpg", "stats.json", "2025-09-11 09:31.pdf"], "upload_timestamp": "2025-09-11T12:55:09.949339"}', null, 'image_analysis');
