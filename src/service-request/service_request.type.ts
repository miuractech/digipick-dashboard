export interface ServiceRequest {
  id: string;
  ticket_no: string;
  product: string;
  serial_no: string;
  service_type: "demo_installation" | "repair" | "service" | "calibration";
  service_details: string;
  organization_id: string;
  device_id: string;
  user_id: string;
  date_of_request: string;
  date_of_service?: string | null;
  uploaded_reference?: string | null;
  uploaded_file_url?: string | null;
  mode_of_service?: string | null;
  service_engineer?: string | null;
  engineer_comments?: string | null;
  status: "pending" | "completed" | "cancelled";
  payment_details?: string | null;
  created_at: string;
  updated_at: string;
  // Related data
  organization?: { id: string; name: string };
  device?: { id: string; device_name: string; serial_number?: string };
  engineer?: { id: string; name: string; email: string };
}

export interface CreateServiceRequestData {
  product: string;
  serial_no: string;
  service_type: "demo_installation" | "repair" | "service" | "calibration";
  service_details: string;
  organization_id: string;
  device_id: string;
  user_id: string;
  date_of_service?: string | null;
  uploaded_reference?: string | null;
  uploaded_file_url?: string | null;
  mode_of_service?: string | null;
}

export interface UpdateServiceRequestData extends Partial<Omit<CreateServiceRequestData, 'organization_id'>> {
  id: string;
  service_engineer?: string | null;
  engineer_comments?: string | null;
  status?: "pending" | "completed" | "cancelled";
  payment_details?: string | null;
}

export interface ServiceRequestFilters {
  search?: string;
  ticket_no?: string;
  service_type?: string;
  status?: string;
  organization_id?: string;
  device_id?: string;
  service_engineer?: string;
  date_from?: string;
  date_to?: string;
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

export const SERVICE_TYPES = [
  { value: 'demo_installation', label: 'Demo Installation' },
  { value: 'repair', label: 'Repair' },
  { value: 'service', label: 'Service' },
  { value: 'calibration', label: 'Calibration' }
] as const;

export const SERVICE_STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'completed', label: 'Completed' },
  { value: 'cancelled', label: 'Cancelled' }
] as const;

export const MODE_OF_SERVICE = [
  { value: 'on-site', label: 'On-site' },
  { value: 'remote', label: 'Remote' }
] as const;
  