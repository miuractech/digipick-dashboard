import { 
  Card, 
  Text, 
  Group, 
  Stack, 
  Badge, 
  Table, 
  Tabs, 
  ThemeIcon, 
  SimpleGrid,
  Loader,
  Alert,
  ActionIcon,
  Tooltip,
  Pagination,
  TextInput,
  Button,
  Flex
} from '@mantine/core';
import { 
  IconBuilding, 
  IconDevices, 
  IconShield, 
  IconShieldOff, 
  IconAlertTriangle, 
  IconCalendarX,
  IconRefresh,
  IconEye,
  IconSearch,
  IconFilter
} from '@tabler/icons-react';
import type { 
  DashboardStats, 
  DeviceWithOrganization, 
  OrganizationDeviceCount,
  PaginatedDeviceResponse,
  PaginatedOrganizationResponse,
  DeviceListFilters
} from './dashboard.type';

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

export function StatsCard({ title, value, icon, color }: StatsCardProps) {
  return (
    <Card withBorder p="md" radius="md">
      <Group justify="apart">
        <div>
          <Text c="dimmed" size="sm" fw={500} tt="uppercase">
            {title}
          </Text>
          <Text fw={700} size="xl">
            {value}
          </Text>
        </div>
        <ThemeIcon color={color} variant="light" size={38} radius="md">
          {icon}
        </ThemeIcon>
      </Group>
    </Card>
  );
}

interface DashboardStatsGridProps {
  stats: DashboardStats;
  loading: boolean;
  onRefresh: () => void;
}

export function DashboardStatsGrid({ stats, loading, onRefresh }: DashboardStatsGridProps) {
  if (loading) {
    return (
      <Card withBorder p="xl" radius="md">
        <Group justify="center">
          <Loader size="lg" />
          <Text>Loading statistics...</Text>
        </Group>
      </Card>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between">
        <Text size="xl" fw={700}>Dashboard Statistics</Text>
        <Tooltip label="Refresh data">
          <ActionIcon variant="light" onClick={onRefresh} loading={loading}>
            <IconRefresh size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>
      
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="md">
        <StatsCard
          title="Total Organizations"
          value={stats.totalOrganizations}
          icon={<IconBuilding size={24} />}
          color="blue"
        />
        <StatsCard
          title="Total Devices"
          value={stats.totalDevices}
          icon={<IconDevices size={24} />}
          color="green"
        />
        <StatsCard
          title="Avg Devices/Org"
          value={stats.averageDevicesPerOrganization}
          icon={<IconDevices size={24} />}
          color="cyan"
        />
        <StatsCard
          title="Devices in AMC"
          value={stats.devicesInAMC}
          icon={<IconShield size={24} />}
          color="teal"
        />
      </SimpleGrid>
      
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 3 }} spacing="md">
        <StatsCard
          title="Devices out of AMC"
          value={stats.devicesOutOfAMC}
          icon={<IconShieldOff size={24} />}
          color="red"
        />
        <StatsCard
          title="Expiring in 7 Days"
          value={stats.devicesExpiringInSevenDays}
          icon={<IconAlertTriangle size={24} />}
          color="orange"
        />
        <StatsCard
          title="AMC Expired"
          value={stats.devicesExpired}
          icon={<IconCalendarX size={24} />}
          color="red"
        />
      </SimpleGrid>
    </Stack>
  );
}

interface DeviceListTableProps {
  devices: DeviceWithOrganization[];
  loading: boolean;
  title: string;
  emptyMessage: string;
}

