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
  ActionIcon,
  Tooltip,
  Pagination,
  TextInput,
  Modal,
  Button,
  Textarea,
  Divider,
  Code
} from '@mantine/core';
import { useDisclosure, useClipboard } from '@mantine/hooks';
import React, { useState } from 'react';
import { 
  IconBuilding, 
  IconDevices, 
  IconShieldOff, 
  IconAlertTriangle, 
  IconCalendarX,
  IconRefresh,  
  IconSearch,
  IconFilter,
  IconTool,
  IconClock,
  IconCheck,
  IconCalendar,
  IconPhone,
  IconMail,
  IconCopy,
  IconExternalLink
} from '@tabler/icons-react';
import type { 
  DashboardStats, 
  DeviceWithOrganization, 
  OrganizationDeviceCount,
  PaginatedDeviceResponse,
  PaginatedOrganizationResponse,
  DeviceListFilters
} from './dashboard.type';

// Email templates for AMC notifications
const getEmailTemplate = (device: DeviceWithOrganization, isExpired: boolean) => {
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not specified';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const subject = isExpired 
    ? `URGENT: AMC Expired for ${device.device_name} - Renewal Required`
    : `REMINDER: AMC Expiring Soon for ${device.device_name} - Action Required`;

  const content = isExpired 
    ? `Dear ${device.organization.name} Team,

I hope this email finds you well.

This is to inform you that the Annual Maintenance Contract (AMC) for your device has expired and requires immediate attention:

Device Details:
• Device Name: ${device.device_name}
• AMC ID: ${device.amc_id || 'Not specified'}
• Make/Model: ${device.make && device.model ? `${device.make} ${device.model}` : 'Not specified'}
• AMC Expiry Date: ${formatDate(device.amc_end_date)}

Your device is currently not covered under AMC, which means:
- No technical support coverage
- No preventive maintenance services
- Potential warranty void for repairs

To ensure uninterrupted service and support, please contact us immediately to renew your AMC.

Contact Information:
- Phone: [Your Phone Number]
- Email: [Your Email]

We would be happy to discuss renewal options and provide competitive pricing for continued support.

Thank you for your prompt attention to this matter.

Best regards,
[Your Name]
[Your Company]`
    : `Dear ${device.organization.name} Team,

I hope this email finds you well.

This is a friendly reminder that the Annual Maintenance Contract (AMC) for your device is approaching its expiry date:

Device Details:
• Device Name: ${device.device_name}
• AMC ID: ${device.amc_id || 'Not specified'}
• Make/Model: ${device.make && device.model ? `${device.make} ${device.model}` : 'Not specified'}
• AMC Expiry Date: ${formatDate(device.amc_end_date)}

To ensure uninterrupted service and support, we recommend renewing your AMC before the expiry date. This will ensure:
- Continued technical support coverage
- Regular preventive maintenance services
- Priority response for any issues

Contact Information:
- Phone: [Your Phone Number]
- Email: [Your Email]

Please reach out to us at your earliest convenience to discuss renewal options and pricing.

Thank you for your continued trust in our services.

Best regards,
[Your Name]
[Your Company]`;

  return { subject, content };
};

// Contact Modal Component
interface ContactModalProps {
  device: DeviceWithOrganization | null;
  opened: boolean;
  onClose: () => void;
  isExpired?: boolean;
}

