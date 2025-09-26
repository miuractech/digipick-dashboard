import { useState, useEffect, useCallback } from 'react';
import { notifications } from '@mantine/notifications';
import { serviceRequestService } from './service_request.service';
import type { 
  ServiceRequest, 
  CreateServiceRequestData, 
  UpdateServiceRequestData, 
  ServiceRequestFilters, 
  PaginationParams, 
  PaginatedResponse 
} from './service_request.type';

export const useServiceRequests = (
  initialFilters: ServiceRequestFilters = {},
  initialPagination: PaginationParams = { page: 1, pageSize: 10 }
) => {
  const [serviceRequests, setServiceRequests] = useState<PaginatedResponse<ServiceRequest>>({
    data: [],
    totalCount: 0,
    page: 1,
    pageSize: 10,
    totalPages: 0
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<ServiceRequestFilters>(initialFilters);
  const [pagination, setPagination] = useState<PaginationParams>(initialPagination);

  const fetchServiceRequests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await serviceRequestService.getServiceRequests(filters, pagination);
      setServiceRequests(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch service requests';
      setError(errorMessage);
      // Only show notification for critical errors, not loading failures
      console.error('Failed to fetch service requests:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, [filters, pagination]);

  useEffect(() => {
    fetchServiceRequests();
  }, [fetchServiceRequests]);

  const updateFilters = useCallback((newFilters: Partial<ServiceRequestFilters>) => {
    setFilters(prev => ({ ...prev, ...newFilters }));
    setPagination(prev => ({ ...prev, page: 1 })); // Reset to first page when filters change
  }, []);

  const updatePagination = useCallback((newPagination: Partial<PaginationParams>) => {
    setPagination(prev => ({ ...prev, ...newPagination }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setPagination({ page: 1, pageSize: 10 });
  }, []);

  const refresh = useCallback(() => {
    fetchServiceRequests();
  }, [fetchServiceRequests]);

  return {
    serviceRequests,
    loading,
    error,
    filters,
    pagination,
    updateFilters,
    updatePagination,
    clearFilters,
    refresh
  };
};

export const useServiceRequest = (id?: string) => {
  const [serviceRequest, setServiceRequest] = useState<ServiceRequest | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchServiceRequest = useCallback(async (serviceRequestId: string) => {
    setLoading(true);
    setError(null);
    try {
      const result = await serviceRequestService.getServiceRequestById(serviceRequestId);
      setServiceRequest(result);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch service request';
      setError(errorMessage);
      console.error('Failed to fetch service request:', errorMessage);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (id) {
      fetchServiceRequest(id);
    }
  }, [id, fetchServiceRequest]);

  return {
    serviceRequest,
    loading,
    error,
    refresh: () => id && fetchServiceRequest(id)
  };
};

export const useServiceRequestActions = () => {
  const [loading, setLoading] = useState(false);

  const createServiceRequest = useCallback(async (data: CreateServiceRequestData): Promise<ServiceRequest> => {
    setLoading(true);
    try {
      const result = await serviceRequestService.createServiceRequest(data);
      notifications.show({
        title: 'Success',
        message: 'Service request created successfully',
        color: 'green'
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create service request';
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateServiceRequest = useCallback(async (data: UpdateServiceRequestData): Promise<ServiceRequest> => {
    setLoading(true);
    try {
      const result = await serviceRequestService.updateServiceRequest(data);
      notifications.show({
        title: 'Success',
        message: 'Service request updated successfully',
        color: 'green'
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update service request';
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);


  const assignServiceEngineer = useCallback(async (serviceRequestId: string, engineerId: string): Promise<ServiceRequest> => {
    setLoading(true);
    try {
      const result = await serviceRequestService.assignServiceEngineer(serviceRequestId, engineerId);
      notifications.show({
        title: 'Success',
        message: 'Service engineer assigned successfully',
        color: 'green'
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to assign service engineer';
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateStatus = useCallback(async (id: string, status: 'pending' | 'completed' | 'cancelled'): Promise<ServiceRequest> => {
    setLoading(true);
    try {
      const result = await serviceRequestService.updateServiceRequestStatus(id, status);
      notifications.show({
        title: 'Success',
        message: 'Service request status updated successfully',
        color: 'green'
      });
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to update status';
      notifications.show({
        title: 'Error',
        message: errorMessage,
        color: 'red'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    createServiceRequest,
    updateServiceRequest,
    assignServiceEngineer,
    updateStatus
  };
};

export const useServiceRequestExport = () => {
  const [loading, setLoading] = useState(false);

  const exportToExcel = useCallback(async (filters: ServiceRequestFilters = {}) => {
    setLoading(true);
    try {
      const data = await serviceRequestService.exportToExcel(filters);
      
      // Import the Excel library dynamically
      const XLSX = await import('xlsx');
      
      // Prepare data for Excel export
      const excelData = data.map(request => ({
        'Ticket No': request.ticket_no,
        'Product': request.product,
        'Serial No': request.serial_no,
        'Service Type': request.service_type,
        'Service Details': request.service_details,
        'Organization': request.organization?.name || '',
        'Device': request.device?.device_name || '',
        'Service Engineer': request.engineer?.name || 'Not Assigned',
        'Status': request.status,
        'Date of Request': new Date(request.date_of_request).toLocaleDateString(),
        'Date of Service': request.date_of_service ? new Date(request.date_of_service).toLocaleDateString() : '',
        'Mode of Service': request.mode_of_service || '',
        'Engineer Comments': request.engineer_comments || '',
        'Payment Details': request.payment_details || ''
      }));

      // Create workbook and worksheet
      const workbook = XLSX.utils.book_new();
      const worksheet = XLSX.utils.json_to_sheet(excelData);
      
      // Add worksheet to workbook
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Service Requests');
      
      // Generate filename with timestamp and filter info
      const timestamp = new Date().toISOString().split('T')[0];
      const hasFilters = Object.values(filters).some(value => value !== undefined && value !== '');
      const filterSuffix = hasFilters ? '_filtered' : '';
      const filename = `service_requests${filterSuffix}_${timestamp}.xlsx`;
      
      // Save file
      XLSX.writeFile(workbook, filename);
      
      // Show success notification with filter info
      const filterInfo = hasFilters ? ' (with current filters applied)' : '';
      const limitInfo = data.length === 500 ? ' (limited to 500 records)' : '';
      
      notifications.show({
        title: 'Export Complete',
        message: `${data.length} service requests exported${filterInfo}${limitInfo} to ${filename}`,
        color: 'green'
      });
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to export service requests';
      notifications.show({
        title: 'Export Failed',
        message: errorMessage,
        color: 'red'
      });
      throw err;
    } finally {
      setLoading(false);
    }
  }, []);

  return {
    loading,
    exportToExcel
  };
};
