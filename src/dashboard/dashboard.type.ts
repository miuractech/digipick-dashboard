import { Device } from '../device/device.type';
import { Organization } from '../organization/organization.type';

export interface DashboardStats {
  totalOrganizations: number;
  totalDevices: number;
  averageDevicesPerOrganization: number;
  devicesInAMC: number;
  devicesOutOfAMC: number;
  devicesExpiringInSevenDays: number;
  devicesExpired: number;
}

export interface DeviceWithOrganization extends Device {
  organization: Organization;
}

export interface AMCStatus {
  isInAMC: boolean;
  isExpired: boolean;
  isExpiringSoon: boolean; // within 7 days
  daysUntilExpiry?: number;
}

export interface OrganizationDeviceCount {
  organization: Organization;
  deviceCount: number;
}

export interface PaginationParams {
  page: number;
  pageSize: number;
}

export interface PaginatedDeviceResponse {
  data: DeviceWithOrganization[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface PaginatedOrganizationResponse {
  data: OrganizationDeviceCount[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface DeviceListFilters {
  search?: string;
  organizationName?: string;
  deviceName?: string;
}

export interface DashboardData {
  stats: DashboardStats;
  expiredDevices: DeviceWithOrganization[];
  expiringSoonDevices: DeviceWithOrganization[];
  organizationDeviceCounts: OrganizationDeviceCount[];
}
