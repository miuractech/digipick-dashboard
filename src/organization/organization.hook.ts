import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { Organization, CreateOrganizationData, UpdateOrganizationData, OrganizationFilters, PaginationParams, PaginatedResponse } from './organization.type';
import { organizationService } from './organization.service';

// Hook for debounced search
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

export const useOrganizations = (filters?: OrganizationFilters) => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Memoize filters to prevent unnecessary re-renders
  const memoizedFilters = useMemo(() => filters, [filters]);

  const fetchOrganizations = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await organizationService.getAll(memoizedFilters);
      setOrganizations(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch organizations');
    } finally {
      setLoading(false);
    }
  }, [memoizedFilters]);

  useEffect(() => {
    fetchOrganizations();
  }, [fetchOrganizations]);

  return {
    organizations,
    loading,
    error,
    refetch: fetchOrganizations
  };
};

export const usePaginatedOrganizations = (
  filters?: OrganizationFilters,
  pagination?: PaginationParams
) => {
  const [paginatedData, setPaginatedData] = useState<PaginatedResponse<Organization>>({
    data: [],
    totalCount: 0,
    page: 1,
    pageSize: 20,
    totalPages: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Debounce search filters
  const debouncedFilters = useDebounce(filters, 500);
  const memoizedPagination = useMemo(() => pagination, [pagination]);

  const fetchOrganizations = useCallback(async () => {
    // Cancel previous request
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    // Create new abort controller
    abortControllerRef.current = new AbortController();

    try {
      setLoading(true);
      setError(null);
      
      const data = await organizationService.getPaginated(debouncedFilters, memoizedPagination);
      
      // Only update state if request wasn't aborted
      if (!abortControllerRef.current.signal.aborted) {
        setPaginatedData(data);
      }
    } catch (err) {
      if (!abortControllerRef.current.signal.aborted) {
        setError(err instanceof Error ? err.message : 'Failed to fetch organizations');
      }
    } finally {
      if (!abortControllerRef.current.signal.aborted) {
        setLoading(false);
      }
    }
  }, [debouncedFilters, memoizedPagination]);

  useEffect(() => {
    fetchOrganizations();

    // Cleanup function to abort ongoing requests
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchOrganizations]);

  return {
    ...paginatedData,
    loading,
    error,
    refetch: fetchOrganizations
  };
};

export const useOrganization = (id?: string) => {
  const [organization, setOrganization] = useState<Organization | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchOrganization = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      setError(null);
      const data = await organizationService.getById(id);
      setOrganization(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch organization');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchOrganization();
  }, [fetchOrganization]);

  return {
    organization,
    loading,
    error,
    refetch: fetchOrganization
  };
};

export const useOrganizationMutations = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createOrganization = async (data: CreateOrganizationData): Promise<Organization | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await organizationService.create(data);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create organization');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateOrganization = async (data: UpdateOrganizationData): Promise<Organization | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await organizationService.update(data);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update organization');
      return null;
    } finally {
      setLoading(false);
    }
  };


  const archiveOrganization = async (id: string): Promise<Organization | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await organizationService.archive(id);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to archive organization');
      return null;
    } finally {
      setLoading(false);
    }
  };

  const unarchiveOrganization = async (id: string): Promise<Organization | null> => {
    try {
      setLoading(true);
      setError(null);
      const result = await organizationService.unarchive(id);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to unarchive organization');
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createOrganization,
    updateOrganization,
    archiveOrganization,
    unarchiveOrganization,
    loading,
    error
  };
};
