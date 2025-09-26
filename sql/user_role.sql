/*
 * USER_ROLE TABLE SCHEMA
 * 
 * This table manages user permissions within organizations, linking users to companies
 * with specific roles and device access controls.
 * 
 * DEVICES FIELD STRUCTURE:
 * The 'devices' field is a JSONB column that supports flexible device access patterns:
 * 
 * 1. SPECIFIC DEVICE ACCESS (Array of UUIDs):
 *    devices = ["550e8400-e29b-41d4-a716-446655440001", "550e8400-e29b-41d4-a716-446655440002"]
 *    User can only access the specified devices
 * 
 * 2. ALL DEVICE ACCESS (String):
 *    devices = "all"
 *    User has access to all devices in the organization (typically for managers/admins)
 * 
 * 3. NO DEVICE ACCESS (Empty Array):
 *    devices = []
 *    User has no device access permissions
 * 
 * AUTOMATIC ROLE ASSIGNMENT:
 * - Organization email holders automatically get 'manager' role with "all" device access
 * - Additional users can be manually added with specific permissions
 * - When organization email changes, roles are automatically updated
 */

-- Create or modify user_role table to manage user permissions for organizations
-- This table links users to organizations with specific roles and device access permissions
create table if not exists public.user_role (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  organization_id uuid not null,
  user_type text not null default 'user', -- Role: 'admin', 'manager', or 'user'
  -- devices field can contain:
  --   1. Array of device UUIDs: ["uuid1", "uuid2", "uuid3"] for specific device access
  --   2. String "all": grants access to all devices in the organization
  --   3. Empty array []: no device access permissions
  devices jsonb null default '[]'::jsonb,
  created_at timestamp with time zone null default timezone('utc'::text, now()),
  updated_at timestamp with time zone null default timezone('utc'::text, now()),
  constraint user_role_pkey primary key (id),
  constraint user_role_user_id_fkey foreign key (user_id) references public.users (id) on delete cascade,
  constraint user_role_organization_id_fkey foreign key (organization_id) references public.company_details (id) on delete cascade,
  constraint user_role_user_type_check check (user_type in ('admin', 'manager', 'user')),
  constraint user_role_unique_user_org unique (user_id, organization_id)
) tablespace pg_default;

-- Add columns if they don't exist (for existing tables)
do $$
begin
  -- Check and add devices column if it doesn't exist or has wrong type
  if not exists (
    select 1 from information_schema.columns 
    where table_schema = 'public' 
    and table_name = 'user_role' 
    and column_name = 'devices' 
    and data_type = 'jsonb'
  ) then
    -- Drop old devices column if it exists with different type
    if exists (
      select 1 from information_schema.columns 
      where table_schema = 'public' 
      and table_name = 'user_role' 
      and column_name = 'devices'
    ) then
      alter table public.user_role drop column devices;
    end if;
    
    -- Add new devices column with proper type
    alter table public.user_role add column devices jsonb default '[]'::jsonb;
  end if;
  
  -- Ensure user_type constraint exists
  if not exists (
    select 1 from information_schema.table_constraints 
    where table_schema = 'public' 
    and table_name = 'user_role' 
    and constraint_name = 'user_role_user_type_check'
  ) then
    alter table public.user_role add constraint user_role_user_type_check 
    check (user_type in ('admin', 'manager', 'user'));
  end if;
  
  -- Ensure unique constraint exists
  if not exists (
    select 1 from information_schema.table_constraints 
    where table_schema = 'public' 
    and table_name = 'user_role' 
    and constraint_name = 'user_role_unique_user_org'
  ) then
    alter table public.user_role add constraint user_role_unique_user_org 
    unique (user_id, organization_id);
  end if;
end;
$$;

-- Create indexes for better performance
create index if not exists idx_user_role_user_id on public.user_role using btree (user_id) tablespace pg_default;
create index if not exists idx_user_role_organization_id on public.user_role using btree (organization_id) tablespace pg_default;
create index if not exists idx_user_role_user_type on public.user_role using btree (user_type) tablespace pg_default;
create index if not exists idx_user_role_created_at on public.user_role using btree (created_at) tablespace pg_default;

