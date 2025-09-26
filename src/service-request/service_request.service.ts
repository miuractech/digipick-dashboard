import supabase from '../supabase';
import type { 
  ServiceRequest, 
  CreateServiceRequestData, 
  UpdateServiceRequestData, 
  ServiceRequestFilters, 
  PaginationParams, 
  PaginatedResponse 
} from './service_request.type';

export class ServiceRequestService {
  
  async getServiceRequests(
    filters: ServiceRequestFilters = {}, 
    pagination: PaginationParams = { page: 1, pageSize: 10 }
  ): Promise<PaginatedResponse<ServiceRequest>> {
    let query = supabase
      .from('service_requests')
      .select(`
        *,
        organization:company_details(id, name),
        device:devices(id, device_name, serial_number)
      `, { count: 'exact' });

    // Apply filters
    if (filters.search) {
      query = query.or(`ticket_no.ilike.%${filters.search}%,product.ilike.%${filters.search}%,service_details.ilike.%${filters.search}%`);
    }
    if (filters.ticket_no) {
      query = query.eq('ticket_no', filters.ticket_no);
    }
    if (filters.service_type) {
      query = query.eq('service_type', filters.service_type);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.organization_id) {
      query = query.eq('organization_id', filters.organization_id);
    }
    if (filters.device_id) {
      query = query.eq('device_id', filters.device_id);
    }
    if (filters.service_engineer) {
      query = query.eq('service_engineer', filters.service_engineer);
    }
    if (filters.date_from) {
      query = query.gte('date_of_request', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('date_of_request', filters.date_to);
    }

    // Apply pagination
    const from = (pagination.page - 1) * pagination.pageSize;
    const to = from + pagination.pageSize - 1;
    
    query = query
      .order('date_of_request', { ascending: false })
      .range(from, to);

    const { data, error, count } = await query;

    if (error) {
      console.error('Supabase error fetching service requests:', error);
      throw new Error(error.message || 'Failed to fetch service requests');
    }

    // Fetch engineer details separately if service_engineer is present
    const serviceRequestsWithEngineers = await this.enrichWithEngineerData(data || []);

    return {
      data: serviceRequestsWithEngineers,
      totalCount: count || 0,
      page: pagination.page,
      pageSize: pagination.pageSize,
      totalPages: Math.ceil((count || 0) / pagination.pageSize)
    };
  }

  async getServiceRequestById(id: string): Promise<ServiceRequest> {
    const { data, error } = await supabase
      .from('service_requests')
      .select(`
        *,
        organization:company_details(id, name),
        device:devices(id, device_name, serial_number)
      `)
      .eq('id', id)
      .single();

    if (error) {
      console.error('Supabase error fetching service request:', error);
      throw new Error(error.message || 'Failed to fetch service request');
    }

    // Enrich with engineer data
    const enrichedData = await this.enrichWithEngineerData([data]);
    return enrichedData[0];
  }

  async createServiceRequest(serviceRequestData: CreateServiceRequestData): Promise<ServiceRequest> {
    // Generate ticket number
    const ticketNo = await this.generateTicketNumber(serviceRequestData.organization_id, serviceRequestData.device_id);
    
    const { data, error } = await supabase
      .from('service_requests')
      .insert({
        ...serviceRequestData,
        ticket_no: ticketNo
      })
      .select(`
        *,
        organization:company_details(id, name),
        device:devices(id, device_name, serial_number)
      `)
      .single();

    if (error) {
      console.error('Supabase error creating service request:', error);
      throw new Error(error.message || 'Failed to create service request');
    }

    // Enrich with engineer data
    const enrichedData = await this.enrichWithEngineerData([data]);
    return enrichedData[0];
  }

  async updateServiceRequest(serviceRequestData: UpdateServiceRequestData): Promise<ServiceRequest> {
    const { id, ...updateData } = serviceRequestData;
    
    const { data, error } = await supabase
      .from('service_requests')
      .update(updateData)
      .eq('id', id)
      .select(`
        *,
        organization:company_details(id, name),
        device:devices(id, device_name, serial_number)
      `)
      .single();

    if (error) {
      console.error('Supabase error updating service request:', error);
      throw new Error(error.message || 'Failed to update service request');
    }

    // Enrich with engineer data
    const enrichedData = await this.enrichWithEngineerData([data]);
    return enrichedData[0];
  }


  async assignServiceEngineer(serviceRequestId: string, engineerId: string): Promise<ServiceRequest> {
    const { data, error } = await supabase
      .from('service_requests')
      .update({ service_engineer: engineerId })
      .eq('id', serviceRequestId)
      .select(`
        *,
        organization:company_details(id, name),
        device:devices(id, device_name, serial_number)
      `)
      .single();

    if (error) {
      console.error('Supabase error assigning service engineer:', error);
      throw new Error(error.message || 'Failed to assign service engineer');
    }

    // Enrich with engineer data
    const enrichedData = await this.enrichWithEngineerData([data]);
    return enrichedData[0];
  }

  async updateServiceRequestStatus(id: string, status: 'pending' | 'completed' | 'cancelled'): Promise<ServiceRequest> {
    const { data, error } = await supabase
      .from('service_requests')
      .update({ status })
      .eq('id', id)
      .select(`
        *,
        organization:company_details(id, name),
        device:devices(id, device_name, serial_number)
      `)
      .single();

    if (error) {
      console.error('Supabase error updating service request status:', error);
      throw new Error(error.message || 'Failed to update service request status');
    }

    // Enrich with engineer data
    const enrichedData = await this.enrichWithEngineerData([data]);
    return enrichedData[0];
  }

  async exportToExcel(filters: ServiceRequestFilters = {}): Promise<ServiceRequest[]> {
    let query = supabase
      .from('service_requests')
      .select(`
        *,
        organization:company_details(id, name),
        device:devices(id, device_name, serial_number)
      `);

    // Apply same filters as getServiceRequests but without pagination
    if (filters.search) {
      query = query.or(`ticket_no.ilike.%${filters.search}%,product.ilike.%${filters.search}%,service_details.ilike.%${filters.search}%`);
    }
    if (filters.ticket_no) {
      query = query.eq('ticket_no', filters.ticket_no);
    }
    if (filters.service_type) {
      query = query.eq('service_type', filters.service_type);
    }
    if (filters.status) {
      query = query.eq('status', filters.status);
    }
    if (filters.organization_id) {
      query = query.eq('organization_id', filters.organization_id);
    }
    if (filters.device_id) {
      query = query.eq('device_id', filters.device_id);
    }
    if (filters.service_engineer) {
      query = query.eq('service_engineer', filters.service_engineer);
    }
    if (filters.date_from) {
      query = query.gte('date_of_request', filters.date_from);
    }
    if (filters.date_to) {
      query = query.lte('date_of_request', filters.date_to);
    }

    // Apply limit of 500 records and order by date
    query = query
      .order('date_of_request', { ascending: false })
      .limit(500);

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error exporting service requests:', error);
      throw new Error(error.message || 'Failed to export service requests');
    }

    // Enrich with engineer data
    return await this.enrichWithEngineerData(data || []);
  }