export function ContactModal({ device, opened, onClose, isExpired = false }: ContactModalProps) {
  const [emailTemplate, setEmailTemplate] = useState('');
  const [emailSubject, setEmailSubject] = useState('');
  const clipboard = useClipboard({ timeout: 2000 });

  // Update email template when device changes
  React.useEffect(() => {
    if (device) {
      const template = getEmailTemplate(device, isExpired);
      setEmailTemplate(template.content);
      setEmailSubject(template.subject);
    }
  }, [device, isExpired]);

  if (!device) return null;

  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'long',
      year: 'numeric'
    });
  };

  const openEmailClient = () => {
    const mailto = `mailto:${device.organization.email || ''}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailTemplate)}`;
    window.open(mailto, '_self');
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group>
          <IconMail size={20} />
          <Text fw={600}>Contact Organization</Text>
        </Group>
      }
      size="lg"
      centered
    >
      <Stack gap="md">
        {/* Organization Details */}
        <Card withBorder p="md">
          <Stack gap="sm">
            <Text fw={600} size="lg">{device.organization.name}</Text>
            <Group gap="xs">
              <Text fw={500}>Email:</Text>
              {device.organization.email ? (
                <Code>{device.organization.email}</Code>
              ) : (
                <Text c="dimmed">Not available</Text>
              )}
            </Group>
            <Group gap="xs">
              <Text fw={500}>Phone:</Text>
              {device.organization.phone ? (
                <Group gap="xs">
                  <Code>{device.organization.phone}</Code>
                  <ActionIcon
                    variant="light"
                    color="blue"
                    size="sm"
                    onClick={() => window.open(`tel:${device.organization.phone}`, '_self')}
                  >
                    <IconPhone size={14} />
                  </ActionIcon>
                </Group>
              ) : (
                <Text c="dimmed">Not available</Text>
              )}
            </Group>
            {device.organization.city && (
              <Group gap="xs">
                <Text fw={500}>Location:</Text>
                <Text>{device.organization.city}{device.organization.state ? `, ${device.organization.state}` : ''}</Text>
              </Group>
            )}
          </Stack>
        </Card>

        {/* Device Details */}
        <Card withBorder p="md">
          <Stack gap="sm">
            <Text fw={600}>Device Information</Text>
            <Group gap="xs">
              <Text fw={500}>Device:</Text>
              <Text>{device.device_name}</Text>
            </Group>
            <Group gap="xs">
              <Text fw={500}>AMC ID:</Text>
              <Text>{device.amc_id || 'Not set'}</Text>
            </Group>
            <Group gap="xs">
              <Text fw={500}>AMC End Date:</Text>
              <Text c={isExpired ? 'red' : 'orange'}>{formatDate(device.amc_end_date)}</Text>
            </Group>
          </Stack>
        </Card>

        <Divider />

        {/* Email Template */}
        <Stack gap="sm">
          <Group justify="space-between">
            <Text fw={600}>Email Template</Text>
            <Badge color={isExpired ? 'red' : 'orange'}>
              {isExpired ? 'Expired AMC' : 'Expiring Soon'}
            </Badge>
          </Group>

          {/* Email Subject */}
          <TextInput
            label="Subject"
            value={emailSubject}
            onChange={(e) => setEmailSubject(e.target.value)}
            rightSection={
              <ActionIcon
                variant="light"
                onClick={() => clipboard.copy(emailSubject)}
                color={clipboard.copied ? 'green' : 'blue'}
              >
                <IconCopy size={16} />
              </ActionIcon>
            }
          />

          {/* Email Content */}
          <Textarea
            label="Email Content"
            value={emailTemplate}
            onChange={(e) => setEmailTemplate(e.target.value)}
            rows={12}
            rightSection={
              <ActionIcon
                variant="light"
                onClick={() => clipboard.copy(emailTemplate)}
                color={clipboard.copied ? 'green' : 'blue'}
                style={{ marginTop: 8 }}
              >
                <IconCopy size={16} />
              </ActionIcon>
            }
          />

          <Group justify="flex-end" mt="md">
            <Button
              variant="light"
              leftSection={<IconCopy size={16} />}
              onClick={() => clipboard.copy(`Subject: ${emailSubject}\n\n${emailTemplate}`)}
              color={clipboard.copied ? 'green' : 'blue'}
            >
              {clipboard.copied ? 'Copied!' : 'Copy All'}
            </Button>
            
            {device.organization.email && (
              <Button
                leftSection={<IconExternalLink size={16} />}
                onClick={openEmailClient}
              >
                Open in Email Client
              </Button>
            )}
          </Group>
        </Stack>
      </Stack>
    </Modal>
  );
}

interface StatsCardProps {
  title: string;
  value: number | string;
  icon: React.ReactNode;
  color: string;
}

