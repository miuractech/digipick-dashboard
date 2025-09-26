import React, { useState } from 'react';
import {
  Paper,
  Title,
  Group,
  Button,
  TextInput,
  Select,
  Table,
  Badge,
  ActionIcon,
  Modal,
  Stack,
  Text,
  Pagination,
  Menu,
  Loader,
  Card
} from '@mantine/core';
import { useDisclosure } from '@mantine/hooks';
import { DatePickerInput } from '@mantine/dates';
import {
  IconPlus,
  IconSearch,
  IconEye,
  IconEdit,
  IconDownload,
  IconPrinter,
  IconUserPlus,
  IconFilter,
  IconFilterOff,
  IconRefresh,
  IconDots
} from '@tabler/icons-react';
import { useServiceRequests, useServiceRequestActions, useServiceRequestExport } from './service_request.hook';
import { useServiceEngineers } from '../service-engineer/service-engineer.hook';
import type { 
  ServiceRequest, 
  ServiceRequestFilters
} from './service_request.type';
import {
  SERVICE_TYPES,
  SERVICE_STATUSES
} from './service_request.type';
import { ServiceRequestForm } from './ServiceRequestForm';
import { ServiceRequestDetail } from './ServiceRequestDetail';
import { AssignEngineerModal } from './AssignEngineerModal';

