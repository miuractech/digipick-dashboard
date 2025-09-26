export type USER_TYPES = "admin" | "manager" | "user";
export const USER_ROLES_VALUES = [
    { value: 'admin', label: 'Admin' },
    { value: 'manager', label: 'Manager' },
    { value: 'user', label: 'User' },
] as const;

export type user_role = {
    id: string; // uuid
    user_id: string; // user uuid
    organization_id: string; // organization uuid
    user_type: USER_TYPES;
    created_at: string; // timestamp
    updated_at: string; // timestamp
    devices: string[] | 'all'; // devices uuid s
}