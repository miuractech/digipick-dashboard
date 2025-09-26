import { useState, useEffect } from 'react';
import { userService } from './user.service';
import type { 
  OrganizationUser, 
  UserTracking, 
  CreateUserTrackingData, 
  UpdateUserDevicesData 
} from './user.type';

export function useOrganizationUsers(
  organizationId: string,
  filters: { search?: string } = {},
  pagination: { page?: number; pageSize?: number } = {}
) {
  const [users, setUsers] = useState<OrganizationUser[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await userService.getOrganizationUsers(organizationId, filters, pagination);
      setUsers(result.users);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchUsers();
    }
  }, [organizationId, filters.search, pagination.page, pagination.pageSize]);

  return {
    users,
    totalCount,
    totalPages,
    loading,
    error,
    refetch: fetchUsers
  };
}

export function usePendingInvitations(organizationId: string) {
  const [invitations, setInvitations] = useState<UserTracking[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await userService.getPendingInvitations(organizationId);
      setInvitations(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (organizationId) {
      fetchInvitations();
    }
  }, [organizationId]);

  return {
    invitations,
    loading,
    error,
    refetch: fetchInvitations
  };
}

export function useUserMutations() {
  const [loading, setLoading] = useState(false);

  const removeUser = async (userId: string, organizationId: string) => {
    try {
      setLoading(true);
      await userService.removeUserFromOrganization(userId, organizationId);
      return true;
    } catch (error) {
      console.error('Error removing user:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const updateUserDevices = async (data: UpdateUserDevicesData) => {
    try {
      setLoading(true);
      await userService.updateUserDevices(data);
      return true;
    } catch (error) {
      console.error('Error updating user devices:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const addUser = async (data: CreateUserTrackingData) => {
    try {
      setLoading(true);
      await userService.addUserToOrganization(data);
      return true;
    } catch (error) {
      console.error('Error adding user:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const removePendingInvitation = async (invitationId: string) => {
    try {
      setLoading(true);
      await userService.removePendingInvitation(invitationId);
      return true;
    } catch (error) {
      console.error('Error removing invitation:', error);
      return false;
    } finally {
      setLoading(false);
    }
  };

  return {
    removeUser,
    updateUserDevices,
    addUser,
    removePendingInvitation,
    loading
  };
}
