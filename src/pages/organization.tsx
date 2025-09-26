import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Table,
  Button,
  Modal,
  TextInput,
  Grid,
  Group,
  Title,
  Paper,
  ActionIcon,
  Loader,
  Alert,
  Stack,
  Tabs,
  Menu,
  Pagination,
  Select,
  Text,
  Card
} from '@mantine/core';
import { useForm } from '@mantine/form';
import { IconEdit, IconArchive, IconPlus, IconRestore, IconDots, IconEye, IconSearch, IconDownload, IconPrinter, IconRefresh } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { modals } from '@mantine/modals';
import { usePaginatedOrganizations, useOrganizationMutations, useOrganizationExport } from '../organization/organization.hook';
import type { Organization, CreateOrganizationData } from '../organization/organization.type';

export default function OrganizationPage() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<string | null>('active');
  
  // Search and pagination state
  const [searchQuery, setSearchQuery] = useState('');
  const [activePage, setActivePage] = useState(1);
  const [archivedPage, setArchivedPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  
  // Memoize filter objects to prevent unnecessary re-renders
  const activeFilters = useMemo(() => ({
    archived: false,
    search: searchQuery || undefined
  }), [searchQuery]);
  
  const archivedFilters = useMemo(() => ({
    archived: true,
    search: searchQuery || undefined
  }), [searchQuery]);
  
  const activePagination = useMemo(() => ({ page: activePage, pageSize }), [activePage, pageSize]);
  const archivedPagination = useMemo(() => ({ page: archivedPage, pageSize }), [archivedPage, pageSize]);
  
  const { 
    data: activeOrgs, 
    totalCount: activeTotalCount,
    totalPages: activeTotalPages,
    loading: activeLoading, 
    error: activeError, 
    refetch: refetchActive 
  } = usePaginatedOrganizations(activeFilters, activePagination);
  
  const { 
    data: archivedOrgs, 
    totalCount: archivedTotalCount,
    totalPages: archivedTotalPages,
    loading: archivedLoading, 
    error: archivedError, 
    refetch: refetchArchived 
  } = usePaginatedOrganizations(archivedFilters, archivedPagination);
  
  const { createOrganization, updateOrganization, archiveOrganization, unarchiveOrganization, loading: mutationLoading } = useOrganizationMutations();
  const { loading: exportLoading, exportToExcel } = useOrganizationExport();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);

  const form = useForm<CreateOrganizationData>({
    initialValues: {
      name: '',
      legal_name: '',
      gst_number: '',
      pan_number: '',
      cin_number: '',
      email: '',
      phone: '',
      address_line1: '',
      address_line2: '',
      city: '',
      state: '',
      postal_code: '',
      country: 'India'
    },
    validate: {
      name: (value) => (value.length < 2 ? 'Name must be at least 2 characters' : null),
      email: (value) => value && !/^\S+@\S+$/.test(value) ? 'Invalid email' : null,
    },
  });

  const resetForm = () => {
    form.reset();
    setEditingOrg(null);
  };

  const handleSubmit = async (values: CreateOrganizationData) => {
    try {
      if (editingOrg) {
        const result = await updateOrganization({ ...values, id: editingOrg.id });
        if (result) {
          notifications.show({
            title: 'Success',
            message: 'Organization updated successfully',
            color: 'green'
          });
          setIsModalOpen(false);
          resetForm();
          refetchActive();
          refetchArchived();
        }
      } else {
        const result = await createOrganization(values);
        if (result) {
          notifications.show({
            title: 'Success',
            message: 'Organization created successfully',
            color: 'green'
          });
          setIsModalOpen(false);
          resetForm();
          refetchActive();
          refetchArchived();
        }
      }
    } catch {
      notifications.show({
        title: 'Error',
        message: 'Failed to save organization',
        color: 'red'
      });
    }
  };

  const handleEdit = (org: Organization) => {
    setEditingOrg(org);
    form.setValues({
      name: org.name,
      legal_name: org.legal_name || '',
      gst_number: org.gst_number || '',
      pan_number: org.pan_number || '',
      cin_number: org.cin_number || '',
      email: org.email || '',
      phone: org.phone || '',
      address_line1: org.address_line1 || '',
      address_line2: org.address_line2 || '',
      city: org.city || '',
      state: org.state || '',
      postal_code: org.postal_code || '',
      country: org.country
    });
    setIsModalOpen(true);
  };


  const handleArchive = async (org: Organization) => {
    modals.openConfirmModal({
      title: 'Archive Organization',
      children: (
        <Stack gap="sm">
          <Text size="sm">
            Are you sure you want to archive the organization <strong>"{org.name}"</strong>?
          </Text>
          <Text size="sm" c="dimmed">
            Archiving will:
          </Text>
          <ul style={{ margin: '0', paddingLeft: '1.2rem' }}>
            <li><Text size="sm" c="dimmed">Hide this organization from active listings</Text></li>
            <li><Text size="sm" c="dimmed">Prevent new service requests from being created</Text></li>
            <li><Text size="sm" c="dimmed">Keep all existing data and history intact</Text></li>
          </ul>
          <Text size="sm" c="orange" fw={500}>
            This action can be reversed by unarchiving the organization later.
          </Text>
        </Stack>
      ),
      labels: { confirm: 'Archive Organization', cancel: 'Cancel' },
      confirmProps: { color: 'orange' },
      onConfirm: async () => {
        const result = await archiveOrganization(org.id);
        if (result) {
          notifications.show({
            title: 'Success',
            message: `Organization "${org.name}" archived successfully`,
            color: 'blue'
          });
          refetchActive();
          refetchArchived();
        }
      },
    });
  };

  const handleUnarchive = async (org: Organization) => {
    modals.openConfirmModal({
      title: 'Unarchive Organization',
      children: (
        <Stack gap="sm">
          <Text size="sm">
            Are you sure you want to unarchive the organization <strong>"{org.name}"</strong>?
          </Text>
          <Text size="sm" c="dimmed">
            Unarchiving will:
          </Text>
          <ul style={{ margin: '0', paddingLeft: '1.2rem' }}>
            <li><Text size="sm" c="dimmed">Make this organization visible in active listings</Text></li>
            <li><Text size="sm" c="dimmed">Allow new service requests to be created</Text></li>
            <li><Text size="sm" c="dimmed">Restore full functionality</Text></li>
          </ul>
        </Stack>
      ),
      labels: { confirm: 'Unarchive Organization', cancel: 'Cancel' },
      confirmProps: { color: 'green' },
      onConfirm: async () => {
        const result = await unarchiveOrganization(org.id);
        if (result) {
          notifications.show({
            title: 'Success',
            message: `Organization "${org.name}" unarchived successfully`,
            color: 'green'
          });
          refetchActive();
          refetchArchived();
        }
      },
    });
  };

  const handleViewDetails = (org: Organization) => {
    navigate(`/admin/organization/${org.id}`);
  };

  const handleSearchReset = () => {
    setSearchQuery('');
    setActivePage(1);
    setArchivedPage(1);
  };

  const handleTabChange = (value: string | null) => {
    setActiveTab(value);
    // Reset pagination when switching tabs
    if (value === 'active') {
      setActivePage(1);
    } else {
      setArchivedPage(1);
    }
  };

  const currentError = activeTab === 'active' ? activeError : archivedError;
  const currentFilters = activeTab === 'active' ? activeFilters : archivedFilters;
  const hasActiveFilters = Object.values(currentFilters).some(value => value !== undefined && value !== '');

  const handleExport = () => {
    exportToExcel(currentFilters);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleRefresh = () => {
    refetchActive();
    refetchArchived();
  };

  if (currentError) return <Alert color="red" title="Error">{currentError}</Alert>;

  return (
    <Card>
    <Stack gap="md" p={{ base: 'sm', md: 'md' }}>
      <Group justify="space-between" style={{ flexWrap: 'wrap', gap: 'md' }}>
        <Title order={2}>Organizations</Title>
        <Group>
          <Button
            leftSection={<IconRefresh size={16} />}
            variant="subtle"
            onClick={handleRefresh}
            loading={activeLoading || archivedLoading}
          >
            Refresh
          </Button>
          <Button
            leftSection={<IconDownload size={16} />}
            variant="outline"
            onClick={handleExport}
            loading={exportLoading}
            title={hasActiveFilters ? "Export filtered results (max 500 records)" : "Export all organizations (max 500 records)"}
          >
            {hasActiveFilters ? "Export Filtered" : "Export Excel"}
          </Button>
          <Button
            leftSection={<IconPrinter size={16} />}
            variant="outline"
            onClick={handlePrint}
          >
            Print
          </Button>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={() => setIsModalOpen(true)}
          >
            Add Organization
          </Button>
        </Group>
      </Group>

      <Paper p="md" mb="md">
        <Group style={{ flexWrap: 'wrap', gap: 'md' }}>
          <TextInput
            leftSection={<IconSearch size={16} />}
            placeholder="Search organizations by name, email, or phone..."
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
            style={{ flex: 1, minWidth: 250 }}
          />
          <Button variant="outline" onClick={handleSearchReset} disabled={!searchQuery}>
            Clear
          </Button>
        </Group>
      </Paper>

      <Tabs value={activeTab} onChange={handleTabChange}>
        <Tabs.List style={{ overflowX: 'auto', whiteSpace: 'nowrap' }}>
          <Tabs.Tab value="active">Active Organizations ({activeTotalCount})</Tabs.Tab>
          <Tabs.Tab value="archived">Archived Organizations ({archivedTotalCount})</Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="active" pt="md">
          <Paper p="md">
            <div style={{ overflowX: 'auto' }}>
              <Table highlightOnHover style={{ minWidth: '700px' }}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Phone</Table.Th>
                    <Table.Th>City</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                {activeLoading ? (
                  <Table.Tr>
                    <Table.Td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                      <Loader size="md" />
                    </Table.Td>
                  </Table.Tr>
                ) : activeOrgs.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--mantine-color-dimmed)' }}>
                      No organizations found
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  activeOrgs.map((org) => (
                    <Table.Tr key={org.id} style={{ cursor: 'pointer' }} onClick={() => handleViewDetails(org)}>
                      <Table.Td>
                        <div>
                          <div style={{ fontWeight: 500 }}>{org.name}</div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--mantine-color-dimmed)' }}>
                            {org.legal_name}
                          </div>
                        </div>
                      </Table.Td>
                      <Table.Td>{org.email}</Table.Td>
                      <Table.Td>{org.phone}</Table.Td>
                      <Table.Td>{org.city}</Table.Td>
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
                                handleViewDetails(org);
                              }}
                            >
                              View Details
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<IconEdit size={14} />}
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleEdit(org);
                              }}
                            >
                              Edit
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<IconArchive size={14} />}
                              color="yellow"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleArchive(org);
                              }}
                            >
                              Archive
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
                    Showing {((activePage - 1) * pageSize) + 1} to {Math.min(activePage * pageSize, activeTotalCount)} of {activeTotalCount} results
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
                      setActivePage(1);
                      setArchivedPage(1);
                    }}
                    w={130}
                  />
                </Group>
                <Pagination
                  value={activePage}
                  onChange={setActivePage}
                  total={activeTotalPages}
                  size="sm"
                />
              </Group>
            </Stack>
          </Paper>
        </Tabs.Panel>

        <Tabs.Panel value="archived" pt="md">
          <Paper shadow="xs" p="md">
            <div style={{ overflowX: 'auto' }}>
              <Table striped highlightOnHover style={{ minWidth: '700px' }}>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Name</Table.Th>
                    <Table.Th>Email</Table.Th>
                    <Table.Th>Phone</Table.Th>
                    <Table.Th>City</Table.Th>
                    <Table.Th>Actions</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                {archivedLoading ? (
                  <Table.Tr>
                    <Table.Td colSpan={5} style={{ textAlign: 'center', padding: '2rem' }}>
                      <Loader size="md" />
                    </Table.Td>
                  </Table.Tr>
                ) : archivedOrgs.length === 0 ? (
                  <Table.Tr>
                    <Table.Td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--mantine-color-dimmed)' }}>
                      No archived organizations found
                    </Table.Td>
                  </Table.Tr>
                ) : (
                  archivedOrgs.map((org) => (
                    <Table.Tr key={org.id} style={{ cursor: 'pointer' }} onClick={() => handleViewDetails(org)}>
                      <Table.Td>
                        <div>
                          <div style={{ fontWeight: 500 }}>{org.name}</div>
                          <div style={{ fontSize: '0.875rem', color: 'var(--mantine-color-dimmed)' }}>
                            {org.legal_name}
                          </div>
                        </div>
                      </Table.Td>
                      <Table.Td>{org.email}</Table.Td>
                      <Table.Td>{org.phone}</Table.Td>
                      <Table.Td>{org.city}</Table.Td>
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
                                handleViewDetails(org);
                              }}
                            >
                              View Details
                            </Menu.Item>
                            <Menu.Item
                              leftSection={<IconRestore size={14} />}
                              color="green"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleUnarchive(org);
                              }}
                            >
                              Unarchive
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
                    Showing {((archivedPage - 1) * pageSize) + 1} to {Math.min(archivedPage * pageSize, archivedTotalCount)} of {archivedTotalCount} results
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
                      setActivePage(1);
                      setArchivedPage(1);
                    }}
                    w={130}
                  />
                </Group>
                <Pagination
                  value={archivedPage}
                  onChange={setArchivedPage}
                  total={archivedTotalPages}
                  size="sm"
                />
              </Group>
            </Stack>
          </Paper>
        </Tabs.Panel>
      </Tabs>

      <Modal
        opened={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          resetForm();
        }}
        title={editingOrg ? 'Edit Organization' : 'Add Organization'}
        size="xl"
        styles={{
          body: { maxHeight: '80vh', overflowY: 'auto' }
        }}
      >
        <form onSubmit={form.onSubmit(handleSubmit)}>
          <Grid>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Name"
                placeholder="Organization name"
                required
                {...form.getInputProps('name')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Legal Name"
                placeholder="Legal name"
                {...form.getInputProps('legal_name')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="GST Number"
                placeholder="GST number"
                {...form.getInputProps('gst_number')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="PAN Number"
                placeholder="PAN number"
                {...form.getInputProps('pan_number')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="CIN Number"
                placeholder="CIN number"
                {...form.getInputProps('cin_number')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Email"
                placeholder="email@example.com"
                type="email"
                {...form.getInputProps('email')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Phone"
                placeholder="Phone number"
                {...form.getInputProps('phone')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Address Line 1"
                placeholder="Address line 1"
                {...form.getInputProps('address_line1')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Address Line 2"
                placeholder="Address line 2"
                {...form.getInputProps('address_line2')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="City"
                placeholder="City"
                {...form.getInputProps('city')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="State"
                placeholder="State"
                {...form.getInputProps('state')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Postal Code"
                placeholder="Postal code"
                {...form.getInputProps('postal_code')}
              />
            </Grid.Col>
            <Grid.Col span={{ base: 12, sm: 6 }}>
              <TextInput
                label="Country"
                placeholder="Country"
                {...form.getInputProps('country')}
              />
            </Grid.Col>
          </Grid>

          <Group justify="flex-end" mt="md">
            <Button
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            >
              Cancel
            </Button>
            <Button type="submit" loading={mutationLoading}>
              {editingOrg ? 'Update' : 'Create'}
            </Button>
          </Group>
        </form>
      </Modal>
    </Stack>
    </Card>
  );
}