-- Create function to handle updated_at timestamp
create or replace function update_user_role_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create trigger for updated_at (drop and recreate to ensure latest version)
drop trigger if exists user_role_updated_at on public.user_role;
create trigger user_role_updated_at
  before update on public.user_role
  for each row
  execute function update_user_role_updated_at();

-- Function to sync organization email with user_role table
-- Automatically manages user roles when organization details change
create or replace function sync_organization_user_role()
returns trigger as $$
declare
  user_record record;
begin
  -- Handle INSERT: Add organization email as manager with full device access
  if tg_op = 'INSERT' and new.email is not null then
    -- Check if user exists with this email
    select * into user_record from public.users where email = new.email;
    
    if found then
      -- Insert user role as manager with "all" device access
      insert into public.user_role (user_id, organization_id, user_type, devices)
      values (user_record.id, new.id, 'manager', '"all"'::jsonb)
      on conflict (user_id, organization_id) do update set
        user_type = excluded.user_type,
        devices = excluded.devices,
        updated_at = timezone('utc'::text, now());
    end if;
  end if;

  -- Handle UPDATE: Update user role if email changed
  if tg_op = 'UPDATE' then
    -- If email changed from one value to another
    if old.email is distinct from new.email then
      
      -- Remove old email's manager role if it exists
      if old.email is not null then
        select * into user_record from public.users where email = old.email;
        if found then
          delete from public.user_role 
          where user_id = user_record.id 
            and organization_id = old.id 
            and user_type = 'manager';
        end if;
      end if;
      
      -- Add new email's manager role with full device access if new email exists
      if new.email is not null then
        select * into user_record from public.users where email = new.email;
        if found then
          insert into public.user_role (user_id, organization_id, user_type, devices)
          values (user_record.id, new.id, 'manager', '"all"'::jsonb)
          on conflict (user_id, organization_id) do update set
            user_type = excluded.user_type,
            devices = excluded.devices,
            updated_at = timezone('utc'::text, now());
        end if;
      end if;
    end if;
  end if;

  -- Handle DELETE: Clean up user roles for this organization
  if tg_op = 'DELETE' then
    delete from public.user_role where organization_id = old.id;
    return old;
  end if;

  return new;
end;
$$ language plpgsql;

-- Create trigger on company_details table (drop and recreate to ensure latest version)
drop trigger if exists sync_organization_user_role_trigger on public.company_details;
create trigger sync_organization_user_role_trigger
  after insert or update or delete on public.company_details
  for each row
  execute function sync_organization_user_role();

-- Function to handle new user registration and sync with existing organizations
-- When a user registers, automatically grant manager role if email matches organization
create or replace function sync_new_user_with_organizations()
returns trigger as $$
declare
  org_record record;
begin
  -- When a new user is created, check if their email matches any organization email
  if tg_op = 'INSERT' and new.email is not null then
    -- Find organizations that have this email
    for org_record in 
      select id from public.company_details 
      where email = new.email and archived = false
    loop
      -- Add user as manager with "all" device access for matching organizations
      insert into public.user_role (user_id, organization_id, user_type, devices)
      values (new.id, org_record.id, 'manager', '"all"'::jsonb)
      on conflict (user_id, organization_id) do update set
        user_type = excluded.user_type,
        devices = excluded.devices,
        updated_at = timezone('utc'::text, now());
    end loop;
  end if;

  return new;
end;
$$ language plpgsql;

-- Create trigger on users table (drop and recreate to ensure latest version)
drop trigger if exists sync_new_user_with_organizations_trigger on public.users;
create trigger sync_new_user_with_organizations_trigger
  after insert on public.users
  for each row
  execute function sync_new_user_with_organizations();

-- Backfill existing data: sync current organization emails with user_role table
-- This one-time operation creates manager roles for existing organization-user email matches
do $$
declare
  org_record record;
  user_record record;
begin
  for org_record in 
    select id, email from public.company_details 
    where email is not null and archived = false
  loop
    -- Find user with matching email
    select * into user_record from public.users where email = org_record.email;
    
    if found then
      -- Insert user role as manager with "all" device access
      insert into public.user_role (user_id, organization_id, user_type, devices)
      values (user_record.id, org_record.id, 'manager', '"all"'::jsonb)
      on conflict (user_id, organization_id) do nothing;
    end if;
  end loop;
end;
$$;
