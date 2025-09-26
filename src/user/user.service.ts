import supabase from '../supabase';
import type { 
  OrganizationUser, 
  CreateUserTrackingData, 
  UpdateUserDevicesData,
  USER_TYPES
} from './user.type';

export const userService = {
  // Get users for a specific organization
  async getOrganizationUsers(
    organizationId: string, 
    filters: { search?: string } = {},
    pagination: { page?: number; pageSize?: number } = {}
  ) {
    try {
      let query = supabase
        .from('user_role')
        .select(`
          *,
          user:users (
            id,
            email,
            first_name,
            last_name,
            full_name,
            phone,
            avatar_url,
            created_at,
            updated_at
          )
        `)
        .eq('organization_id', organizationId);

      // Apply search filter
      if (filters.search) {
        query = query.or(`user.email.ilike.%${filters.search}%,user.full_name.ilike.%${filters.search}%`);
      }

      // Apply pagination
      const page = pagination.page || 1;
      const pageSize = pagination.pageSize || 10;
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;

      query = query.range(start, end);

      const { data, error, count } = await query;

      if (error) throw error;

      // Transform data to match OrganizationUser interface
      const users: OrganizationUser[] = (data || []).map((item: {
        id: string;
        user_id: string;
        organization_id: string;
        user_type: string;
        devices: string[] | 'all';
        created_at: string;
        updated_at: string;
        user: {
          id: string;
          email: string;
          first_name: string | null;
          last_name: string | null;
          full_name: string | null;
          phone: string | null;
          avatar_url: string | null;
          created_at: string;
          updated_at: string;
        };
      }) => ({
        ...item.user,
        user_role: {
          id: item.id,
          user_id: item.user_id,
          organization_id: item.organization_id,
          user_type: item.user_type as USER_TYPES,
          devices: item.devices,
          created_at: item.created_at,
          updated_at: item.updated_at
        }
      }));

      return {
        users,
        totalCount: count || 0,
        totalPages: Math.ceil((count || 0) / pageSize)
      };
    } catch (error) {
      console.error('Error fetching organization users:', error);
      throw error;
    }
  },

  // Remove user from organization
  async removeUserFromOrganization(userId: string, organizationId: string) {
    try {
      const { error } = await supabase
        .from('user_role')
        .delete()
        .eq('user_id', userId)
        .eq('organization_id', organizationId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error removing user from organization:', error);
      throw error;
    }
  },

  // Update user's device permissions
  async updateUserDevices(data: UpdateUserDevicesData) {
    try {
      const { error } = await supabase
        .from('user_role')
        .update({
          devices: data.devices,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', data.user_id)
        .eq('organization_id', data.organization_id);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error updating user devices:', error);
      throw error;
    }
  },

  // Add user to organization via user_tracking (for email invites)
  async addUserToOrganization(data: CreateUserTrackingData) {
    try {
      const { data: result, error } = await supabase
        .from('user_tracking')
        .insert({
          organization_id: data.organization_id,
          email: data.email,
          user_type: data.user_type,
          devices: data.devices,
          added_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (error) throw error;

      return result;
    } catch (error) {
      console.error('Error adding user to organization:', error);
      throw error;
    }
  },

  // Get pending user invitations for organization
  async getPendingInvitations(organizationId: string) {
    try {
      const { data, error } = await supabase
        .from('user_tracking')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('is_synced', false)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error fetching pending invitations:', error);
      throw error;
    }
  },

  // Remove pending invitation
  async removePendingInvitation(invitationId: string) {
    try {
      const { error } = await supabase
        .from('user_tracking')
        .delete()
        .eq('id', invitationId);

      if (error) throw error;

      return true;
    } catch (error) {
      console.error('Error removing pending invitation:', error);
      throw error;
    }
  }
};
