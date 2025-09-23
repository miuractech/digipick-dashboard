
import { Container, Title, Stack, Alert, Space, Tabs } from '@mantine/core';
import { IconInfoCircle, IconAlertTriangle, IconCalendarX } from '@tabler/icons-react';
import { 
  useDashboardStats,
  usePaginatedExpiredDevices,
  usePaginatedExpiringSoonDevices
} from '../dashboard/dashboard.hook';
import { 
  DashboardStatsGrid,
  PaginatedDeviceTable
} from '../dashboard/dashboard_component.service';

export default function Dashboard() {
  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats } = useDashboardStats();
  
  // Paginated hooks for device lists
  const expiredDevicesHook = usePaginatedExpiredDevices(1, 20);
  const expiringSoonDevicesHook = usePaginatedExpiringSoonDevices(1, 20);

  if (statsError) {
    return (
      <Container size="xl" py="xl">
        <Alert variant="light" color="red" icon={<IconInfoCircle size={16} />}>
          Error loading dashboard data: {statsError}
        </Alert>
      </Container>
    );
  }

  return (
    <Container size="xl" py="xl">
      <Stack gap="xl">
        <Title order={1}>Dashboard</Title>
        
        {/* Statistics Grid */}
        <DashboardStatsGrid 
          stats={stats || {
            totalOrganizations: 0,
            totalDevices: 0,
            averageDevicesPerOrganization: 0,
            devicesInAMC: 0,
            devicesOutOfAMC: 0,
            devicesExpiringInSevenDays: 0,
            devicesExpired: 0
          }}
          loading={statsLoading}
          onRefresh={refetchStats}
        />

        <Space h="md" />

        {/* Tabbed Interface with Pagination and Filters */}
        <Tabs defaultValue="expiring" variant="outline">
          <Tabs.List>
            <Tabs.Tab 
              value="expiring" 
              leftSection={<IconAlertTriangle size={16} />}
              color="orange"
            >
              Devices Expiring Soon ({stats?.devicesExpiringInSevenDays || 0})
            </Tabs.Tab>
            <Tabs.Tab 
              value="expired" 
              leftSection={<IconCalendarX size={16} />}
              color="red"
            >
              Expired Devices ({stats?.devicesExpired || 0})
            </Tabs.Tab>
          </Tabs.List>

          <Tabs.Panel value="expiring" pt="md">
            <PaginatedDeviceTable
              data={expiringSoonDevicesHook.data}
              loading={expiringSoonDevicesHook.loading}
              title="Devices Expiring in Next 7 Days"
              emptyMessage="No devices are expiring in the next 7 days."
              filters={expiringSoonDevicesHook.filters}
              onFiltersChange={expiringSoonDevicesHook.updateFilters}
              onPageChange={expiringSoonDevicesHook.goToPage}
            />
          </Tabs.Panel>

          <Tabs.Panel value="expired" pt="md">
            <PaginatedDeviceTable
              data={expiredDevicesHook.data}
              loading={expiredDevicesHook.loading}
              title="Devices with Expired AMC"
              emptyMessage="No devices have expired AMC."
              filters={expiredDevicesHook.filters}
              onFiltersChange={expiredDevicesHook.updateFilters}
              onPageChange={expiredDevicesHook.goToPage}
            />
          </Tabs.Panel>

        </Tabs>
      </Stack>
    </Container>
  );
}