export function StatsCard({ title, value, icon, color }: StatsCardProps) {
  const getBackgroundColor = (color: string) => {
    const colors = {
      blue: '#FFE2E5',
      yellow: '#FFF4DE',
      green:"#DCFCE7",
      cyan: '#e0f2f1',
      teal: '#FFE2E5',
      red: '#FFE2E5',
      orange: '#FFE2E5',
      purple: '#F3E8FF'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  const getIconColor = (color: string) => {
    const colors = {
      blue: '#FA5A7D',
      yellow: '#FF947A',
      green: '#3CD856',
      cyan: '#00acc1',
      teal: '#00796b',
      red: '#FA5A7D',

      orange: '#f57c00',
      purple: '#BF83FF'
    };
    return colors[color as keyof typeof colors] || colors.blue;
  };

  return (
    <Card 
      p="xl" 
      radius="lg" 
      className={`transition-all shadow-none duration-300 cursor-pointer hover:-translate-y-2 hover:scale-[1.01] hover:shadow-2xl`}
      style={{ background: getBackgroundColor(color), borderColor: 'transparent' }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = getIconColor(color);
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'transparent';
      }}
    >
      <Stack gap="lg">
        <ThemeIcon 
          size={60} 
          radius="xl" 
          style={{ 
            backgroundColor: getIconColor(color),
            color: 'white',
            transition: 'all 0.3s ease',
          }}
        >
          {icon}
        </ThemeIcon>
        
        <div>
          <Text 
            size="xl" 
            fw={700} 
            c="dark"
            style={{ 
              transition: 'all 0.3s ease',
            }}
          >
            {value}
          </Text>
          <Text 
            size="sm" 
            fw={500} 
            c="dimmed" 
            mt={4}
            style={{ 
              transition: 'all 0.3s ease',
            }}
          >
            {title}
          </Text>
        </div>
      </Stack>
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
      <Card p="xl">
      <Group justify="space-between">
        <Text size="xl" fw={700}>Analytics</Text>
        <Tooltip label="Refresh data">
          <ActionIcon variant="light" onClick={onRefresh} loading={loading}>
            <IconRefresh size={16} />
          </ActionIcon>
        </Tooltip>
      </Group>
      <br />
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
        <StatsCard
          title="Total Organizations"
          value={stats.totalOrganizations}
          icon={<IconBuilding size={28} />}
          color="green"
        />

        <StatsCard
          title="Total Devices"
          value={stats.totalDevices}
          icon={<IconDevices size={28} />}
          color="yellow"
        />
         <StatsCard
          title="Devices out of AMC"
          value={stats.devicesOutOfAMC}
          icon={<IconShieldOff size={28} />}
          color="red"
        />
         <StatsCard
          title="Expiring in 7 Days"
          value={stats.devicesExpiringInSevenDays}
          icon={<IconAlertTriangle size={28} />}
          color="purple"
        />
      </SimpleGrid>

      {/* Service Request Statistics */}
      <Text size="lg" fw={600} mt="xl" mb="md">Service Request Analytics</Text>
      <SimpleGrid cols={{ base: 1, sm: 2, lg: 4 }} spacing="lg">
        <StatsCard
          title="Total Service Requests"
          value={stats.totalServiceRequests}
          icon={<IconTool size={28} />}
          color="blue"
        />

        <StatsCard
          title="Pending Requests"
          value={stats.pendingServiceRequests}
          icon={<IconClock size={28} />}
          color="orange"
        />

        <StatsCard
          title="Completed Requests"
          value={stats.completedServiceRequests}
          icon={<IconCheck size={28} />}
          color="green"
        />

        <StatsCard
          title="Recent Requests (30 days)"
          value={stats.recentServiceRequests}
          icon={<IconCalendar size={28} />}
          color="cyan"
        />
      </SimpleGrid>
      </Card>
      
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
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceWithOrganization | null>(null);
  const [isExpiredDevice, setIsExpiredDevice] = useState(false);

  const openContactModal = (device: DeviceWithOrganization, isExpired: boolean) => {
    setSelectedDevice(device);
    setIsExpiredDevice(isExpired);
    open();
  };
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
      <div style={{ overflowX: 'auto' }}>
        <Table striped highlightOnHover style={{ minWidth: '650px' }}>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Device Name</Table.Th>
              <Table.Th>Organization</Table.Th>
              <Table.Th>AMC ID</Table.Th>
              <Table.Th>AMC End Date</Table.Th>
              <Table.Th>Status</Table.Th>
              <Table.Th>Actions</Table.Th>
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
                <Table.Td>
                  <Group gap="xs">
                    {/* Phone Call Button */}
                    {device.organization.phone ? (
                      <Tooltip label={`Call ${device.organization.name}: ${device.organization.phone}`}>
                        <ActionIcon
                          variant="light"
                          color="blue"
                          onClick={() => window.open(`tel:${device.organization.phone}`, '_self')}
                        >
                          <IconPhone size={16} />
                        </ActionIcon>
                      </Tooltip>
                    ) : (
                      <Tooltip label="No phone number available">
                        <ActionIcon variant="light" color="gray" disabled>
                          <IconPhone size={16} />
                        </ActionIcon>
                      </Tooltip>
                    )}
                    
                    {/* Email Contact Button */}
                    <Tooltip label="Contact via email">
                      <ActionIcon
                        variant="light"
                        color="green"
                        onClick={() => openContactModal(device, daysUntilExpiry !== null && daysUntilExpiry < 0)}
                      >
                        <IconMail size={16} />
                      </ActionIcon>
                    </Tooltip>
                  </Group>
                </Table.Td>
              </Table.Tr>
            );
          })}
        </Table.Tbody>
        </Table>
      </div>
      
      {/* Contact Modal */}
      <ContactModal
        device={selectedDevice}
        opened={opened}
        onClose={close}
        isExpired={isExpiredDevice}
      />
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
      <div style={{ overflowX: 'auto' }}>
        <Table striped highlightOnHover style={{ minWidth: '500px' }}>
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
      </div>
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
  const [opened, { open, close }] = useDisclosure(false);
  const [selectedDevice, setSelectedDevice] = useState<DeviceWithOrganization | null>(null);
  const [isExpiredDevice, setIsExpiredDevice] = useState(false);

  const openContactModal = (device: DeviceWithOrganization, isExpired: boolean) => {
    setSelectedDevice(device);
    setIsExpiredDevice(isExpired);
    open();
  };
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
    <Card  radius="md">
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
            <div style={{ overflowX: 'auto' }}>
              <Table striped highlightOnHover style={{ minWidth: '750px' }}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Device Name</Table.Th>
                    <Table.Th>Organization</Table.Th>
                    <Table.Th>AMC ID</Table.Th>
                    <Table.Th>AMC End Date</Table.Th>
                    <Table.Th>Status</Table.Th>
                    <Table.Th>Actions</Table.Th>
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
                      <Table.Td>
                        <Group gap="xs">
                          {/* Phone Call Button */}
                          {device.organization.phone ? (
                            <Tooltip label={`Call ${device.organization.name}: ${device.organization.phone}`}>
                              <ActionIcon
                                variant="light"
                                color="blue"
                                onClick={() => window.open(`tel:${device.organization.phone}`, '_self')}
                              >
                                <IconPhone size={16} />
                              </ActionIcon>
                            </Tooltip>
                          ) : (
                            <Tooltip label="No phone number available">
                              <ActionIcon variant="light" color="gray" disabled>
                                <IconPhone size={16} />
                              </ActionIcon>
                            </Tooltip>
                          )}
                          
                          {/* Email Contact Button */}
                          <Tooltip label="Contact via email">
                            <ActionIcon
                              variant="light"
                              color="green"
                              onClick={() => openContactModal(device, daysUntilExpiry !== null && daysUntilExpiry < 0)}
                            >
                              <IconMail size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Table.Td>
                    </Table.Tr>
                  );
                })}
              </Table.Tbody>
              </Table>
            </div>

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
        
        {/* Contact Modal */}
        <ContactModal
          device={selectedDevice}
          opened={opened}
          onClose={close}
          isExpired={isExpiredDevice}
        />
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
            <div style={{ overflowX: 'auto' }}>
              <Table striped highlightOnHover style={{ minWidth: '600px' }}>
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
            </div>

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
