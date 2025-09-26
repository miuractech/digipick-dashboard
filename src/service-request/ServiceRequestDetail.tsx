import React from 'react';
import {
  Stack,
  Group,
  Text,
  Badge,
  Button,
  Card,
  Grid,
  Divider,
  Title,
  ThemeIcon,
  Timeline,
  ActionIcon,
  Tooltip
} from '@mantine/core';
import {
  IconUser,
  IconBuilding,
  IconDevices,
  IconFileText,
  IconPrinter,
  IconDownload,
  IconEdit
} from '@tabler/icons-react';
import type { ServiceRequest } from './service_request.type';
import { SERVICE_TYPES } from './service_request.type';

interface ServiceRequestDetailProps {
  serviceRequest: ServiceRequest;
  onClose: () => void;
  onEdit: () => void;
}

export const ServiceRequestDetail: React.FC<ServiceRequestDetailProps> = ({
  serviceRequest,
  onClose,
  onEdit
}) => {
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

  const handlePrint = () => {
    const printContent = document.getElementById('service-request-detail');
    if (printContent) {
      const printWindow = window.open('', '_blank');
      if (printWindow) {
        printWindow.document.write(`
          <html>
            <head>
              <title>Service Request - ${serviceRequest.ticket_no}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 20px; }
                .header { text-align: center; margin-bottom: 30px; }
                .section { margin-bottom: 20px; }
                .field { margin-bottom: 10px; }
                .label { font-weight: bold; }
                .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; }
                .status-pending { background-color: #fff9db; color: #996600; }
                .status-completed { background-color: #d3f9d8; color: #2b8a3e; }
                .status-cancelled { background-color: #ffe0e6; color: #c92a2a; }
                @media print { .no-print { display: none; } }
              </style>
            </head>
            <body>
              ${printContent.innerHTML}
            </body>
          </html>
        `);
        printWindow.document.close();
        printWindow.print();
      }
    }
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const content = `
Service Request Details
======================

Ticket Number: ${serviceRequest.ticket_no}
Product: ${serviceRequest.product}
Serial Number: ${serviceRequest.serial_no}
Service Type: ${getServiceTypeLabel(serviceRequest.service_type)}
Status: ${serviceRequest.status}

Organization: ${serviceRequest.organization?.name || 'N/A'}
Device: ${serviceRequest.device?.device_name || 'N/A'}

Service Details:
${serviceRequest.service_details}

Date of Request: ${new Date(serviceRequest.date_of_request).toLocaleString()}
${serviceRequest.date_of_service ? `Preferred Service Date: ${new Date(serviceRequest.date_of_service).toLocaleString()}` : ''}
${serviceRequest.mode_of_service ? `Mode of Service: ${serviceRequest.mode_of_service}` : ''}

${serviceRequest.engineer ? `Assigned Engineer: ${serviceRequest.engineer.name} (${serviceRequest.engineer.email})` : 'No engineer assigned'}
${serviceRequest.engineer_comments ? `Engineer Comments: ${serviceRequest.engineer_comments}` : ''}
${serviceRequest.payment_details ? `Payment Details: ${serviceRequest.payment_details}` : ''}

Created: ${new Date(serviceRequest.created_at).toLocaleString()}
Updated: ${new Date(serviceRequest.updated_at).toLocaleString()}
    `;
    
    const file = new Blob([content], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `service_request_${serviceRequest.ticket_no}.txt`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  return (
    <div id="service-request-detail">
      <Stack>
        <Group justify="space-between" className="no-print">
          <Title order={3}>Service Request Details</Title>
          <Group>
            <Tooltip label="Print">
              <ActionIcon variant="outline" onClick={handlePrint}>
                <IconPrinter size={16} />
              </ActionIcon>
            </Tooltip>
            <Tooltip label="Download">
              <ActionIcon variant="outline" onClick={handleDownload}>
                <IconDownload size={16} />
              </ActionIcon>
            </Tooltip>
            <Button leftSection={<IconEdit size={16} />} onClick={onEdit}>
              Edit
            </Button>
          </Group>
        </Group>

        <Card shadow="sm" padding="lg">
          <Stack>
            {/* Header Information */}
            <Group justify="space-between">
              <div>
                <Text size="xl" fw={700}>{serviceRequest.ticket_no}</Text>
                <Text c="dimmed">{serviceRequest.product}</Text>
              </div>
              <Badge 
                color={getStatusColor(serviceRequest.status)} 
                size="lg" 
                variant="light"
              >
                {serviceRequest.status.toUpperCase()}
              </Badge>
            </Group>

            <Divider />

            {/* Basic Information */}
            <Grid>
              <Grid.Col span={6}>
                <Stack gap="xs">
                  <Group>
                    <ThemeIcon variant="light" size="sm">
                      <IconBuilding size={14} />
                    </ThemeIcon>
                    <Text size="sm" fw={500}>Organization</Text>
                  </Group>
                  <Text pl="md">{serviceRequest.organization?.name || 'N/A'}</Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={6}>
                <Stack gap="xs">
                  <Group>
                    <ThemeIcon variant="light" size="sm">
                      <IconDevices size={14} />
                    </ThemeIcon>
                    <Text size="sm" fw={500}>Device</Text>
                  </Group>
                  <Text pl="md">{serviceRequest.device?.device_name || 'N/A'}</Text>
                </Stack>
              </Grid.Col>
            </Grid>

            <Grid>
              <Grid.Col span={6}>
                <Stack gap="xs">
                  <Text size="sm" fw={500}>Serial Number</Text>
                  <Text>{serviceRequest.serial_no}</Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={6}>
                <Stack gap="xs">
                  <Text size="sm" fw={500}>Service Type</Text>
                  <Text>{getServiceTypeLabel(serviceRequest.service_type)}</Text>
                </Stack>
              </Grid.Col>
            </Grid>

            {serviceRequest.mode_of_service && (
              <Stack gap="xs">
                <Text size="sm" fw={500}>Mode of Service</Text>
                <Text>{serviceRequest.mode_of_service}</Text>
              </Stack>
            )}

            <Stack gap="xs">
              <Group>
                <ThemeIcon variant="light" size="sm">
                  <IconFileText size={14} />
                </ThemeIcon>
                <Text size="sm" fw={500}>Service Details</Text>
              </Group>
              <Text pl="md">{serviceRequest.service_details}</Text>
            </Stack>

            <Divider />

            {/* Timeline */}
            <Timeline active={serviceRequest.status === 'completed' ? 2 : serviceRequest.status === 'cancelled' ? 1 : 0}>
              <Timeline.Item title="Request Created">
                <Text size="sm" c="dimmed">
                  {new Date(serviceRequest.date_of_request).toLocaleString()}
                </Text>
              </Timeline.Item>
              
              {serviceRequest.service_engineer && (
                <Timeline.Item title="Engineer Assigned">
                  <Text size="sm">{serviceRequest.engineer?.name}</Text>
                  <Text size="xs" c="dimmed">{serviceRequest.engineer?.email}</Text>
                </Timeline.Item>
              )}

              {serviceRequest.date_of_service && (
                <Timeline.Item title="Preferred Service Date">
                  <Text size="sm" c="dimmed">
                    {new Date(serviceRequest.date_of_service).toLocaleString()}
                  </Text>
                </Timeline.Item>
              )}

              {serviceRequest.status === 'completed' && (
                <Timeline.Item title="Service Completed" color="green">
                  <Text size="sm" c="dimmed">Service has been completed</Text>
                </Timeline.Item>
              )}

              {serviceRequest.status === 'cancelled' && (
                <Timeline.Item title="Service Cancelled" color="red">
                  <Text size="sm" c="dimmed">Service request was cancelled</Text>
                </Timeline.Item>
              )}
            </Timeline>

            {/* Engineer Information */}
            {serviceRequest.service_engineer && (
              <>
                <Divider />
                <Stack gap="xs">
                  <Group>
                    <ThemeIcon variant="light" size="sm">
                      <IconUser size={14} />
                    </ThemeIcon>
                    <Text size="sm" fw={500}>Assigned Engineer</Text>
                  </Group>
                  <Group pl="md">
                    <div>
                      <Text size="sm">{serviceRequest.engineer?.name}</Text>
                      <Text size="xs" c="dimmed">{serviceRequest.engineer?.email}</Text>
                    </div>
                  </Group>
                </Stack>
              </>
            )}

            {/* Engineer Comments */}
            {serviceRequest.engineer_comments && (
              <Stack gap="xs">
                <Text size="sm" fw={500}>Engineer Comments</Text>
                <Text size="sm" pl="md">{serviceRequest.engineer_comments}</Text>
              </Stack>
            )}

            {/* Payment Details */}
            {serviceRequest.payment_details && (
              <Stack gap="xs">
                <Text size="sm" fw={500}>Payment Details</Text>
                <Text size="sm" pl="md">{serviceRequest.payment_details}</Text>
              </Stack>
            )}

            {/* Additional Information */}
            {serviceRequest.uploaded_reference && (
              <Stack gap="xs">
                <Text size="sm" fw={500}>Reference Type</Text>
                <Text size="sm" pl="md">{serviceRequest.uploaded_reference}</Text>
              </Stack>
            )}

            <Divider />

            {/* Timestamps */}
            <Grid>
              <Grid.Col span={6}>
                <Stack gap="xs">
                  <Text size="sm" fw={500}>Created</Text>
                  <Text size="sm">{new Date(serviceRequest.created_at).toLocaleString()}</Text>
                </Stack>
              </Grid.Col>
              <Grid.Col span={6}>
                <Stack gap="xs">
                  <Text size="sm" fw={500}>Last Updated</Text>
                  <Text size="sm">{new Date(serviceRequest.updated_at).toLocaleString()}</Text>
                </Stack>
              </Grid.Col>
            </Grid>
          </Stack>
        </Card>

        <Group justify="flex-end" className="no-print">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </Group>
      </Stack>
    </div>
  );
};
