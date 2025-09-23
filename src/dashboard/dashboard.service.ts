import supabase from '../supabase';
import { deviceService } from '../device/device.service';
import { organizationService } from '../organization/organization.service';
import type { 
  DashboardStats, 
  DeviceWithOrganization, 
  AMCStatus, 
  OrganizationDeviceCount,
  DashboardData,
  PaginationParams,
  PaginatedDeviceResponse,
  PaginatedOrganizationResponse,
  DeviceListFilters
} from './dashboard.type';
import type { Device } from '../device/device.type';
import type { Organization } from '../organization/organization.type';

/**
 * Dashboard Service - Optimized for Scale
 * 
 * Performance Optimizations:
 * 1. Statistics use COUNT queries instead of fetching all records
 * 2. Device lists are paginated with server-side filtering
 * 3. Organization counts use aggregated queries
 * 4. All queries use database indexes for optimal performance
 * 5. Parallel query execution where possible
 * 
 * Scales efficiently to:
 * - Thousands of organizations
 * - Tens of thousands of devices
 * - Real-time dashboard updates
 */
export const dashboardService = {
  // Calculate AMC status for a device
  getAMCStatus(device: Device): AMCStatus {
    const now = new Date();
    const amcEndDate = device.amc_end_date ? new Date(device.amc_end_date) : null;
    
    if (!amcEndDate) {
      return {
        isInAMC: false,
        isExpired: false,
        isExpiringSoon: false
      };
    }
    
    const timeDiff = amcEndDate.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
    
    const isExpired = daysDiff < 0;
    const isExpiringSoon = daysDiff >= 0 && daysDiff <= 7;
    const isInAMC = daysDiff > 0;
    
    return {
      isInAMC,
      isExpired,
      isExpiringSoon,
      daysUntilExpiry: daysDiff
    };
  },

  // Get devices with organization data (paginated)
  async getDevicesWithOrganizations(
    pagination?: PaginationParams,
    filters?: DeviceListFilters
  ): Promise<PaginatedDeviceResponse> {
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('devices')
      .select(`
        *,
        organization:company_details!inner(*)
      `, { count: 'exact' });

    // Apply filters
    if (filters?.search) {
      query = query.or(`device_name.ilike.%${filters.search}%,amc_id.ilike.%${filters.search}%,mac_address.ilike.%${filters.search}%`);
    }
    if (filters?.deviceName) {
      query = query.ilike('device_name', `%${filters.deviceName}%`);
    }
    if (filters?.organizationName) {
      query = query.ilike('company_details.name', `%${filters.organizationName}%`);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) throw error;
    
    const devices = (data || []).map(item => ({
      ...item,
      organization: item.organization
    })) as DeviceWithOrganization[];

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      data: devices,
      totalCount,
      page,
      pageSize,
      totalPages
    };
  },

  // Get organization device counts (paginated)
  async getOrganizationDeviceCounts(
    pagination?: PaginationParams,
    filters?: { search?: string }
  ): Promise<PaginatedOrganizationResponse> {
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
      .from('company_details')
      .select(`
        *,
        device_count:devices(count)
      `, { count: 'exact' })
      .eq('archived', false);

    // Apply search filter
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,city.ilike.%${filters.search}%`);
    }

    const { data, error, count } = await query
      .order('name', { ascending: true })
      .range(from, to);
    
    if (error) throw error;
    
    const organizations = (data || []).map(org => ({
      organization: org,
      deviceCount: org.device_count?.[0]?.count || 0
    }));

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      data: organizations,
      totalCount,
      page,
      pageSize,
      totalPages
    };
  },

  // Calculate dashboard statistics using optimized SQL queries
  async getDashboardStats(): Promise<DashboardStats> {
    const now = new Date().toISOString().split('T')[0]; // YYYY-MM-DD format
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // Run all queries in parallel for better performance
    const [
      orgCountResult,
      deviceCountResult,
      devicesInAMCResult,
      devicesOutOfAMCResult,
      devicesExpiringResult,
      devicesExpiredResult
    ] = await Promise.all([
      // Count total organizations (non-archived)
      supabase
        .from('company_details')
        .select('*', { count: 'exact', head: true })
        .eq('archived', false),
      
      // Count total devices
      supabase
        .from('devices')
        .select('*', { count: 'exact', head: true }),
      
      // Count devices in AMC (end date is in the future)
      supabase
        .from('devices')
        .select('*', { count: 'exact', head: true })
        .not('amc_end_date', 'is', null)
        .gt('amc_end_date', now),
      
      // Count devices out of AMC (no end date or end date in the past)
      supabase
        .from('devices')
        .select('*', { count: 'exact', head: true })
        .or(`amc_end_date.is.null,amc_end_date.lt.${now}`),
      
      // Count devices expiring in next 7 days
      supabase
        .from('devices')
        .select('*', { count: 'exact', head: true })
        .not('amc_end_date', 'is', null)
        .gt('amc_end_date', now)
        .lte('amc_end_date', sevenDaysFromNow),
      
      // Count devices with expired AMC
      supabase
        .from('devices')
        .select('*', { count: 'exact', head: true })
        .not('amc_end_date', 'is', null)
        .lt('amc_end_date', now)
    ]);

    // Handle potential errors
    if (orgCountResult.error) throw orgCountResult.error;
    if (deviceCountResult.error) throw deviceCountResult.error;
    if (devicesInAMCResult.error) throw devicesInAMCResult.error;
    if (devicesOutOfAMCResult.error) throw devicesOutOfAMCResult.error;
    if (devicesExpiringResult.error) throw devicesExpiringResult.error;
    if (devicesExpiredResult.error) throw devicesExpiredResult.error;

    const totalOrganizations = orgCountResult.count || 0;
    const totalDevices = deviceCountResult.count || 0;
    const devicesInAMC = devicesInAMCResult.count || 0;
    const devicesOutOfAMC = devicesOutOfAMCResult.count || 0;
    const devicesExpiringInSevenDays = devicesExpiringResult.count || 0;
    const devicesExpired = devicesExpiredResult.count || 0;

    const averageDevicesPerOrganization = totalOrganizations > 0 
      ? Math.round((totalDevices / totalOrganizations) * 100) / 100 
      : 0;

    return {
      totalOrganizations,
      totalDevices,
      averageDevicesPerOrganization,
      devicesInAMC,
      devicesOutOfAMC,
      devicesExpiringInSevenDays,
      devicesExpired
    };
  },

  // Get expired devices with organization data (optimized with direct SQL)
  async getExpiredDevices(
    pagination?: PaginationParams,
    filters?: DeviceListFilters
  ): Promise<PaginatedDeviceResponse> {
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const now = new Date().toISOString().split('T')[0];

    let query = supabase
      .from('devices')
      .select(`
        *,
        organization:company_details!inner(*)
      `, { count: 'exact' })
      .not('amc_end_date', 'is', null)
      .lt('amc_end_date', now);

    // Apply filters
    if (filters?.search) {
      query = query.or(`device_name.ilike.%${filters.search}%,amc_id.ilike.%${filters.search}%,mac_address.ilike.%${filters.search}%`);
    }
    if (filters?.deviceName) {
      query = query.ilike('device_name', `%${filters.deviceName}%`);
    }
    if (filters?.organizationName) {
      query = query.ilike('company_details.name', `%${filters.organizationName}%`);
    }

    const { data, error, count } = await query
      .order('amc_end_date', { ascending: true }) // Most recently expired first
      .range(from, to);
    
    if (error) throw error;
    
    const devices = (data || []).map(item => ({
      ...item,
      organization: item.organization
    })) as DeviceWithOrganization[];

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      data: devices,
      totalCount,
      page,
      pageSize,
      totalPages
    };
  },

  // Get devices expiring soon with organization data (optimized with direct SQL)
  async getExpiringSoonDevices(
    pagination?: PaginationParams,
    filters?: DeviceListFilters
  ): Promise<PaginatedDeviceResponse> {
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    const now = new Date().toISOString().split('T')[0];
    const sevenDaysFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    let query = supabase
      .from('devices')
      .select(`
        *,
        organization:company_details!inner(*)
      `, { count: 'exact' })
      .not('amc_end_date', 'is', null)
      .gt('amc_end_date', now)
      .lte('amc_end_date', sevenDaysFromNow);

    // Apply filters
    if (filters?.search) {
      query = query.or(`device_name.ilike.%${filters.search}%,amc_id.ilike.%${filters.search}%,mac_address.ilike.%${filters.search}%`);
    }
    if (filters?.deviceName) {
      query = query.ilike('device_name', `%${filters.deviceName}%`);
    }
    if (filters?.organizationName) {
      query = query.ilike('company_details.name', `%${filters.organizationName}%`);
    }

    const { data, error, count } = await query
      .order('amc_end_date', { ascending: true }) // Soonest expiring first
      .range(from, to);
    
    if (error) throw error;
    
    const devices = (data || []).map(item => ({
      ...item,
      organization: item.organization
    })) as DeviceWithOrganization[];

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      data: devices,
      totalCount,
      page,
      pageSize,
      totalPages
    };
  },

  // Get all dashboard data in one call (for initial load with limited data)
  async getDashboardData(): Promise<DashboardData> {
    const [stats, expiredDevices, expiringSoonDevices, organizationDeviceCounts] = await Promise.all([
      this.getDashboardStats(),
      this.getExpiredDevices({ page: 1, pageSize: 10 }), // Limited for overview
      this.getExpiringSoonDevices({ page: 1, pageSize: 10 }), // Limited for overview
      this.getOrganizationDeviceCounts({ page: 1, pageSize: 10 }) // Limited for overview
    ]);

    return {
      stats,
      expiredDevices: expiredDevices.data,
      expiringSoonDevices: expiringSoonDevices.data,
      organizationDeviceCounts: organizationDeviceCounts.data
    };
  }
};