export const ServiceRequestComponent: React.FC = () => {
  const [searchValue, setSearchValue] = useState('');
  const [activeFilters, setActiveFilters] = useState<ServiceRequestFilters>({});
  const [selectedServiceRequest, setSelectedServiceRequest] = useState<ServiceRequest | null>(null);
  const [formOpened, { open: openForm, close: closeForm }] = useDisclosure(false);
  const [detailOpened, { open: openDetail, close: closeDetail }] = useDisclosure(false);
  const [filtersOpened, { open: openFilters, close: closeFilters }] = useDisclosure(false);
  const [assignOpened, { open: openAssign, close: closeAssign }] = useDisclosure(false);

  const {
    serviceRequests,
    loading,
    filters,
    pagination,
    updateFilters,
    updatePagination,
    clearFilters,
    refresh
  } = useServiceRequests();

  const { engineers: serviceEngineers } = useServiceEngineers();
  const { assignServiceEngineer, updateStatus } = useServiceRequestActions();
  const { loading: exportLoading, exportToExcel } = useServiceRequestExport();

  const handleSearch = () => {
    updateFilters({ search: searchValue || undefined });
  };

  const handleFilter = (newFilters: ServiceRequestFilters) => {
    setActiveFilters(newFilters);
    updateFilters(newFilters);
    closeFilters();
  };

  const handleClearFilters = () => {
    setActiveFilters({});
    setSearchValue('');
    clearFilters();
  };

  const handleEdit = (serviceRequest: ServiceRequest) => {
    setSelectedServiceRequest(serviceRequest);
    openForm();
  };

  const handleView = (serviceRequest: ServiceRequest) => {
    setSelectedServiceRequest(serviceRequest);
    openDetail();
  };

  const handleAssign = (serviceRequest: ServiceRequest) => {
    setSelectedServiceRequest(serviceRequest);
    openAssign();
  };


  const handleStatusUpdate = async (serviceRequest: ServiceRequest, status: 'pending' | 'completed' | 'cancelled') => {
    await updateStatus(serviceRequest.id, status);
    refresh();
  };

  const handleExport = () => {
    exportToExcel(filters);
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'green';
      case 'cancelled': return 'red';
      case 'pending': return 'yellow';
      default: return 'gray';
    }
  };

  const getServiceTypeLabel = (type: string) => {
    return SERVICE_TYPES.find(t => t.value === type)?.label || type;
  };

  const hasActiveFilters = Object.values(activeFilters).some(value => value !== undefined && value !== '');

  return (
    <Card>
    <Stack gap="md" p={{ base: 'sm', md: 'md' }}>
      <Group justify="space-between" style={{ flexWrap: 'wrap', gap: 'md' }}>
        <Title order={2}>Service Requests</Title>
        <Group>
            <Button
              leftSection={<IconRefresh size={16} />}
              variant="subtle"
              onClick={refresh}
              loading={loading}
            >
              Refresh
            </Button>
            <Button
              leftSection={<IconDownload size={16} />}
              variant="outline"
              onClick={handleExport}
              loading={exportLoading}
              title={hasActiveFilters ? "Export filtered results (max 500 records)" : "Export all service requests (max 500 records)"}
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
              onClick={() => {
                setSelectedServiceRequest(null);
                openForm();
              }}
            >
              Create Request
            </Button>
          </Group>
        </Group>

      <Paper p="md" mb="md">
        <Group style={{ flexWrap: 'wrap', gap: 'md' }}>
          <TextInput
            leftSection={<IconSearch size={16} />}
            placeholder="Search by ticket number, product, or service details..."
            value={searchValue}
            onChange={(e) => setSearchValue(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
            style={{ flex: 1, minWidth: 250 }}
          />
          <Button
            leftSection={<IconFilter size={16} />}
            variant={hasActiveFilters ? "filled" : "outline"}
            onClick={openFilters}
          >
            Filters {hasActiveFilters && `(${Object.keys(activeFilters).length})`}
          </Button>
          {hasActiveFilters && (
            <Button
              leftSection={<IconFilterOff size={16} />}
              variant="outline"
              onClick={handleClearFilters}
            >
              Clear
            </Button>
          )}
        </Group>
      </Paper>

      <Paper p="md">
        <div style={{ overflowX: 'auto' }}>
          <Table highlightOnHover style={{ minWidth: '900px' }}>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Ticket No</Table.Th>
                <Table.Th>Product</Table.Th>
                <Table.Th>Organization</Table.Th>
                <Table.Th>Service Type</Table.Th>
                <Table.Th>Status</Table.Th>
                <Table.Th>Engineer</Table.Th>
                <Table.Th>Date Requested</Table.Th>
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
              ) : serviceRequests.data.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={8} style={{ textAlign: 'center', padding: '2rem', color: 'var(--mantine-color-dimmed)' }}>
                    No service requests found
                  </Table.Td>
                </Table.Tr>
              ) : (
                serviceRequests.data.map((request) => (
                  <Table.Tr key={request.id} style={{ cursor: 'pointer' }} onClick={() => handleView(request)}>
                    <Table.Td>
                      <div>
                        <div style={{ fontWeight: 500 }}>{request.ticket_no}</div>
                        <div style={{ fontSize: '0.875rem', color: 'var(--mantine-color-dimmed)' }}>
                          {new Date(request.date_of_request).toLocaleDateString()}
                        </div>
                      </div>
                    </Table.Td>
                    <Table.Td>{request.product}</Table.Td>
                    <Table.Td>{request.organization?.name}</Table.Td>
                    <Table.Td>{getServiceTypeLabel(request.service_type)}</Table.Td>
                    <Table.Td>
                      <Badge color={getStatusColor(request.status)} variant="light">
                        {request.status}
                      </Badge>
                    </Table.Td>
                    <Table.Td>
                      {request.engineer?.name || (
                        <Text c="dimmed" size="sm">Not assigned</Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      {new Date(request.date_of_request).toLocaleDateString()}
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
                              handleView(request);
                            }}
                          >
                            View Details
                          </Menu.Item>
                          <Menu.Item
                            leftSection={<IconEdit size={14} />}
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              handleEdit(request);
                            }}
                          >
                            Edit
                          </Menu.Item>
                          {!request.service_engineer && (
                            <Menu.Item
                              leftSection={<IconUserPlus size={14} />}
                              color="blue"
                              onClick={(e: React.MouseEvent) => {
                                e.stopPropagation();
                                handleAssign(request);
                              }}
                            >
                              Assign Engineer
                            </Menu.Item>
                          )}
                          <Menu.Divider />
                          <Menu.Item
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              handleStatusUpdate(request, 'pending');
                            }}
                            disabled={request.status === 'pending'}
                          >
                            Mark as Pending
                          </Menu.Item>
                          <Menu.Item
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              handleStatusUpdate(request, 'completed');
                            }}
                            disabled={request.status === 'completed'}
                          >
                            Mark as Completed
                          </Menu.Item>
                          <Menu.Item
                            onClick={(e: React.MouseEvent) => {
                              e.stopPropagation();
                              handleStatusUpdate(request, 'cancelled');
                            }}
                            disabled={request.status === 'cancelled'}
                          >
                            Mark as Cancelled
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
                Showing {((pagination.page - 1) * pagination.pageSize) + 1} to {Math.min(pagination.page * pagination.pageSize, serviceRequests.totalCount)} of {serviceRequests.totalCount} results
              </Text>
              <Select
                data={[
                  { value: '10', label: '10 per page' },
                  { value: '20', label: '20 per page' },
                  { value: '50', label: '50 per page' },
                  { value: '100', label: '100 per page' }
                ]}
                value={pagination.pageSize.toString()}
                onChange={(value) => {
                  updatePagination({ page: 1, pageSize: parseInt(value || '20') });
                }}
                w={130}
              />
            </Group>
            {serviceRequests.totalPages > 1 && (
              <Pagination
                total={serviceRequests.totalPages}
                value={pagination.page}
                onChange={(page) => updatePagination({ page })}
                size="sm"
              />
            )}
          </Group>
        </Stack>
      </Paper>

      {/* Service Request Form Modal */}
      <Modal
        opened={formOpened}
        onClose={closeForm}
        title={selectedServiceRequest ? 'Edit Service Request' : 'Create Service Request'}
        size="xl"
      >
        <ServiceRequestForm
          serviceRequest={selectedServiceRequest}
          onClose={closeForm}
          onSuccess={() => {
            closeForm();
            refresh();
          }}
        />
      </Modal>

      {/* Service Request Detail Modal */}
      <Modal
        opened={detailOpened}
        onClose={closeDetail}
        title="Service Request Details"
        size="xl"
      >
        {selectedServiceRequest && (
          <ServiceRequestDetail
            serviceRequest={selectedServiceRequest}
            onClose={closeDetail}
            onEdit={() => {
              closeDetail();
              openForm();
            }}
          />
        )}
      </Modal>

      {/* Assign Engineer Modal */}
      <Modal
        opened={assignOpened}
        onClose={closeAssign}
        title="Assign Service Engineer"
        size="md"
      >
        {selectedServiceRequest && (
          <AssignEngineerModal
            serviceRequest={selectedServiceRequest}
            serviceEngineers={serviceEngineers}
            onClose={closeAssign}
            onSuccess={async (engineerId: string) => {
              await assignServiceEngineer(selectedServiceRequest.id, engineerId);
              closeAssign();
              refresh();
            }}
          />
        )}
      </Modal>

      {/* Filters Modal */}
      <Modal
        opened={filtersOpened}
        onClose={closeFilters}
        title="Filter Service Requests"
        size="md"
      >
        <FiltersForm
          initialFilters={activeFilters}
          onApply={handleFilter}
          onClose={closeFilters}
        />
      </Modal>
    </Stack>
    </Card>
  );
};

