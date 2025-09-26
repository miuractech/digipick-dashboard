import { useState, useMemo } from 'react';
import {
  Stack,
  Paper,
  Title,
  Group,
  TextInput,
  Select,
  Loader,
  Alert,
  Table,
  Text,
  Badge,
  Pagination,
  Card,
  Button,
  ActionIcon,
  Switch,
  Menu
} from '@mantine/core';
import { IconSearch, IconArchive, IconRestore, IconDots, IconEye, IconRefresh, IconDownload, IconPrinter } from '@tabler/icons-react';
import { modals } from '@mantine/modals';
import { notifications } from '@mantine/notifications';
import { useDevices, useDeviceMutations } from '../device/device.hook';
import { useOrganizations } from '../organization/organization.hook';
import type { Device } from '../device/device.type';

export default function Devices() {
  const [search, setSearch] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [page, setPage] = useState(1);
  const [showArchived, setShowArchived] = useState(false);
  const [pageSize, setPageSize] = useState(20);

  // Fetch organizations for filter dropdown
  const { organizations, loading: orgLoading } = useOrganizations();

  // Device mutations
  const { archiveDevice, unarchiveDevice, loading: mutationLoading } = useDeviceMutations();

  // Device filters
  const filters = useMemo(() => ({
    search: search || undefined,
    company_id: selectedOrg || undefined,
    archived: showArchived ? true : undefined,
    include_archived: false
  }), [search, selectedOrg, showArchived]);

  // Fetch all devices (filtered)
  const { devices, loading, error, refetch } = useDevices(filters);

  // Pagination (client-side for now)
  const paginatedDevices = useMemo(() => {
    const start = (page - 1) * pageSize;
    return devices.slice(start, start + pageSize);
  }, [devices, page, pageSize]);

  const totalPages = Math.ceil(devices.length / pageSize) || 1;

  const handleArchiveDevice = async (device: Device) => {
    const orgName = organizations.find(o => o.id === device.company_id)?.name || 'Unknown Organization';
    
    if (device.archived) {
      modals.openConfirmModal({
        title: 'Unarchive Device',
        children: (
          <Stack gap="sm">
            <Text size="sm">
              Are you sure you want to unarchive the device <strong>"{device.device_name}"</strong> from <strong>{orgName}</strong>?
            </Text>
            <Text size="sm" c="dimmed">
              Unarchiving will:
            </Text>
            <ul style={{ margin: '0', paddingLeft: '1.2rem' }}>
              <li><Text size="sm" c="dimmed">Make this device visible in active listings</Text></li>
              <li><Text size="sm" c="dimmed">Allow new service requests for this device</Text></li>
              <li><Text size="sm" c="dimmed">Restore device monitoring and management</Text></li>
            </ul>
          </Stack>
        ),
        labels: { confirm: 'Unarchive Device', cancel: 'Cancel' },
        confirmProps: { color: 'green' },
        onConfirm: async () => {
          const result = await unarchiveDevice(device.id);
          if (result) {
            notifications.show({
              title: 'Success',
              message: `Device "${device.device_name}" unarchived successfully`,
              color: 'green'
            });
            refetch();
          }
        },
      });
    } else {
      modals.openConfirmModal({
        title: 'Archive Device',
        children: (
          <Stack gap="sm">
            <Text size="sm">
              Are you sure you want to archive the device <strong>"{device.device_name}"</strong> from <strong>{orgName}</strong>?
            </Text>
            <Text size="sm" c="dimmed">
              Archiving will:
            </Text>
            <ul style={{ margin: '0', paddingLeft: '1.2rem' }}>
              <li><Text size="sm" c="dimmed">Hide this device from active listings</Text></li>
              <li><Text size="sm" c="dimmed">Prevent new service requests for this device</Text></li>
              <li><Text size="sm" c="dimmed">Keep all existing service history intact</Text></li>
            </ul>
            <Text size="sm" c="orange" fw={500}>
              This action can be reversed by unarchiving the device later.
            </Text>
          </Stack>
        ),
        labels: { confirm: 'Archive Device', cancel: 'Cancel' },
        confirmProps: { color: 'orange' },
        onConfirm: async () => {
          const result = await archiveDevice(device.id);
          if (result) {
            notifications.show({
              title: 'Success',
              message: `Device "${device.device_name}" archived successfully`,
              color: 'blue'
            });
            refetch();
          }
        },
      });
    }
  };

  const handleExport = () => {
    // TODO: Implement export functionality
    console.log('Export devices with filters:', filters);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRefresh = () => {
    refetch();
  };

  const handleViewDetails = (device: Device) => {
    setSelectedDevice(device);
  };

  return (
    <Card>
    <Stack gap="md" p={{ base: 'sm', md: 'md' }}>
      <Group justify="space-between" style={{ flexWrap: 'wrap', gap: 'md' }}>
        <Title order={2}>Devices</Title>
        <Group>
          <Button
            leftSection={<IconRefresh size={16} />}
            variant="subtle"
            onClick={handleRefresh}
            loading={loading}
          >
            Refresh
          </Button>
          <Button
            leftSection={<IconDownload size={16} />}
            variant="outline"
            onClick={handleExport}
          >
            Export Excel
          </Button>
          <Button
            leftSection={<IconPrinter size={16} />}
            variant="outline"
            onClick={handlePrint}
          >
            Print
          </Button>
          <Switch
            label="Show Archived"
            checked={showArchived}
            onChange={(event) => {
              setShowArchived(event.currentTarget.checked);
              setPage(1);
            }}
          />
        </Group>
      </Group>
      <Paper p="md" mb="md">
        <Group style={{ flexWrap: 'wrap', gap: 'md' }}>
          <TextInput
            leftSection={<IconSearch size={16} />}
            placeholder="Search devices by name, MAC address, or model..."
            value={search}
            onChange={(event) => setSearch(event.currentTarget.value)}
            style={{ flex: 1, minWidth: 250 }}
          />
          <Select
            data={orgLoading ? [] : organizations.map(org => ({ value: org.id, label: org.name }))}
            value={selectedOrg}
            onChange={value => {
              setSelectedOrg(value);
              setPage(1);
            }}
            placeholder="All Organizations"
            clearable
            searchable
            style={{ minWidth: 220 }}
          />
          <Button variant="outline" onClick={() => {
            setSearch('');
            setSelectedOrg(null);
            setPage(1);
          }} disabled={!search && !selectedOrg}>
            Clear
          </Button>
        </Group>
      </Paper>
      {error && <Alert color="red" title="Error">{error}</Alert>}

      <Paper p="md">
        <div style={{ overflowX: 'auto' }}>
          <Table highlightOnHover style={{ minWidth: '900px' }}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Device Name</Table.Th>
                <Table.Th>Organization</Table.Th>
                <Table.Th>MAC</Table.Th>
                <Table.Th>Model</Table.Th>
                <Table.Th>Warranty</Table.Th>
                <Table.Th>AMC</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
            {loading ? (
              <Table.Tr>
                <Table.Td colSpan={8} style={{ textAlign: 'center', padding: '2rem' }}>
                  <Loader size="md" />
                </Table.Td>
              </Table.Tr>
            ) : paginatedDevices.length === 0 ? (
              <Table.Tr>
                <Table.Td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--mantine-color-dimmed)' }}>
                  No devices found
                </Table.Td>
              </Table.Tr>
            ) : (
              paginatedDevices.map(device => (
                <Table.Tr
                  key={device.id}
                  style={{ cursor: 'pointer', opacity: device.archived ? 0.6 : 1 }}
                  onClick={() => handleViewDetails(device)}
                >
                  <Table.Td>
                    <div>
                      <div style={{ fontWeight: 500 }}>{device.device_name}</div>
                      <div style={{ fontSize: '0.875rem', color: 'var(--mantine-color-dimmed)' }}>
                        {device.serial_number}
                      </div>
                    </div>
                  </Table.Td>
                  <Table.Td>{organizations.find(o => o.id === device.company_id)?.name || '-'}</Table.Td>
                  <Table.Td>{device.mac_address || '-'}</Table.Td>
                  <Table.Td>{device.model || '-'}</Table.Td>
                  <Table.Td>
                    {device.warranty_expiry_date ? (
                      <Badge color={new Date(device.warranty_expiry_date) < new Date() ? 'red' : 'green'} variant="light">
                        {new Date(device.warranty_expiry_date).toLocaleDateString()}
                      </Badge>
                    ) : (
                      <Text c="dimmed">-</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    {device.amc_end_date ? (
                      <Badge color={new Date(device.amc_end_date) < new Date() ? 'red' : 'green'} variant="light">
                        {new Date(device.amc_end_date).toLocaleDateString()}
                      </Badge>
                    ) : (
                      <Text c="dimmed">-</Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Badge color={device.archived ? 'gray' : 'green'} variant="light">
                      {device.archived ? 'Archived' : 'Active'}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Menu shadow="md" width={200}>
                      <Menu.Target>
                        <ActionIcon variant="subtle" color="gray" onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                          <IconDots size={16} />
                        </ActionIcon>
                      </Menu.Target>

                      <Menu.Dropdown>
                        <Menu.Item
                          leftSection={<IconEye size={14} />}
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleViewDetails(device);
                          }}
                        >
                          View Details
                        </Menu.Item>
                        <Menu.Item
                          leftSection={device.archived ? <IconRestore size={14} /> : <IconArchive size={14} />}
                          color={device.archived ? 'green' : 'yellow'}
                          onClick={(e: React.MouseEvent) => {
                            e.stopPropagation();
                            handleArchiveDevice(device);
                          }}
                        >
                          {device.archived ? 'Unarchive' : 'Archive'}
                        </Menu.Item>
                      </Menu.Dropdown>
                    </Menu>
                  </Table.Td>
                </Table.Tr>
              ))
            )}
          </Table.Tbody>
          </Table>
        </div>
        
        <Stack gap="md" mt="md">
          <Group justify="space-between" style={{ flexWrap: 'wrap', gap: 'md' }}>
            <Group style={{ flexWrap: 'wrap', gap: 'md' }}>
              <Text size="sm" c="dimmed">
                Showing {((page - 1) * pageSize) + 1} to {Math.min(page * pageSize, devices.length)} of {devices.length} results
              </Text>
              <Select
                data={[
                  { value: '10', label: '10 per page' },
                  { value: '20', label: '20 per page' },
                  { value: '50', label: '50 per page' },
                  { value: '100', label: '100 per page' }
                ]}
                value={pageSize.toString()}
                onChange={(value) => {
                  setPageSize(parseInt(value || '20'));
                  setPage(1);
                }}
                w={130}
              />
            </Group>
            {totalPages > 1 && (
              <Pagination
                value={page}
                onChange={setPage}
                total={totalPages}
                size="sm"
              />
            )}
          </Group>
        </Stack>
      </Paper>
      {selectedDevice && (
        <Card shadow="md" p="lg" mt="md" withBorder>
          <Group justify="space-between">
            <Title order={4}>Device Preview</Title>
            <Text c="blue" style={{ cursor: 'pointer' }} onClick={() => setSelectedDevice(null)}>
              Close
            </Text>
          </Group>
          <Stack gap="xs" mt="sm">
            <Text><b>Name:</b> {selectedDevice.device_name}</Text>
            <Text><b>Organization:</b> {organizations.find(o => o.id === selectedDevice.company_id)?.name || '-'}</Text>
            <Text><b>MAC:</b> {selectedDevice.mac_address || '-'}</Text>
            <Text><b>Model:</b> {selectedDevice.model || '-'}</Text>
            <Text><b>Serial:</b> {selectedDevice.serial_number || '-'}</Text>
            <Text><b>Warranty Expiry:</b> {selectedDevice.warranty_expiry_date ? new Date(selectedDevice.warranty_expiry_date).toLocaleDateString() : '-'}</Text>
            <Text><b>AMC End:</b> {selectedDevice.amc_end_date ? new Date(selectedDevice.amc_end_date).toLocaleDateString() : '-'}</Text>
            <Text><b>Status:</b> 
              <Badge color={selectedDevice.archived ? 'gray' : 'green'} variant="light" ml="xs">
                {selectedDevice.archived ? 'Archived' : 'Active'}
              </Badge>
            </Text>
            <Text><b>Created:</b> {new Date(selectedDevice.created_at).toLocaleDateString()}</Text>
            <Text><b>Updated:</b> {new Date(selectedDevice.updated_at).toLocaleDateString()}</Text>
            <Group mt="md">
              <Button
                variant="outline"
                color={selectedDevice.archived ? 'blue' : 'orange'}
                leftSection={selectedDevice.archived ? <IconRestore size={16} /> : <IconArchive size={16} />}
                onClick={() => handleArchiveDevice(selectedDevice)}
                loading={mutationLoading}
              >
                {selectedDevice.archived ? 'Unarchive' : 'Archive'}
              </Button>
            </Group>
          </Stack>
        </Card>
      )}
    </Stack>
    </Card>
  );
}