export function DeviceListTable({ devices, loading, title, emptyMessage }: DeviceListTableProps) {
  if (loading) {
    return (
      <Card withBorder p="xl" radius="md">
        <Group justify="center">
          <Loader size="md" />
          <Text>Loading {title.toLowerCase()}...</Text>
        </Group>
      </Card>
    );
  }

  if (devices.length === 0) {
    return (
      <Card withBorder p="xl" radius="md">
        <Text ta="center" c="dimmed">
          {emptyMessage}
        </Text>
      </Card>
    );
  }

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysUntilExpiry = (endDate: string | null | undefined) => {
    if (!endDate) return null;
    const now = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Card withBorder radius="md">
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Device Name</Table.Th>
            <Table.Th>Organization</Table.Th>
            <Table.Th>AMC ID</Table.Th>
            <Table.Th>AMC End Date</Table.Th>
            <Table.Th>Status</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {devices.map((device) => {
            const daysUntilExpiry = getDaysUntilExpiry(device.amc_end_date);
            let statusBadge;
            
            if (daysUntilExpiry === null) {
              statusBadge = <Badge color="gray">No AMC</Badge>;
            } else if (daysUntilExpiry < 0) {
              statusBadge = <Badge color="red">Expired ({Math.abs(daysUntilExpiry)} days ago)</Badge>;
            } else if (daysUntilExpiry <= 7) {
              statusBadge = <Badge color="orange">Expires in {daysUntilExpiry} days</Badge>;
            } else {
              statusBadge = <Badge color="green">Active</Badge>;
            }

            return (
              <Table.Tr key={device.id}>
                <Table.Td>
                  <Text fw={500}>{device.device_name}</Text>
                  {device.make && device.model && (
                    <Text size="xs" c="dimmed">{device.make} {device.model}</Text>
                  )}
                </Table.Td>
                <Table.Td>
                  <Text>{device.organization.name}</Text>
                  {device.organization.city && (
                    <Text size="xs" c="dimmed">{device.organization.city}</Text>
                  )}
                </Table.Td>
                <Table.Td>
                  {device.amc_id ? (
                    <Text>{device.amc_id}</Text>
                  ) : (
                    <Text c="dimmed">Not set</Text>
                  )}
                </Table.Td>
                <Table.Td>
                  <Text>{formatDate(device.amc_end_date)}</Text>
                </Table.Td>
                <Table.Td>
                  {statusBadge}
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
      </Table>
    </Card>
  );
}

interface AMCDeviceTabsProps {
  expiredDevices: DeviceWithOrganization[];
  expiringSoonDevices: DeviceWithOrganization[];
  loading: boolean;
}

export function AMCDeviceTabs({ expiredDevices, expiringSoonDevices, loading }: AMCDeviceTabsProps) {
  return (
    <Tabs defaultValue="expiring" variant="outline">
      <Tabs.List>
        <Tabs.Tab 
          value="expiring" 
          leftSection={<IconAlertTriangle size={16} />}
          color="orange"
        >
          Expiring Soon ({expiringSoonDevices.length})
        </Tabs.Tab>
        <Tabs.Tab 
          value="expired" 
          leftSection={<IconCalendarX size={16} />}
          color="red"
        >
          Expired ({expiredDevices.length})
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="expiring" pt="md">
        <DeviceListTable
          devices={expiringSoonDevices}
          loading={loading}
          title="Devices Expiring Soon"
          emptyMessage="No devices are expiring in the next 7 days."
        />
      </Tabs.Panel>

      <Tabs.Panel value="expired" pt="md">
        <DeviceListTable
          devices={expiredDevices}
          loading={loading}
          title="Expired Devices"
          emptyMessage="No devices have expired AMC."
        />
      </Tabs.Panel>
    </Tabs>
  );
}

interface OrganizationDeviceCountsProps {
  counts: OrganizationDeviceCount[];
  loading: boolean;
}

export function OrganizationDeviceCounts({ counts, loading }: OrganizationDeviceCountsProps) {
  if (loading) {
    return (
      <Card withBorder p="xl" radius="md">
        <Group justify="center">
          <Loader size="md" />
          <Text>Loading organization device counts...</Text>
        </Group>
      </Card>
    );
  }

  if (counts.length === 0) {
    return (
      <Card withBorder p="xl" radius="md">
        <Text ta="center" c="dimmed">
          No organizations found.
        </Text>
      </Card>
    );
  }

  return (
    <Card withBorder radius="md">
      <Text size="lg" fw={600} mb="md">Device Count by Organization</Text>
      <Table striped highlightOnHover>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Organization</Table.Th>
            <Table.Th>Location</Table.Th>
            <Table.Th>Device Count</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>
          {counts
            .sort((a, b) => b.deviceCount - a.deviceCount)
            .map((item) => (
              <Table.Tr key={item.organization.id}>
                <Table.Td>
                  <Text fw={500}>{item.organization.name}</Text>
                  {item.organization.email && (
                    <Text size="xs" c="dimmed">{item.organization.email}</Text>
                  )}
                </Table.Td>
                <Table.Td>
                  {item.organization.city ? (
                    <Text>{item.organization.city}{item.organization.state ? `, ${item.organization.state}` : ''}</Text>
                  ) : (
                    <Text c="dimmed">Not specified</Text>
                  )}
                </Table.Td>
                <Table.Td>
                  <Badge variant="light" size="lg">
                    {item.deviceCount}
                  </Badge>
                </Table.Td>
              </Table.Tr>
            ))}
        </Table.Tbody>
      </Table>
    </Card>
  );
}

// Paginated Device Table Component
interface PaginatedDeviceTableProps {
  data: PaginatedDeviceResponse | null;
  loading: boolean;
  title: string;
  emptyMessage: string;
  filters: DeviceListFilters;
  onFiltersChange: (filters: DeviceListFilters) => void;
  onPageChange: (page: number) => void;
}

export function PaginatedDeviceTable({
  data,
  loading,
  title,
  emptyMessage,
  filters,
  onFiltersChange,
  onPageChange
}: PaginatedDeviceTableProps) {
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const getDaysUntilExpiry = (endDate: string | null | undefined) => {
    if (!endDate) return null;
    const now = new Date();
    const expiry = new Date(endDate);
    const diffTime = expiry.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  return (
    <Card withBorder radius="md">
      <Stack gap="md">
        {/* Search and Filter Controls */}
        <Group justify="space-between">
          <Text size="lg" fw={600}>{title}</Text>
          <Group>
            <TextInput
              placeholder="Search devices..."
              leftSection={<IconSearch size={16} />}
              value={filters.search || ''}
              onChange={(e) => onFiltersChange({ ...filters, search: e.target.value })}
              w={200}
            />
            <TextInput
              placeholder="Filter by organization..."
              leftSection={<IconFilter size={16} />}
              value={filters.organizationName || ''}
              onChange={(e) => onFiltersChange({ ...filters, organizationName: e.target.value })}
              w={200}
            />
          </Group>
        </Group>

        {loading ? (
          <Group justify="center" py="xl">
            <Loader size="md" />
            <Text>Loading devices...</Text>
          </Group>
        ) : !data || data.data.length === 0 ? (
          <Text ta="center" c="dimmed" py="xl">
            {emptyMessage}
          </Text>
        ) : (
          <>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Device Name</Table.Th>
                  <Table.Th>Organization</Table.Th>
                  <Table.Th>AMC ID</Table.Th>
                  <Table.Th>AMC End Date</Table.Th>
                  <Table.Th>Status</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data.data.map((device) => {
                  const daysUntilExpiry = getDaysUntilExpiry(device.amc_end_date);
                  let statusBadge;
                  
                  if (daysUntilExpiry === null) {
                    statusBadge = <Badge color="gray">No AMC</Badge>;
                  } else if (daysUntilExpiry < 0) {
                    statusBadge = <Badge color="red">Expired ({Math.abs(daysUntilExpiry)} days ago)</Badge>;
                  } else if (daysUntilExpiry <= 7) {
                    statusBadge = <Badge color="orange">Expires in {daysUntilExpiry} days</Badge>;
                  } else {
                    statusBadge = <Badge color="green">Active</Badge>;
                  }

                  return (
                    <Table.Tr key={device.id}>
                      <Table.Td>
                        <Text fw={500}>{device.device_name}</Text>
                        {device.make && device.model && (
                          <Text size="xs" c="dimmed">{device.make} {device.model}</Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Text>{device.organization.name}</Text>
                        {device.organization.city && (
                          <Text size="xs" c="dimmed">{device.organization.city}</Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        {device.amc_id ? (
                          <Text>{device.amc_id}</Text>
                        ) : (
                          <Text c="dimmed">Not set</Text>
                        )}
                      </Table.Td>
                      <Table.Td>
                        <Text>{formatDate(device.amc_end_date)}</Text>
                      </Table.Td>
                      <Table.Td>
                        {statusBadge}
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
            </Table>

            {/* Pagination */}
            <Group justify="space-between" mt="md">
              <Text size="sm" c="dimmed">
                Showing {((data.page - 1) * data.pageSize) + 1} to {Math.min(data.page * data.pageSize, data.totalCount)} of {data.totalCount} devices
              </Text>
              <Pagination
                value={data.page}
                onChange={onPageChange}
                total={data.totalPages}
                size="sm"
              />
            </Group>
          </>
        )}
      </Stack>
    </Card>
  );
}

// Paginated Organization Table Component
interface PaginatedOrganizationTableProps {
  data: PaginatedOrganizationResponse | null;
  loading: boolean;
  search: string;
  onSearchChange: (search: string) => void;
  onPageChange: (page: number) => void;
}

export function PaginatedOrganizationTable({
  data,
  loading,
  search,
  onSearchChange,
  onPageChange
}: PaginatedOrganizationTableProps) {
  return (
    <Card withBorder radius="md">
      <Stack gap="md">
        <Group justify="space-between">
          <Text size="lg" fw={600}>Device Count by Organization</Text>
          <TextInput
            placeholder="Search organizations..."
            leftSection={<IconSearch size={16} />}
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            w={250}
          />
        </Group>

        {loading ? (
          <Group justify="center" py="xl">
            <Loader size="md" />
            <Text>Loading organizations...</Text>
          </Group>
        ) : !data || data.data.length === 0 ? (
          <Text ta="center" c="dimmed" py="xl">
            No organizations found.
          </Text>
        ) : (
          <>
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Organization</Table.Th>
                  <Table.Th>Location</Table.Th>
                  <Table.Th>Device Count</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {data.data.map((item) => (
                  <Table.Tr key={item.organization.id}>
                    <Table.Td>
                      <Text fw={500}>{item.organization.name}</Text>
                      {item.organization.email && (
                        <Text size="xs" c="dimmed">{item.organization.email}</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {item.organization.city ? (
                        <Text>{item.organization.city}{item.organization.state ? `, ${item.organization.state}` : ''}</Text>
                      ) : (
                        <Text c="dimmed">Not specified</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Badge variant="light" size="lg">
                        {item.deviceCount}
                      </Badge>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>

            {/* Pagination */}
            <Group justify="space-between" mt="md">
              <Text size="sm" c="dimmed">
                Showing {((data.page - 1) * data.pageSize) + 1} to {Math.min(data.page * data.pageSize, data.totalCount)} of {data.totalCount} organizations
              </Text>
              <Pagination
                value={data.page}
                onChange={onPageChange}
                total={data.totalPages}
                size="sm"
              />
            </Group>
          </>
        )}
      </Stack>
    </Card>
  );
}
