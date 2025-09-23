export interface Device {
  id: string;
  company_id: string;
  device_name: string;
  amc_id?: string;
  mac_address?: string;
  make?: string;
  model?: string;
  serial_number?: string;
  purchase_date?: string | null;
  warranty_expiry_date?: string | null;
  amc_start_date?: string | null;
  amc_end_date?: string | null;
  created_at: string;
  updated_at: string;
}

export interface CreateDeviceData {
  company_id: string;
  device_name: string;
  amc_id?: string;
  mac_address?: string;
  make?: string;
  model?: string;
  serial_number?: string;
  purchase_date?: string | null;
  warranty_expiry_date?: string | null;
  amc_start_date?: string | null;
  amc_end_date?: string | null;
}

export interface UpdateDeviceData extends Partial<Omit<CreateDeviceData, 'company_id'>> {
  id: string;
}

export interface DeviceFilters {
  search?: string;
  device_name?: string;
  amc_id?: string;
  mac_address?: string;
  make?: string;
  model?: string;
  company_id?: string;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedResponse<T> {
  data: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
