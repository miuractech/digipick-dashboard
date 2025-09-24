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
  rem,
  Card
} from '@mantine/core';
import { IconSearch } from '@tabler/icons-react';
import { useDevices } from '../device/device.hook';
import { useOrganizations } from '../organization/organization.hook';
import type { Device } from '../device/device.type';

export default function Devices() {
  const [search, setSearch] = useState('');
  const [selectedOrg, setSelectedOrg] = useState<string | null>(null);
  const [selectedDevice, setSelectedDevice] = useState<Device | null>(null);
  const [page, setPage] = useState(1);
  const pageSize = 20;

  // Fetch organizations for filter dropdown
  const { organizations, loading: orgLoading } = useOrganizations();

  // Device filters
  const filters = useMemo(() => ({
    search: search || undefined,
    company_id: selectedOrg || undefined
  }), [search, selectedOrg]);

  // Fetch all devices (filtered)
  const { devices, loading, error } = useDevices(filters);

  // Pagination (client-side for now)
  const paginatedDevices = useMemo(() => {
    const start = (page - 1) * pageSize;
    return devices.slice(start, start + pageSize);
  }, [devices, page, pageSize]);

  const totalPages = Math.ceil(devices.length / pageSize) || 1;

  return (
    <Stack gap="md" p={{ base: 'sm', md: 'md' }}>
      <Group justify="space-between">
        <Title order={2}>Devices</Title>
      </Group>
      <Paper shadow="xs" p="md">
        <Stack gap="md">
          <Group gap="md" align="flex-end" style={{ flexWrap: 'wrap' }}>
            <TextInput
              placeholder="Search devices..."
              leftSection={<IconSearch style={{ width: rem(16), height: rem(16) }} />}
              value={search}
              onChange={e => {
                setSearch(e.currentTarget.value);
                setPage(1);
              }}
              style={{ flex: 1, minWidth: 200 }}
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
          </Group>
        </Stack>
      </Paper>
      {loading ? (
        <Loader size="lg" style={{ display: 'block', margin: '2rem auto' }} />
      ) : error ? (
        <Alert color="red" title="Error">{error}</Alert>
      ) : (
        <Paper shadow="xs" p="md">
          <div style={{ overflowX: 'auto' }}>
            <Table striped highlightOnHover style={{ minWidth: '800px' }}>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Device Name</Table.Th>
                  <Table.Th>Organization</Table.Th>
                  <Table.Th>MAC</Table.Th>
                  <Table.Th>Model</Table.Th>
                  <Table.Th>Warranty</Table.Th>
                  <Table.Th>AMC</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
              {paginatedDevices.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text ta="center" c="dimmed">No devices found</Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                paginatedDevices.map(device => (
                  <Table.Tr
                    key={device.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => setSelectedDevice(device)}
                  >
                    <Table.Td>{device.device_name}</Table.Td>
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
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
            </Table>
          </div>
          {totalPages > 1 && (
            <Group justify="center" mt="md">
              <Pagination
                total={totalPages}
                value={page}
                onChange={setPage}
                size="sm"
              />
            </Group>
          )}
        </Paper>
      )}
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
            <Text><b>Created:</b> {new Date(selectedDevice.created_at).toLocaleDateString()}</Text>
            <Text><b>Updated:</b> {new Date(selectedDevice.updated_at).toLocaleDateString()}</Text>
          </Stack>
        </Card>
      )}
    </Stack>
  );
}
