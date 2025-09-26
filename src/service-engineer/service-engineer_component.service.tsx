import { useState, useMemo } from 'react';
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
  MultiSelect,
  Textarea
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconDots,
  IconSearch,
  IconUser
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { useServiceEngineers, useServiceEngineerActions } from './service-engineer.hook';
import type { CreateServiceEngineerRequest, ServiceEngineer, ServiceEngineerFilters } from './service-engineer.type';

const EXPERTISE_OPTIONS = [
  { value: 'demo_installation', label: 'Demo Installation' },
  { value: 'repair', label: 'Repair' },
  { value: 'service', label: 'Service' },
  { value: 'calibration', label: 'Calibration' }
];

export function ServiceEngineerManagement() {
  const [search, setSearch] = useState('');
  const [modalOpened, setModalOpened] = useState(false);
  const [editingEngineer, setEditingEngineer] = useState<ServiceEngineer | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  const filters = useMemo<ServiceEngineerFilters>(() => 
    search ? { name: search } : {}, [search]
  );
  const { engineers, loading, error, refetch } = useServiceEngineers(filters);
  const { createEngineer, updateEngineer, deleteEngineer, loading: actionLoading } = useServiceEngineerActions();

  const form = useForm<CreateServiceEngineerRequest>({
    initialValues: {
      name: '',
      email: '',
      contact_number: '',
      comments: '',
      expertise: []
    },
    validate: {
      name: (value) => (!value ? 'Name is required' : null),
      email: (value) => (!value ? 'Email is required' : /^\S+@\S+$/.test(value) ? null : 'Invalid email'),
      contact_number: (value) => (!value ? 'Contact number is required' : null),
      expertise: (value) => (value.length === 0 ? 'At least one expertise is required' : null)
    }
  });

  const handleSubmit = async (values: CreateServiceEngineerRequest) => {
    try {
      if (editingEngineer) {
        await updateEngineer({ ...values, id: editingEngineer.id! });
        notifications.show({
          title: 'Success',
          message: 'Service engineer updated successfully',
          color: 'green'
        });
      } else {
        await createEngineer(values);
        notifications.show({
          title: 'Success',
          message: 'Service engineer created successfully',
          color: 'green'
        });
      }
      closeModal();
      refetch();
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: error instanceof Error ? error.message : 'An error occurred',
        color: 'red'
      });
    }
  };

  const handleDelete = async (engineer: ServiceEngineer) => {
    modals.openConfirmModal({
      title: 'Delete Service Engineer',
      children: (
        <Stack gap="sm">
          <Text size="sm">
            Are you sure you want to delete the service engineer <strong>"{engineer.name}"</strong>?
          </Text>
          <Text size="sm" c="red" fw={500}>
            ⚠️ WARNING: This action is permanent and cannot be undone!
          </Text>
          <Text size="sm" c="dimmed">
            Deleting will:
          </Text>
          <ul style={{ margin: '0', paddingLeft: '1.2rem' }}>
            <li><Text size="sm" c="dimmed">Remove this engineer from all active service requests</Text></li>
            <li><Text size="sm" c="dimmed">Delete all engineer profile information</Text></li>
            <li><Text size="sm" c="dimmed">Remove assignment history (this cannot be recovered)</Text></li>
          </ul>
          <Text size="sm" c="orange" fw={500}>
            Consider archiving instead of deleting to preserve historical data.
          </Text>
        </Stack>
      ),
      labels: { confirm: 'Delete Permanently', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        try {
          await deleteEngineer(engineer.id);
          notifications.show({
            title: 'Success',
            message: `Service engineer "${engineer.name}" deleted successfully`,
            color: 'green'
          });
          refetch();
        } catch (error) {
          notifications.show({
            title: 'Error',
            message: error instanceof Error ? error.message : 'Failed to delete service engineer',
            color: 'red'
          });
        }
      },
    });
  };

  const openModal = (engineer?: ServiceEngineer) => {
    if (engineer) {
      setEditingEngineer(engineer);
      form.setValues({
        name: engineer.name,
        email: engineer.email,
        contact_number: engineer.contact_number,
        comments: engineer.comments,
        expertise: engineer.expertise
      });
    } else {
      setEditingEngineer(null);
      form.reset();
    }
    setModalOpened(true);
  };

  const closeModal = () => {
    setModalOpened(false);
    setEditingEngineer(null);
    form.reset();
  };

  const getExpertiseBadges = (expertise: string[]) => {
    return expertise.map((exp) => (
      <Badge key={exp} variant="light" size="sm">
        {EXPERTISE_OPTIONS.find(opt => opt.value === exp)?.label || exp}
      </Badge>
    ));
  };

  // Pagination
  const totalPages = Math.ceil(engineers.length / pageSize);
  const startIndex = (page - 1) * pageSize;
  const endIndex = startIndex + pageSize;
  const paginatedEngineers = engineers.slice(startIndex, endIndex);

  if (loading) {
    return (
      <Stack align="center" justify="center" h={200}>
        <Loader size="lg" />
        <Text>Loading service engineers...</Text>
      </Stack>
    );
  }

  if (error) {
    return (
      <Alert color="red" title="Error">
        {error}
      </Alert>
    );
  }

  return (
    <Stack>
      <Paper p="md">
        <Group justify="space-between" mb="md">
          <Title order={2}>Service Engineers</Title>
          <Button 
            leftSection={<IconPlus size={16} />}
            onClick={() => openModal()}
          >
            Add Service Engineer
          </Button>
        </Group>

        <TextInput
          placeholder="Search engineers..."
          leftSection={<IconSearch size={16} />}
          value={search}
          onChange={(e) => setSearch(e.currentTarget.value)}
          mb="md"
        />

        <Table striped highlightOnHover>
          <Table.Thead>
            <Table.Tr>
              <Table.Th>Name</Table.Th>
              <Table.Th>Email</Table.Th>
              <Table.Th>Contact</Table.Th>
              <Table.Th>Expertise</Table.Th>
              <Table.Th>Comments</Table.Th>
              <Table.Th>Actions</Table.Th>
            </Table.Tr>
          </Table.Thead>
          <Table.Tbody>
            {paginatedEngineers.map((engineer) => (
              <Table.Tr key={engineer.id}>
                <Table.Td>
                  <Group>
                    <IconUser size={16} />
                    <Text fw={500}>{engineer.name}</Text>
                  </Group>
                </Table.Td>
                <Table.Td>{engineer.email}</Table.Td>
                <Table.Td>{engineer.contact_number}</Table.Td>
                <Table.Td>
                  <Group gap="xs">
                    {getExpertiseBadges(engineer.expertise)}
                  </Group>
                </Table.Td>
                <Table.Td>
                  <Text size="sm" lineClamp={2}>
                    {engineer.comments || '-'}
                  </Text>
                </Table.Td>
                <Table.Td>
                  <Menu>
                    <Menu.Target>
                      <ActionIcon variant="subtle">
                        <IconDots size={16} />
                      </ActionIcon>
                    </Menu.Target>
                    <Menu.Dropdown>
                      <Menu.Item
                        leftSection={<IconEdit size={14} />}
                        onClick={() => openModal(engineer)}
                      >
                        Edit
                      </Menu.Item>
                      <Menu.Item
                        leftSection={<IconTrash size={14} />}
                        color="red"
                        onClick={() => handleDelete(engineer)}
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

        {totalPages > 1 && (
          <Group justify="center" mt="md">
            <Pagination
              value={page}
              onChange={setPage}
              total={totalPages}
            />
          </Group>
        )}
      </Paper>

      <Modal
        opened={modalOpened}
        onClose={closeModal}
        title={editingEngineer ? 'Edit Service Engineer' : 'Add Service Engineer'}
        size="lg"
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Stack>
            <Grid>
              <Grid.Col span={6}>
                <TextInput
                  label="Name"
                  placeholder="Enter full name"
                  required
                  {...form.getInputProps('name')}
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <TextInput
                  label="Email"
                  placeholder="Enter email address"
                  required
                  {...form.getInputProps('email')}
                />
              </Grid.Col>
            </Grid>

            <TextInput
              label="Contact Number"
              placeholder="Enter contact number"
              required
              {...form.getInputProps('contact_number')}
            />

            <MultiSelect
              label="Expertise"
              placeholder="Select areas of expertise"
              data={EXPERTISE_OPTIONS}
              required
              {...form.getInputProps('expertise')}
            />

            <Textarea
              label="Comments"
              placeholder="Notes about the service engineer"
              minRows={3}
              {...form.getInputProps('comments')}
            />

            <Group justify="flex-end">
              <Button variant="outline" onClick={closeModal}>
                Cancel
              </Button>
              <Button type="submit" loading={actionLoading}>
                {editingEngineer ? 'Update' : 'Create'}
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
