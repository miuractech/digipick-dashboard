import { useState } from 'react';
import {
  Stack,
  Paper,
  Title,
  Group,
  Button,
  Table,
  Text,
  ActionIcon,
  Menu,
  TextInput,
  Modal,
  Grid,
  Badge,
  Loader,
  Alert,
  Pagination,
  rem
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconDots,
  IconSearch,
  IconCalendar,
  IconCopy,
  IconCheck
} from '@tabler/icons-react';
import { DateInput } from '@mantine/dates';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { useCompanyDevices, useDeviceMutations } from './device.hook';
import type { Device, CreateDeviceData, UpdateDeviceData } from './device.type';

interface DeviceManagementProps {
  companyId: string;
}

export function DeviceManagement({ companyId }: DeviceManagementProps) {
  const [search, setSearch] = useState('');
  const [modalOpened, setModalOpened] = useState(false);
  const [editingDevice, setEditingDevice] = useState<Device | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [copiedDeviceId, setCopiedDeviceId] = useState<string | null>(null);

  const { devices, totalCount, totalPages, loading, error, refetch } = useCompanyDevices(
    companyId, 
    { search }, 
    { page, pageSize }
  );
  const { createDevice, updateDevice, deleteDevice, loading: mutationLoading } = useDeviceMutations();

  const form = useForm<CreateDeviceData | UpdateDeviceData>({
    initialValues: {
      company_id: companyId,
      device_name: '',
      amc_id: '',
      mac_address: '',
      make: '',
      model: '',
      serial_number: '',
      purchase_date: '',
      warranty_expiry_date: '',
      amc_start_date: '',
      amc_end_date: ''
    },
    validate: {
      device_name: (value) => (!value ? 'Device name is required' : null)
    }
  });

  const openCreateModal = () => {
    setEditingDevice(null);
    form.reset();
    form.setValues({ company_id: companyId });
    setModalOpened(true);
  };

  const openEditModal = (device: Device) => {
    setEditingDevice(device);
    form.setValues({
      ...device,
      purchase_date: device.purchase_date || '',
      warranty_expiry_date: device.warranty_expiry_date || '',
      amc_start_date: device.amc_start_date || '',
      amc_end_date: device.amc_end_date || ''
    });
    setModalOpened(true);
  };

  const handleSubmit = async (values: CreateDeviceData | UpdateDeviceData) => {
    try {
      // Convert empty date strings to null
      const processedValues = {
        ...values,
        purchase_date: values.purchase_date || null,
        warranty_expiry_date: values.warranty_expiry_date || null,
        amc_start_date: values.amc_start_date || null,
        amc_end_date: values.amc_end_date || null
      };

      if (editingDevice) {
        const result = await updateDevice({ ...processedValues, id: editingDevice.id } as UpdateDeviceData);
        if (result) {
          notifications.show({
            title: 'Success',
            message: 'Device updated successfully',
            color: 'green'
          });
          setModalOpened(false);
          refetch();
        }
      } else {
        const result = await createDevice(processedValues as CreateDeviceData);
        if (result) {
          notifications.show({
            title: 'Success',
            message: 'Device created successfully',
            color: 'green'
          });
          setModalOpened(false);
          refetch();
        }
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to save device',
        color: 'red'
      });
    }
  };

  const handleDelete = async (device: Device) => {
    if (window.confirm(`Are you sure you want to delete device "${device.device_name}"?`)) {
      const result = await deleteDevice(device.id);
      if (result) {
        notifications.show({
          title: 'Success',
          message: 'Device deleted successfully',
          color: 'green'
        });
        refetch();
      } else {
        notifications.show({
          title: 'Error',
          message: 'Failed to delete device',
          color: 'red'
        });
      }
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Not set';
    return new Date(dateString).toLocaleDateString();
  };

  const isWarrantyExpired = (warrantyDate?: string) => {
    if (!warrantyDate) return false;
    return new Date(warrantyDate) < new Date();
  };

  const isAmcExpired = (amcEndDate?: string) => {
    if (!amcEndDate) return false;
    return new Date(amcEndDate) < new Date();
  };

  const copyToClipboard = async (text: string, label: string, deviceId: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedDeviceId(deviceId);
      
      // Reset the tick animation after 2 seconds
      setTimeout(() => {
        setCopiedDeviceId(null);
      }, 2000);
      
      notifications.show({
        title: 'Copied',
        message: `${label} copied to clipboard`,
        color: 'green'
      });
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to copy to clipboard',
        color: 'red'
      });
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page when searching
  };

  if (loading) return <Loader size="lg" style={{ display: 'block', margin: '2rem auto' }} />;
  if (error) return <Alert color="red" title="Error">{error}</Alert>;

  return (
    <Stack gap="md">
      <Paper shadow="xs" p="md">
        <Stack gap="md">
          <Group justify="space-between">
            <Title order={3}>Devices</Title>
            <Button leftSection={<IconPlus size={16} />} onClick={openCreateModal}>
              Add Device
            </Button>
          </Group>

          <TextInput
            placeholder="Search by device name or ID..."
            leftSection={<IconSearch style={{ width: rem(16), height: rem(16) }} />}
            value={search}
            onChange={(event) => handleSearchChange(event.currentTarget.value)}
          />

          {totalCount > 0 && (
            <Text size="sm" c="dimmed">
              Showing {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, totalCount)} of {totalCount} devices
            </Text>
          )}

          {devices.length === 0 ? (
            <Text ta="center" c="dimmed" py="xl">
              {loading ? 'Loading devices...' : 'No devices found'}
            </Text>
          ) : (
            <Table striped highlightOnHover>
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Device Name</Table.Th>
                  <Table.Th>Device ID</Table.Th>
                  <Table.Th>AMC ID</Table.Th>
                  <Table.Th>MAC Address</Table.Th>
                  <Table.Th>Make/Model</Table.Th>
                  <Table.Th>Warranty</Table.Th>
                  <Table.Th>AMC Status</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {devices.map((device) => (
                  <Table.Tr key={device.id}>
                    <Table.Td>
                      <div>
                        <Text fw={500}>{device.device_name}</Text>
                        {device.serial_number && (
                          <Text size="xs" c="dimmed">SN: {device.serial_number}</Text>
                        )}
                      </div>
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <Text ff="monospace" size="xs" c="dimmed">
                          {device.id.substring(0, 8)}...
                        </Text>
                        <ActionIcon
                          size="sm"
                          variant="subtle"
                          color={copiedDeviceId === device.id ? 'green' : 'gray'}
                          onClick={() => copyToClipboard(device.id, 'Device ID', device.id)}
                          style={{
                            transition: 'all 0.2s ease',
                            transform: copiedDeviceId === device.id ? 'scale(1.1)' : 'scale(1)'
                          }}
                        >
                          {copiedDeviceId === device.id ? (
                            <IconCheck size={12} />
                          ) : (
                            <IconCopy size={12} />
                          )}
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      {device.amc_id ? (
                        <Text>{device.amc_id}</Text>
                      ) : (
                        <Text c="dimmed">Not assigned</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {device.mac_address ? (
                        <Text ff="monospace" size="sm">{device.mac_address}</Text>
                      ) : (
                        <Text c="dimmed">Not provided</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {device.make || device.model ? (
                        <div>
                          {device.make && <Text size="sm">{device.make}</Text>}
                          {device.model && <Text size="xs" c="dimmed">{device.model}</Text>}
                        </div>
                      ) : (
                        <Text c="dimmed">Not specified</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {device.warranty_expiry_date ? (
                        <Badge
                          color={isWarrantyExpired(device.warranty_expiry_date) ? 'red' : 'green'}
                          variant="light"
                        >
                          {formatDate(device.warranty_expiry_date)}
                        </Badge>
                      ) : (
                        <Text c="dimmed">Not set</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {device.amc_end_date ? (
                        <Badge
                          color={isAmcExpired(device.amc_end_date) ? 'red' : 'green'}
                          variant="light"
                        >
                          {formatDate(device.amc_end_date)}
                        </Badge>
                      ) : (
                        <Text c="dimmed">Not set</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Menu shadow="md" width={200}>
                        <Menu.Target>
                          <ActionIcon variant="subtle">
                            <IconDots size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          <Menu.Item
                            leftSection={<IconEdit size={14} />}
                            onClick={() => openEditModal(device)}
                          >
                            Edit
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconTrash size={14} />}
                            color="red"
                            onClick={() => handleDelete(device)}
                          >
                            Delete
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}

          {totalPages > 1 && (
            <Group justify="center" mt="md">
              <Pagination
                total={totalPages}
                value={page}
                onChange={handlePageChange}
                size="sm"
              />
            </Group>
          )}
        </Stack>
      </Paper>

      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title={editingDevice ? 'Edit Device' : 'Add New Device'}
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack gap="md">
            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  label="Device Name"
                  placeholder="Enter device name"
                  required
                  {...form.getInputProps('device_name')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label="AMC ID"
                  placeholder="Enter AMC ID"
                  {...form.getInputProps('amc_id')}
                />
              </Grid.Col>
            </Grid>

            <TextInput
              label="MAC Address"
              placeholder="Enter MAC address"
              {...form.getInputProps('mac_address')}
            />

            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  label="Make"
                  placeholder="Enter device make"
                  {...form.getInputProps('make')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label="Model"
                  placeholder="Enter device model"
                  {...form.getInputProps('model')}
                />
              </Grid.Col>
            </Grid>

            <TextInput
              label="Serial Number"
              placeholder="Enter serial number"
              {...form.getInputProps('serial_number')}
            />

            <Grid>
              <Grid.Col span={6}>
                <DateInput
                  label="Purchase Date"
                  placeholder="Select purchase date"
                  leftSection={<IconCalendar size={16} />}
                  value={form.values.purchase_date ? new Date(form.values.purchase_date) : null}
                  onChange={(date) => form.setFieldValue('purchase_date', date?.toISOString().split('T')[0] || '')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <DateInput
                  label="Warranty Expiry"
                  placeholder="Select warranty expiry date"
                  leftSection={<IconCalendar size={16} />}
                  value={form.values.warranty_expiry_date ? new Date(form.values.warranty_expiry_date) : null}
                  onChange={(date) => form.setFieldValue('warranty_expiry_date', date?.toISOString().split('T')[0] || '')}
                />
              </Grid.Col>
            </Grid>

            <Grid>
              <Grid.Col span={6}>
                <DateInput
                  label="AMC Start Date"
                  placeholder="Select AMC start date"
                  leftSection={<IconCalendar size={16} />}
                  value={form.values.amc_start_date ? new Date(form.values.amc_start_date) : null}
                  onChange={(date) => form.setFieldValue('amc_start_date', date?.toISOString().split('T')[0] || '')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <DateInput
                  label="AMC End Date"
                  placeholder="Select AMC end date"
                  leftSection={<IconCalendar size={16} />}
                  value={form.values.amc_end_date ? new Date(form.values.amc_end_date) : null}
                  onChange={(date) => form.setFieldValue('amc_end_date', date?.toISOString().split('T')[0] || '')}
                />
              </Grid.Col>
            </Grid>

            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={() => setModalOpened(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={mutationLoading}>
                {editingDevice ? 'Update' : 'Create'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
