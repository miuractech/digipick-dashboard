import { useState, useEffect } from 'react';
import { deviceService } from './device.service';
import type { Device, CreateDeviceData, UpdateDeviceData, DeviceFilters, PaginationParams } from './device.type';

export function useDevices(filters?: DeviceFilters) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await deviceService.getAll(filters);
      setDevices(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [JSON.stringify(filters)]);

  return {
    devices,
    loading,
    error,
    refetch: fetchDevices
  };
}

export function useDevice(id?: string) {
  const [device, setDevice] = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevice = async () => {
    if (!id) {
      setDevice(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      const data = await deviceService.getById(id);
      setDevice(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevice();
  }, [id]);

  return {
    device,
    loading,
    error,
    refetch: fetchDevice
  };
}

export function useCompanyDevices(companyId?: string, filters?: Omit<DeviceFilters, 'company_id'>, pagination?: PaginationParams) {
  const [devices, setDevices] = useState<Device[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDevices = async () => {
    if (!companyId) {
      setDevices([]);
      setTotalCount(0);
      setTotalPages(0);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);
      
      const deviceFilters = { ...filters, company_id: companyId };
      const result = await deviceService.getPaginated(deviceFilters, pagination);
      
      setDevices(result.data);
      setTotalCount(result.totalCount);
      setTotalPages(result.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
  }, [companyId, JSON.stringify(filters), JSON.stringify(pagination)]);

  return {
    devices,
    totalCount,
    totalPages,
    loading,
    error,
    refetch: fetchDevices
  };
}

export function useDeviceMutations() {
  const [loading, setLoading] = useState(false);

  const createDevice = async (deviceData: CreateDeviceData): Promise<Device | null> => {
    try {
      setLoading(true);
      const device = await deviceService.create(deviceData);
      return device;
    } catch (err) {
      console.error('Error creating device:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const updateDevice = async (updateData: UpdateDeviceData): Promise<Device | null> => {
    try {
      setLoading(true);
      const device = await deviceService.update(updateData);
      return device;
    } catch (err) {
      console.error('Error updating device:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const deleteDevice = async (id: string): Promise<boolean> => {
    try {
      setLoading(true);
      await deviceService.delete(id);
      return true;
    } catch (err) {
      console.error('Error deleting device:', err);
      return false;
    } finally {
      setLoading(false);
    }
  };

  const archiveDevice = async (id: string): Promise<Device | null> => {
    try {
      setLoading(true);
      const device = await deviceService.archive(id);
      return device;
    } catch (err) {
      console.error('Error archiving device:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const unarchiveDevice = async (id: string): Promise<Device | null> => {
    try {
      setLoading(true);
      const device = await deviceService.unarchive(id);
      return device;
    } catch (err) {
      console.error('Error unarchiving device:', err);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return {
    createDevice,
    updateDevice,
    deleteDevice,
    archiveDevice,
    unarchiveDevice,
    loading
  };
}
