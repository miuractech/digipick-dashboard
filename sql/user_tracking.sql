/*
 * USER_TRACKING TABLE SCHEMA
 * 
 * This table allows managers to pre-assign device permissions to email addresses
 * even before those users have registered in the system. When users eventually
 * sign up, the synchronization triggers will automatically create proper user_role entries.
 * 
 * WORKFLOW:
 * 1. Manager adds email + device permissions to user_tracking
 * 2. If user exists: Create user_role entry immediately
 * 3. If user doesn't exist: Wait for user registration
 * 4. When user registers: Trigger checks user_tracking and creates user_role entries
 * 
 * DEVICES FIELD STRUCTURE (same as user_role):
 * - "all": Access to all organization devices
 * - ["uuid1", "uuid2"]: Access to specific devices
 * - []: No device access
 */

-- Create user_tracking table for managing organization users
create table if not exists public.user_tracking (
  id uuid not null default gen_random_uuid(),
  organization_id uuid not null,
  email text not null,
  user_type text not null default 'user', -- Role: 'admin', 'manager', or 'user'
  -- devices field structure same as user_role table
  devices jsonb null default '[]'::jsonb,
  added_by uuid not null, -- Manager who added this entry
  is_synced boolean not null default false, -- Whether this has been synced to user_role
  user_id uuid null, -- Set when user registers (for tracking purposes)
  created_at timestamp with time zone null default timezone('utc'::text, now()),
  updated_at timestamp with time zone null default timezone('utc'::text, now()),
  constraint user_tracking_pkey primary key (id),
  constraint user_tracking_organization_id_fkey foreign key (organization_id) references public.company_details (id) on delete cascade,
  constraint user_tracking_added_by_fkey foreign key (added_by) references public.users (id) on delete cascade,
  constraint user_tracking_user_id_fkey foreign key (user_id) references public.users (id) on delete set null,
  constraint user_tracking_user_type_check check (user_type in ('admin', 'manager', 'user')),
  constraint user_tracking_unique_org_email unique (organization_id, email),
  constraint user_tracking_email_format check (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$')
) tablespace pg_default;

-- Create indexes for better performance
create index if not exists idx_user_tracking_organization_id on public.user_tracking using btree (organization_id) tablespace pg_default;
create index if not exists idx_user_tracking_email on public.user_tracking using btree (email) tablespace pg_default;
create index if not exists idx_user_tracking_added_by on public.user_tracking using btree (added_by) tablespace pg_default;
create index if not exists idx_user_tracking_is_synced on public.user_tracking using btree (is_synced) tablespace pg_default;
create index if not exists idx_user_tracking_created_at on public.user_tracking using btree (created_at) tablespace pg_default;

-- Create function to handle updated_at timestamp
create or replace function update_user_tracking_updated_at()
returns trigger as $$
begin
  new.updated_at = timezone('utc'::text, now());
  return new;
end;
$$ language plpgsql;

-- Create trigger for updated_at
create trigger user_tracking_updated_at
  before update on public.user_tracking
  for each row
  execute function update_user_tracking_updated_at();

-- Function to sync user_tracking with user_role when user exists
create or replace function sync_user_tracking_to_user_role()
returns trigger as $$
declare
  user_record record;
begin
  -- Handle INSERT: Check if user exists and sync immediately
  if tg_op = 'INSERT' then
    -- Check if user exists with this email
    select * into user_record from public.users where email = new.email;
    
    if found then
      -- User exists, create user_role entry immediately
      insert into public.user_role (user_id, organization_id, user_type, devices)
      values (user_record.id, new.organization_id, new.user_type, new.devices)
      on conflict (user_id, organization_id) do update set
        user_type = excluded.user_type,
        devices = excluded.devices,
        updated_at = timezone('utc'::text, now());
      
      -- Mark as synced and set user_id
      update public.user_tracking 
      set is_synced = true, user_id = user_record.id, updated_at = timezone('utc'::text, now())
      where id = new.id;
    end if;
  end if;

  -- Handle UPDATE: Re-sync if user_type or devices changed
  if tg_op = 'UPDATE' and (old.user_type != new.user_type or old.devices != new.devices) then
    if new.user_id is not null then
      -- Update existing user_role
      update public.user_role 
      set user_type = new.user_type, devices = new.devices, updated_at = timezone('utc'::text, now())
      where user_id = new.user_id and organization_id = new.organization_id;
    end if;
  end if;

  return new;
end;
$$ language plpgsql;

-- Create trigger on user_tracking table
create trigger sync_user_tracking_to_user_role_trigger
  after insert or update on public.user_tracking
  for each row
  execute function sync_user_tracking_to_user_role();

-- Enhanced function to handle new user registration and sync with user_tracking
create or replace function sync_new_user_with_user_tracking()
returns trigger as $$
declare
  tracking_record record;
begin
  -- When a new user is created, check if their email exists in user_tracking
  if tg_op = 'INSERT' and new.email is not null then
    -- Find all user_tracking entries for this email
    for tracking_record in 
      select * from public.user_tracking 
      where email = new.email and is_synced = false
    loop
      -- Create user_role entry
      insert into public.user_role (user_id, organization_id, user_type, devices)
      values (new.id, tracking_record.organization_id, tracking_record.user_type, tracking_record.devices)
      on conflict (user_id, organization_id) do update set
        user_type = excluded.user_type,
        devices = excluded.devices,
        updated_at = timezone('utc'::text, now());
      
      -- Update user_tracking to mark as synced
      update public.user_tracking 
      set is_synced = true, user_id = new.id, updated_at = timezone('utc'::text, now())
      where id = tracking_record.id;
    end loop;
    
    -- Also check existing organization emails (keep existing functionality)
    for tracking_record in 
      select id from public.company_details 
      where email = new.email and archived = false
    loop
      insert into public.user_role (user_id, organization_id, user_type, devices)
      values (new.id, tracking_record.id, 'manager', '"all"'::jsonb)
      on conflict (user_id, organization_id) do update set
        user_type = excluded.user_type,
        devices = excluded.devices,
        updated_at = timezone('utc'::text, now());
    end loop;
  end if;

  return new;
end;
$$ language plpgsql;

-- Drop existing trigger and create new one
drop trigger if exists sync_new_user_with_organizations_trigger on public.users;

-- Create enhanced trigger on users table
create trigger sync_new_user_with_tracking_and_organizations_trigger
  after insert on public.users
  for each row
  execute function sync_new_user_with_user_tracking();

-- Function to clean up user_tracking when user_role is deleted
create or replace function cleanup_user_tracking_on_role_delete()
returns trigger as $$
begin
  -- When a user_role is deleted, update corresponding user_tracking entry
  update public.user_tracking 
  set is_synced = false, user_id = null, updated_at = timezone('utc'::text, now())
  where user_id = old.user_id and organization_id = old.organization_id;
  
  return old;
end;
$$ language plpgsql;

-- Create trigger for cleanup
create trigger cleanup_user_tracking_on_role_delete_trigger
  after delete on public.user_role
  for each row
  execute function cleanup_user_tracking_on_role_delete();

-- Grant necessary permissions
grant select, insert, update, delete on public.user_tracking to authenticated;

-- Create RLS policies
alter table public.user_tracking enable row level security;

-- Policy for organization managers to manage their users
create policy "Managers can manage organization users" on public.user_tracking
  for all using (
    organization_id in (
      select ur.organization_id 
      from public.user_role ur 
      where ur.user_id = auth.uid() 
      and ur.user_type in ('manager', 'admin')
    )
  );

-- Policy for users to see their own tracking entries
create policy "Users can view their own tracking entries" on public.user_tracking
  for select using (
    user_id = auth.uid() or 
    email = (select email from public.users where id = auth.uid())
  );
