import { useState, useEffect, useCallback } from 'react';
import { useDebouncedValue } from '@mantine/hooks';
import { dashboardService } from './dashboard.service';
import type { 
  DashboardData, 
  DashboardStats, 
  DeviceWithOrganization, 
  OrganizationDeviceCount,
  PaginatedDeviceResponse,
  PaginatedOrganizationResponse,
  DeviceListFilters
} from './dashboard.type';

export function useDashboardData() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const dashboardData = await dashboardService.getDashboardData();
      setData(dashboardData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    data,
    loading,
    error,
    refetch: fetchData
  };
}

export function useDashboardStats() {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);
      const dashboardStats = await dashboardService.getDashboardStats();
      setStats(dashboardStats);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats
  };
}

export function useExpiredDevices() {
  const [devices, setDevices] = useState<DeviceWithOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      const expiredDevices = await dashboardService.getExpiredDevices();
      setDevices(expiredDevices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  return {
    devices,
    loading,
    error,
    refetch: fetchDevices
  };
}

export function useExpiringSoonDevices() {
  const [devices, setDevices] = useState<DeviceWithOrganization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      const expiringSoonDevices = await dashboardService.getExpiringSoonDevices();
      setDevices(expiringSoonDevices);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, []);

  return {
    devices,
    loading,
    error,
    refetch: fetchDevices
  };
}

export function useOrganizationDeviceCounts() {
  const [counts, setCounts] = useState<OrganizationDeviceCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCounts = async () => {
    try {
      setLoading(true);
      setError(null);
      const organizationCounts = await dashboardService.getOrganizationDeviceCounts({ page: 1, pageSize: 10 });
      setCounts(organizationCounts.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCounts();
  }, []);

  return {
    counts,
    loading,
    error,
    refetch: fetchCounts
  };
}

// Paginated hooks for better performance with large datasets

export function usePaginatedExpiredDevices(initialPage = 1, pageSize = 20) {
  const [data, setData] = useState<PaginatedDeviceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DeviceListFilters>({});
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Debounce search to avoid excessive API calls
  const [debouncedFilters] = useDebouncedValue(filters, 500);

  const fetchData = useCallback(async (page: number, currentFilters: DeviceListFilters) => {
    try {
      setLoading(true);
      setError(null);
      const result = await dashboardService.getExpiredDevices({ page, pageSize }, currentFilters);
      setData(result);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchData(currentPage, debouncedFilters);
  }, [fetchData, currentPage, debouncedFilters]);

  const goToPage = (page: number) => {
    fetchData(page, debouncedFilters);
  };

  const updateFilters = (newFilters: DeviceListFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const refetch = () => {
    fetchData(currentPage, debouncedFilters);
  };

  return {
    data,
    loading,
    error,
    currentPage,
    filters,
    goToPage,
    updateFilters,
    refetch
  };
}

export function usePaginatedExpiringSoonDevices(initialPage = 1, pageSize = 20) {
  const [data, setData] = useState<PaginatedDeviceResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<DeviceListFilters>({});
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Debounce search to avoid excessive API calls
  const [debouncedFilters] = useDebouncedValue(filters, 500);

  const fetchData = useCallback(async (page: number, currentFilters: DeviceListFilters) => {
    try {
      setLoading(true);
      setError(null);
      const result = await dashboardService.getExpiringSoonDevices({ page, pageSize }, currentFilters);
      setData(result);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchData(currentPage, debouncedFilters);
  }, [fetchData, currentPage, debouncedFilters]);

  const goToPage = (page: number) => {
    fetchData(page, debouncedFilters);
  };

  const updateFilters = (newFilters: DeviceListFilters) => {
    setFilters(newFilters);
    setCurrentPage(1); // Reset to first page when filtering
  };

  const refetch = () => {
    fetchData(currentPage, debouncedFilters);
  };

  return {
    data,
    loading,
    error,
    currentPage,
    filters,
    goToPage,
    updateFilters,
    refetch
  };
}

export function usePaginatedOrganizationDeviceCounts(initialPage = 1, pageSize = 20) {
  const [data, setData] = useState<PaginatedOrganizationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState<string>('');
  const [currentPage, setCurrentPage] = useState(initialPage);

  // Debounce search to avoid excessive API calls
  const [debouncedSearch] = useDebouncedValue(search, 500);

  const fetchData = useCallback(async (page: number, searchTerm: string) => {
    try {
      setLoading(true);
      setError(null);
      const result = await dashboardService.getOrganizationDeviceCounts(
        { page, pageSize }, 
        searchTerm ? { search: searchTerm } : undefined
      );
      setData(result);
      setCurrentPage(page);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  }, [pageSize]);

  useEffect(() => {
    fetchData(currentPage, debouncedSearch);
  }, [fetchData, currentPage, debouncedSearch]);

  const goToPage = (page: number) => {
    fetchData(page, debouncedSearch);
  };

  const updateSearch = (searchTerm: string) => {
    setSearch(searchTerm);
    setCurrentPage(1); // Reset to first page when searching
  };

  const refetch = () => {
    fetchData(currentPage, debouncedSearch);
  };

  return {
    data,
    loading,
    error,
    currentPage,
    search,
    goToPage,
    updateSearch,
    refetch
  };
}
