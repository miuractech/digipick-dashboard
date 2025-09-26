export type USER_TYPES = "admin" | "manager" | "user";

export interface User {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  organization_id: string;
  user_type: USER_TYPES;
  devices: string[] | 'all';
  created_at: string;
  updated_at: string;
}

export interface OrganizationUser extends User {
  user_role: UserRole;
}

export interface UserTracking {
  id: string;
  organization_id: string;
  email: string;
  user_type: USER_TYPES;
  devices: string[] | 'all';
  added_by: string;
  is_synced: boolean;
  user_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateUserTrackingData {
  organization_id: string;
  email: string;
  user_type: USER_TYPES;
  devices: string[] | 'all';
}

export interface UpdateUserDevicesData {
  user_id: string;
  organization_id: string;
  devices: string[] | 'all';
}
