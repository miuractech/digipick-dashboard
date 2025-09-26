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
  rem,
  Select,
  MultiSelect,
  Divider
} from '@mantine/core';
import {
  IconPlus,
  IconEdit,
  IconTrash,
  IconDots,
  IconSearch,
  IconMail,
  IconUsers,
  IconDevices
} from '@tabler/icons-react';
import { useForm } from '@mantine/form';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { useOrganizationUsers, usePendingInvitations, useUserMutations } from './user.hook';
import { useCompanyDevices } from '../device/device.hook';
import type { OrganizationUser, CreateUserTrackingData, UpdateUserDevicesData, USER_TYPES } from './user.type';

interface UserManagementProps {
  companyId: string;
}

const userTypeOptions = [
  { value: 'user', label: 'User' },
  { value: 'manager', label: 'Manager' }
];

export function UserManagement({ companyId }: UserManagementProps) {
  const [search, setSearch] = useState('');
  const [modalOpened, setModalOpened] = useState(false);
  const [editingUser, setEditingUser] = useState<OrganizationUser | null>(null);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);
  const [inviteModalOpened, setInviteModalOpened] = useState(false);

  const { users, totalCount, totalPages, loading, error, refetch } = useOrganizationUsers(
    companyId, 
    { search }, 
    { page, pageSize }
  );
  
  const { invitations, refetch: refetchInvitations } = usePendingInvitations(companyId);
  
  // Get devices for the multiselect
  const { devices: allDevices } = useCompanyDevices(companyId, {}, { page: 1, pageSize: 1000 });
  
  const { removeUser, updateUserDevices, addUser, removePendingInvitation, loading: mutationLoading } = useUserMutations();

  const deviceOptions = allDevices.map(device => ({
    value: device.id,
    label: device.device_name
  }));

  const editForm = useForm<UpdateUserDevicesData>({
    initialValues: {
      user_id: '',
      organization_id: companyId,
      devices: []
    }
  });

  const inviteForm = useForm<CreateUserTrackingData>({
    initialValues: {
      organization_id: companyId,
      email: '',
      user_type: 'user' as USER_TYPES,
      devices: []
    },
    validate: {
      email: (value) => (/^\S+@\S+$/.test(value) ? null : 'Invalid email')
    }
  });

  const openEditModal = (user: OrganizationUser) => {
    setEditingUser(user);
    editForm.setValues({
      user_id: user.id,
      organization_id: companyId,
      devices: user.user_role.devices === 'all' ? 'all' : user.user_role.devices
    });
    setModalOpened(true);
  };

  const openInviteModal = () => {
    inviteForm.reset();
    inviteForm.setValues({ organization_id: companyId });
    setInviteModalOpened(true);
  };

  const handleEditSubmit = async (values: UpdateUserDevicesData) => {
    try {
      const result = await updateUserDevices(values);
      if (result) {
        notifications.show({
          title: 'Success',
          message: 'User devices updated successfully',
          color: 'green'
        });
        setModalOpened(false);
        refetch();
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to update user devices',
        color: 'red'
      });
    }
  };

  const handleInviteSubmit = async (values: CreateUserTrackingData) => {
    try {
      const result = await addUser(values);
      if (result) {
        notifications.show({
          title: 'Success',
          message: 'User invitation sent successfully',
          color: 'green'
        });
        setInviteModalOpened(false);
        refetch();
        refetchInvitations();
      }
    } catch (error) {
      notifications.show({
        title: 'Error',
        message: 'Failed to send user invitation',
        color: 'red'
      });
    }
  };

  const handleRemoveUser = async (user: OrganizationUser) => {
    modals.openConfirmModal({
      title: 'Remove User',
      children: (
        <Text size="sm">
          Are you sure you want to remove <strong>{user.full_name || user.email}</strong> from this organization?
          This will revoke their access to all devices and data.
        </Text>
      ),
      labels: { confirm: 'Remove User', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        const result = await removeUser(user.id, companyId);
        if (result) {
          notifications.show({
            title: 'Success',
            message: 'User removed successfully',
            color: 'green'
          });
          refetch();
        } else {
          notifications.show({
            title: 'Error',
            message: 'Failed to remove user',
            color: 'red'
          });
        }
      }
    });
  };

  const handleRemoveInvitation = async (invitationId: string, email: string) => {
    modals.openConfirmModal({
      title: 'Remove Invitation',
      children: (
        <Text size="sm">
          Are you sure you want to remove the invitation for <strong>{email}</strong>?
        </Text>
      ),
      labels: { confirm: 'Remove Invitation', cancel: 'Cancel' },
      confirmProps: { color: 'red' },
      onConfirm: async () => {
        const result = await removePendingInvitation(invitationId);
        if (result) {
          notifications.show({
            title: 'Success',
            message: 'Invitation removed successfully',
            color: 'green'
          });
          refetchInvitations();
        }
      }
    });
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
  };

  const handleSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const formatDeviceAccess = (devices: string[] | 'all') => {
    if (devices === 'all') {
      return <Badge color="green" variant="light">All Devices</Badge>;
    }
    if (Array.isArray(devices) && devices.length === 0) {
      return <Badge color="gray" variant="light">No Access</Badge>;
    }
    if (Array.isArray(devices)) {
      return <Badge color="blue" variant="light">{devices.length} Device(s)</Badge>;
    }
    return <Badge color="gray" variant="light">Unknown</Badge>;
  };

  const getUserTypeBadgeColor = (userType: string) => {
    switch (userType) {
      case 'admin': return 'red';
      case 'manager': return 'blue';
      case 'user': return 'green';
      default: return 'gray';
    }
  };

  if (loading) return <Loader size="lg" style={{ display: 'block', margin: '2rem auto' }} />;
  if (error) return <Alert color="red" title="Error">{error}</Alert>;

  return (
    <Stack gap="md">
      <Paper p="md">
        <Stack gap="md">
          <Group justify="space-between" style={{ flexWrap: 'wrap', gap: 'md' }}>
            <Title order={3}>Users</Title>
            <Button leftSection={<IconPlus size={16} />} onClick={openInviteModal}>
              Invite User
            </Button>
          </Group>

          <TextInput
            placeholder="Search by name or email..."
            leftSection={<IconSearch style={{ width: rem(16), height: rem(16) }} />}
            value={search}
            onChange={(event) => handleSearchChange(event.currentTarget.value)}
          />

          {/* Pending Invitations */}
          {invitations.length > 0 && (
            <>
              <Divider label="Pending Invitations" labelPosition="left" />
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Role</Table.Th>
                    <Table.Th>Device Access</Table.Th>
                    <Table.Th>Invited</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {invitations.map((invitation) => (
                    <Table.Tr key={invitation.id} style={{ backgroundColor: '#fef3c7' }}>
                      <Table.Td>
                        <Group gap="xs">
                          <IconMail size={16} color="orange" />
                          <Text>{invitation.email}</Text>
                        </Group>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={getUserTypeBadgeColor(invitation.user_type)} variant="light" size="sm">
                          {invitation.user_type}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {formatDeviceAccess(invitation.devices)}
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {new Date(invitation.created_at).toLocaleDateString()}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <ActionIcon 
                          color="red" 
                          variant="subtle"
                          onClick={() => handleRemoveInvitation(invitation.id, invitation.email)}
                        >
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
              <Divider />
            </>
          )}

          {totalCount > 0 && (
            <Text size="sm" c="dimmed">
              Showing {((page - 1) * pageSize) + 1}-{Math.min(page * pageSize, totalCount)} of {totalCount} users
            </Text>
          )}

          {users.length === 0 ? (
            <Text ta="center" c="dimmed" py="xl">
              {loading ? 'Loading users...' : 'No users found'}
            </Text>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <Table striped highlightOnHover>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>User</Table.Th>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Role</Table.Th>
                    <Table.Th>Device Access</Table.Th>
                    <Table.Th>Joined</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {users.map((user) => (
                    <Table.Tr key={user.id}>
                      <Table.Td>
                        <div>
                          <Text fw={500}>{user.full_name || 'Unknown'}</Text>
                          {user.phone && (
                            <Text size="xs" c="dimmed">{user.phone}</Text>
                          )}
                        </div>
                      </Table.Td>
                      <Table.Td>
                        <Text>{user.email}</Text>
                      </Table.Td>
                      <Table.Td>
                        <Badge color={getUserTypeBadgeColor(user.user_role.user_type)} variant="light">
                          {user.user_role.user_type}
                        </Badge>
                      </Table.Td>
                      <Table.Td>
                        {formatDeviceAccess(user.user_role.devices)}
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" c="dimmed">
                          {new Date(user.user_role.created_at).toLocaleDateString()}
                        </Text>
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
                              leftSection={<IconDevices size={14} />}
                              onClick={() => openEditModal(user)}
                            >
                              Edit Devices
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<IconTrash size={14} />}
                              color="red"
                              onClick={() => handleRemoveUser(user)}
                            >
                              Remove User
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </div>
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

      {/* Edit User Devices Modal */}
      <Modal
        opened={modalOpened}
        onClose={() => setModalOpened(false)}
        title="Edit User Device Access"
        size="md"
      >
        <form onSubmit={editForm.onSubmit(handleEditSubmit)}>
          <Stack gap="md">
            <Text size="sm" c="dimmed">
              User: <strong>{editingUser?.full_name || editingUser?.email}</strong>
            </Text>

            <Select
              label="Device Access Type"
              placeholder="Select access type"
              data={[
                { value: 'all', label: 'All Devices' },
                { value: 'specific', label: 'Specific Devices' },
                { value: 'none', label: 'No Access' }
              ]}
              value={
                editForm.values.devices === 'all' ? 'all' :
                Array.isArray(editForm.values.devices) && editForm.values.devices.length === 0 ? 'none' :
                'specific'
              }
              onChange={(value) => {
                if (value === 'all') {
                  editForm.setFieldValue('devices', 'all');
                } else if (value === 'none') {
                  editForm.setFieldValue('devices', []);
                } else {
                  editForm.setFieldValue('devices', []);
                }
              }}
            />

            {Array.isArray(editForm.values.devices) && editForm.values.devices !== 'all' && (
              <MultiSelect
                label="Select Devices"
                placeholder="Choose specific devices"
                data={deviceOptions}
                value={editForm.values.devices as string[]}
                onChange={(value) => editForm.setFieldValue('devices', value)}
                searchable
                clearable
              />
            )}

            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={() => setModalOpened(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={mutationLoading}>
                Update Access
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>

      {/* Invite User Modal */}
      <Modal
        opened={inviteModalOpened}
        onClose={() => setInviteModalOpened(false)}
        title="Invite User to Organization"
        size="md"
      >
        <form onSubmit={inviteForm.onSubmit(handleInviteSubmit)}>
          <Stack gap="md">
            <TextInput
              label="Email Address"
              placeholder="Enter user's email"
              required
              {...inviteForm.getInputProps('email')}
            />

            <Select
              label="Role"
              placeholder="Select user role"
              data={userTypeOptions}
              required
              {...inviteForm.getInputProps('user_type')}
            />

            <Select
              label="Device Access Type"
              placeholder="Select access type"
              data={[
                { value: 'all', label: 'All Devices' },
                { value: 'specific', label: 'Specific Devices' },
                { value: 'none', label: 'No Access' }
              ]}
              value={
                inviteForm.values.devices === 'all' ? 'all' :
                Array.isArray(inviteForm.values.devices) && inviteForm.values.devices.length === 0 ? 'none' :
                'specific'
              }
              onChange={(value) => {
                if (value === 'all') {
                  inviteForm.setFieldValue('devices', 'all');
                } else if (value === 'none') {
                  inviteForm.setFieldValue('devices', []);
                } else {
                  inviteForm.setFieldValue('devices', []);
                }
              }}
            />

            {Array.isArray(inviteForm.values.devices) && inviteForm.values.devices !== 'all' && (
              <MultiSelect
                label="Select Devices"
                placeholder="Choose specific devices"
                data={deviceOptions}
                value={inviteForm.values.devices as string[]}
                onChange={(value) => inviteForm.setFieldValue('devices', value)}
                searchable
                clearable
              />
            )}

            <Group justify="flex-end" mt="md">
              <Button variant="subtle" onClick={() => setInviteModalOpened(false)}>
                Cancel
              </Button>
              <Button type="submit" loading={mutationLoading}>
                Send Invitation
              </Button>
            </Group>
          </Stack>
        </form>
      </Modal>
    </Stack>
  );
}
