export interface Organization {
  id: string;
  name: string;
  legal_name?: string;
  gst_number?: string;
  pan_number?: string;
  cin_number?: string;
  email?: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country: string;
  archived: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateOrganizationData {
  name: string;
  legal_name?: string;
  gst_number?: string;
  pan_number?: string;
  cin_number?: string;
  email: string;
  phone?: string;
  address_line1?: string;
  address_line2?: string;
  city?: string;
  state?: string;
  postal_code?: string;
  country?: string;
}

export interface UpdateOrganizationData extends Partial<CreateOrganizationData> {
  id: string;
}

export interface OrganizationFilters {
  search?: string;
  name?: string;
  email?: string;
  phone?: string;
  city?: string;
  state?: string;
  country?: string;
  archived?: boolean;
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
