import supabase from '../supabase';
import type { 
  OrganizationUser, 
  CreateUserTrackingData, 
  UpdateUserDevicesData,
  USER_TYPES
} from './user.type';

export const userService = {
  // Get users for a specific organization from both user_role and user_tracking tables
  async getOrganizationUsers(
    organizationId: string, 
    filters: { search?: string } = {},
    pagination: { page?: number; pageSize?: number } = {}
  ) {
    try {
      console.log(`Getting organization users for organizationId: ${organizationId}`);
      
      // First, let's check if user_tracking has any data
      const { data: trackingData, error: trackingError } = await supabase
        .from('user_tracking')
        .select('*')
        .eq('organization_id', organizationId);

      console.log('User tracking data:', trackingData, 'Error:', trackingError);

      // If no user_tracking data, fall back to user_role for existing users
      if (!trackingData || trackingData.length === 0) {
        console.log('No user tracking data found, falling back to user_role table');
        
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

        // Apply search filter for user_role fallback
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

        // Transform user_role data to match OrganizationUser interface
        const users: OrganizationUser[] = (data || []).map((item: any) => ({
          ...item.user,
          user_role: {
            id: item.id,
            user_id: item.user_id,
            organization_id: item.organization_id,
            user_type: item.user_type as USER_TYPES,
            devices: item.devices,
            created_at: item.created_at,
            updated_at: item.updated_at
          },
          tracking_info: {
            username: null,
            is_synced: true,
            tracking_id: item.id
          }
        }));

        return {
          users,
          totalCount: count || 0,
          totalPages: Math.ceil((count || 0) / pageSize)
        };
      }

      // Use user_tracking data (new approach) - include pending invitations
      let query = supabase
        .from('user_tracking')
        .select(`
          *,
          user:users!user_tracking_user_id_fkey (
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
        .eq('organization_id', organizationId)
        .order('created_at', { ascending: false });

      // Apply search filter
      if (filters.search) {
        query = query.or(`email.ilike.%${filters.search}%,username.ilike.%${filters.search}%,user.full_name.ilike.%${filters.search}%`);
      }

      // Apply pagination
      const page = pagination.page || 1;
      const pageSize = pagination.pageSize || 10;
      const start = (page - 1) * pageSize;
      const end = start + pageSize - 1;
      query = query.range(start, end);

      const { data, error, count } = await query;
      if (error) throw error;

      console.log('Query result:', { data, error, count });

      // Transform data to match OrganizationUser interface
      const users: OrganizationUser[] = (data || []).map((item: any) => {
        // If user is registered (has user_id and user data)
        if (item.user_id && item.user) {
          return {
            ...item.user,
            user_role: {
              id: item.id,
              user_id: item.user_id,
              organization_id: item.organization_id,
              user_type: item.user_type as USER_TYPES,
              devices: item.devices,
              created_at: item.created_at,
              updated_at: item.updated_at
            },
            tracking_info: {
              username: item.username,
              is_synced: item.is_synced,
              tracking_id: item.id
            }
          };
        } 
        // If user is pending (no user_id, only email invitation)
        else {
          return {
            id: item.id, // Use tracking id as user id for pending users
            email: item.email,
            first_name: null,
            last_name: null,
            full_name: item.username,
            phone: null,
            avatar_url: null,
            created_at: item.created_at,
            updated_at: item.updated_at,
            user_role: {
              id: item.id,
              user_id: item.user_id || item.id, // Use tracking id if no user_id
              organization_id: item.organization_id,
              user_type: item.user_type as USER_TYPES,
              devices: item.devices,
              created_at: item.created_at,
              updated_at: item.updated_at
            },
            tracking_info: {
              username: item.username,
              is_synced: item.is_synced,
              tracking_id: item.id
            }
          };
        }
      });

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

  // Remove user from organization (handles both user_tracking and user_role)
  async removeUserFromOrganization(trackingId: string, organizationId: string) {
    try {
      // First try to remove from user_tracking
      let { error } = await supabase
        .from('user_tracking')
        .delete()
        .eq('id', trackingId)
        .eq('organization_id', organizationId);

      // If not found in user_tracking, try user_role (fallback)
      if (error && error.code === 'PGRST116') {
        console.log('Not found in user_tracking, trying user_role');
        const { error: roleError } = await supabase
          .from('user_role')
          .delete()
          .eq('id', trackingId)
          .eq('organization_id', organizationId);
        
        if (roleError) throw roleError;
      } else if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error removing user from organization:', error);
      throw error;
    }
  },

  // Update user's device permissions (handles both user_tracking and user_role)
  async updateUserDevices(data: UpdateUserDevicesData) {
    try {
      // First try to update in user_tracking
      let { error } = await supabase
        .from('user_tracking')
        .update({
          devices: data.devices,
          updated_at: new Date().toISOString()
        })
        .eq('id', data.user_id) // user_id here is actually tracking_id
        .eq('organization_id', data.organization_id);

      // If not found in user_tracking, try user_role (fallback)
      if (error && error.code === 'PGRST116') {
        console.log('Not found in user_tracking, trying user_role');
        const { error: roleError } = await supabase
          .from('user_role')
          .update({
            devices: data.devices,
            updated_at: new Date().toISOString()
          })
          .eq('id', data.user_id)
          .eq('organization_id', data.organization_id);
        
        if (roleError) throw roleError;
      } else if (error) {
        throw error;
      }

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
          username: data.username,
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
  }
};
