import { useState, useEffect, useCallback, useMemo } from 'react';
import type { ServiceEngineer, CreateServiceEngineerRequest, UpdateServiceEngineerRequest, ServiceEngineerFilters } from './service-engineer.type';
import { serviceEngineerService } from './service-engineer.service';

export const useServiceEngineers = (filters?: ServiceEngineerFilters) => {
  const [engineers, setEngineers] = useState<ServiceEngineer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Memoize filters to prevent unnecessary re-renders
  const filtersName = filters?.name;
  const filtersEmail = filters?.email;
  const filtersExpertise = filters?.expertise;
  
  const memoizedFilters = useMemo(() => ({
    ...(filtersName && { name: filtersName }),
    ...(filtersEmail && { email: filtersEmail }),
    ...(filtersExpertise && { expertise: filtersExpertise })
  }), [
    filtersName,
    filtersEmail,
    filtersExpertise
  ]);

  const fetchEngineers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await serviceEngineerService.getAll(memoizedFilters);
      setEngineers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch service engineers');
    } finally {
      setLoading(false);
    }
  }, [memoizedFilters]);

  useEffect(() => {
    fetchEngineers();
  }, [fetchEngineers]);

  return {
    engineers,
    loading,
    error,
    refetch: fetchEngineers
  };
};

export const useServiceEngineer = (id?: string) => {
  const [engineer, setEngineer] = useState<ServiceEngineer | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchEngineer = useCallback(async (engineerId: string) => {
    try {
      setLoading(true);
      const data = await serviceEngineerService.getById(engineerId);
      setEngineer(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch service engineer');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchEngineer(id);
    }
  }, [id, fetchEngineer]);

  const refetch = useCallback(() => {
    if (id) {
      fetchEngineer(id);
    }
  }, [id, fetchEngineer]);

  return {
    engineer,
    loading,
    error,
    refetch
  };
};

export const useServiceEngineerActions = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createEngineer = useCallback(async (engineer: CreateServiceEngineerRequest) => {
    try {
      setLoading(true);
      setError(null);
      const result = await serviceEngineerService.create(engineer);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create service engineer';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateEngineer = useCallback(async (engineer: UpdateServiceEngineerRequest) => {
    try {
      setLoading(true);
      setError(null);
      const result = await serviceEngineerService.update(engineer);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update service engineer';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteEngineer = useCallback(async (id: string) => {
    try {
      setLoading(true);
      setError(null);
      await serviceEngineerService.delete(id);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete service engineer';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    createEngineer,
    updateEngineer,
    deleteEngineer,
    loading,
    error
  };
};

export const useServiceEngineersByExpertise = (expertise: string) => {
  const [engineers, setEngineers] = useState<ServiceEngineer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchEngineers = useCallback(async () => {
    try {
      setLoading(true);
      const data = await serviceEngineerService.getByExpertise(expertise);
      setEngineers(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch service engineers');
    } finally {
      setLoading(false);
    }
  }, [expertise]);

  useEffect(() => {
    if (expertise) {
      fetchEngineers();
    }
  }, [expertise, fetchEngineers]);

  return {
    engineers,
    loading,
    error
  };
};