interface FiltersFormProps {
  initialFilters: ServiceRequestFilters;
  onApply: (filters: ServiceRequestFilters) => void;
  onClose: () => void;
}

const FiltersForm: React.FC<FiltersFormProps> = ({ initialFilters, onApply, onClose }) => {
  const [filters, setFilters] = useState<ServiceRequestFilters>(initialFilters);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onApply(filters);
  };

  return (
    <form onSubmit={handleSubmit}>
      <Stack>
        <Select
          label="Service Type"
          placeholder="Select service type"
          data={SERVICE_TYPES}
          value={filters.service_type || ''}
          onChange={(value) => setFilters(prev => ({ ...prev, service_type: value || undefined }))}
          clearable
        />
        <Select
          label="Status"
          placeholder="Select status"
          data={SERVICE_STATUSES}
          value={filters.status || ''}
          onChange={(value) => setFilters(prev => ({ ...prev, status: value || undefined }))}
          clearable
        />
        <DatePickerInput
          label="Date From"
          placeholder="Select start date"
          value={filters.date_from ? new Date(filters.date_from) : null}
          onChange={(date) => setFilters(prev => ({ ...prev, date_from: date ? (date as unknown as Date).toISOString().split('T')[0] : undefined }))}
          clearable
        />
        <DatePickerInput
          label="Date To"
          placeholder="Select end date"
          value={filters.date_to ? new Date(filters.date_to) : null}
          onChange={(date) => setFilters(prev => ({ ...prev, date_to: date ? (date as unknown as Date).toISOString().split('T')[0] : undefined }))}
          clearable
        />
        <Group justify="flex-end" mt="md">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit">
            Apply Filters
          </Button>
        </Group>
      </Stack>
    </form>
  );
};