  private async generateTicketNumber(organizationId: string, deviceId: string): Promise<string> {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    
    // Get organization and device short codes (first 4 chars of ID)
    const orgCode = organizationId.slice(0, 4).toUpperCase();
    const deviceCode = deviceId.slice(0, 4).toUpperCase();
    
    // Get sequential number for today
    const { count } = await supabase
      .from('service_requests')
      .select('*', { count: 'exact', head: true })
      .gte('date_of_request', `${year}-${month}-${day}T00:00:00.000Z`)
      .lt('date_of_request', `${year}-${month}-${day}T23:59:59.999Z`);

    const sequentialNumber = String((count || 0) + 1).padStart(4, '0');
    
    return `${year}-${month}-${day}-${orgCode}-${deviceCode}-${sequentialNumber}`;
  }

  private async enrichWithEngineerData(serviceRequests: Partial<ServiceRequest>[]): Promise<ServiceRequest[]> {
    if (!serviceRequests.length) return [];

    // Get unique engineer IDs
    const engineerIds = [...new Set(
      serviceRequests
        .map(sr => sr.service_engineer)
        .filter(id => id)
    )];

    // Fetch engineer details if we have engineer IDs
    const engineerMap = new Map();
    if (engineerIds.length > 0) {
      const { data: engineers, error } = await supabase
        .from('service_engineers')
        .select('id, name, email')
        .in('id', engineerIds);

      if (!error && engineers) {
        engineers.forEach(eng => {
          engineerMap.set(eng.id, eng);
        });
      }
    }

    // Enrich service requests with engineer data
    return serviceRequests.map(sr => ({
      ...sr,
      engineer: sr.service_engineer ? engineerMap.get(sr.service_engineer) || null : null
    })) as ServiceRequest[];
  }
}

export const serviceRequestService = new ServiceRequestService();
