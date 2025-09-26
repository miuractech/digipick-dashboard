import React, { useState } from 'react';
import {
  Stack,
  Select,
  Button,
  Group,
  Text,
  Card,
  Badge,
  Avatar,
  Grid
} from '@mantine/core';
import type { ServiceRequest } from './service_request.type';
import type { ServiceEngineer } from '../service-engineer/service-engineer.type';

interface AssignEngineerModalProps {
  serviceRequest: ServiceRequest;
  serviceEngineers: ServiceEngineer[];
  onClose: () => void;
  onSuccess: (engineerId: string) => Promise<void>;
}

export const AssignEngineerModal: React.FC<AssignEngineerModalProps> = ({
  serviceRequest,
  serviceEngineers,
  onClose,
  onSuccess
}) => {
  const [selectedEngineerId, setSelectedEngineerId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Filter engineers based on service type expertise
  const compatibleEngineers = serviceEngineers.filter(engineer =>
    engineer.expertise.includes(serviceRequest.service_type)
  );

  const selectedEngineer = serviceEngineers.find(e => e.id === selectedEngineerId);

  const handleAssign = async () => {
    if (!selectedEngineerId) return;
    
    setLoading(true);
    try {
      await onSuccess(selectedEngineerId);
    } catch {
      // Error handling is done in parent component
    } finally {
      setLoading(false);
    }
  };

  return (
    <Stack>
      <Card withBorder p="md">
        <Stack gap="xs">
          <Text fw={500}>Service Request Details</Text>
          <Grid>
            <Grid.Col span={6}>
              <Text size="sm" c="dimmed">Ticket No:</Text>
              <Text size="sm">{serviceRequest.ticket_no}</Text>
            </Grid.Col>
            <Grid.Col span={6}>
              <Text size="sm" c="dimmed">Service Type:</Text>
              <Badge variant="light" size="sm">
                {serviceRequest.service_type}
              </Badge>
            </Grid.Col>
          </Grid>
          <Text size="sm" c="dimmed">Product:</Text>
          <Text size="sm">{serviceRequest.product}</Text>
        </Stack>
      </Card>

      <Stack>
        <Text fw={500}>
          Available Engineers 
          <Text span c="dimmed" size="sm">
            ({compatibleEngineers.length} with required expertise)
          </Text>
        </Text>
        
        <Select
          placeholder="Select a service engineer"
          value={selectedEngineerId}
          onChange={(value) => setSelectedEngineerId(value || '')}
          data={compatibleEngineers.map(engineer => ({
            value: engineer.id!,
            label: `${engineer.name} - ${engineer.email}`
          }))}
          searchable
        />

        {selectedEngineer && (
          <Card withBorder p="md">
            <Group>
              <Avatar size="md" radius="xl">
                {selectedEngineer.name.charAt(0).toUpperCase()}
              </Avatar>
              <div>
                <Text fw={500}>{selectedEngineer.name}</Text>
                <Text size="sm" c="dimmed">{selectedEngineer.email}</Text>
                <Text size="sm" c="dimmed">{selectedEngineer.contact_number}</Text>
              </div>
            </Group>
            <Stack gap="xs" mt="sm">
              <Text size="sm" fw={500}>Expertise:</Text>
              <Group gap="xs">
                {selectedEngineer.expertise.map(skill => (
                  <Badge 
                    key={skill} 
                    variant="outline" 
                    size="sm"
                    color={skill === serviceRequest.service_type ? 'blue' : 'gray'}
                  >
                    {skill}
                  </Badge>
                ))}
              </Group>
              {selectedEngineer.comments && (
                <>
                  <Text size="sm" fw={500}>Notes:</Text>
                  <Text size="sm" c="dimmed">{selectedEngineer.comments}</Text>
                </>
              )}
            </Stack>
          </Card>
        )}

        {compatibleEngineers.length === 0 && (
          <Card withBorder p="md">
            <Text c="dimmed" ta="center">
              No engineers available with the required expertise for "{serviceRequest.service_type}"
            </Text>
          </Card>
        )}
      </Stack>

      <Group justify="flex-end" mt="md">
        <Button variant="outline" onClick={onClose}>
          Cancel
        </Button>
        <Button
          onClick={handleAssign}
          disabled={!selectedEngineerId || compatibleEngineers.length === 0}
          loading={loading}
        >
          Assign Engineer
        </Button>
      </Group>
    </Stack>
  );
};
