import { useParams, useNavigate } from 'react-router-dom';
import {
  Stack,
  Paper,
  Title,
  Group,
  Grid,
  Text,
  Badge,
  Loader,
  Alert,
  ActionIcon,
  Tabs,
  Card
} from '@mantine/core';
import { IconArrowLeft, IconDevices, IconUsers } from '@tabler/icons-react';
import { useOrganization } from '../organization/organization.hook';
import { DeviceManagement } from '../device/device_component.service';
import { UserManagement } from '../user/user_component.service';

export default function OrganizationDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { organization, loading, error } = useOrganization(id);

  const handleBack = () => {
    navigate('/admin/organization');
  };

  if (loading) return <Loader size="lg" style={{ display: 'block', margin: '2rem auto' }} />;
  if (error) return <Alert color="red" title="Error">{error}</Alert>;
  if (!organization) return <Alert color="red" title="Error">Organization not found</Alert>;

  return (
    <Stack gap="md" p={{ base: 'sm', md: 'md' }}>
      <Group justify="space-between" style={{ flexWrap: 'wrap', gap: 'md' }}>
        <Group>
          <ActionIcon variant="subtle" onClick={handleBack}>
            <IconArrowLeft size={20} />
          </ActionIcon>
          <Title order={2}>{organization.name} {organization.legal_name && (
              <Text c="dimmed" size="lg">{organization.legal_name}</Text>
            )}</Title>
          {organization.archived && (
            <Badge color="yellow" variant="light">Archived</Badge>
          )}
        </Group>

        {/* <Menu shadow="md" width={200}>
          <Menu.Target>
            <Button variant="outline" rightSection={<IconDots size={16} />}>
              Actions
            </Button>
          </Menu.Target>

          <Menu.Dropdown>
            <Menu.Item
              leftSection={<IconEdit size={14} />}
              onClick={handleEdit}
            >
              Edit
            </Menu.Item>
            {organization.archived ? (
              <Menu.Item
                leftSection={<IconRestore size={14} />}
                color="green"
                onClick={handleUnarchive}
              >
                Unarchive
              </Menu.Item>
            ) : (
              <Menu.Item
                leftSection={<IconArchive size={14} />}
                color="yellow"
                onClick={handleArchive}
              >
                Archive
              </Menu.Item>
            )}
          </Menu.Dropdown>
        </Menu> */}
      </Group>

      <Paper shadow="xs" p="xl">
        <Stack gap="lg">
        

          <Grid>
            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="md">
                <div>
                  <Text size="sm" fw={500} c="dimmed" mb={4}>Email</Text>
                  <Text>{organization.email || 'Not provided'}</Text>
                </div>
                <div>
                  <Text size="sm" fw={500} c="dimmed" mb={4}>Phone</Text>
                  <Text>{organization.phone || 'Not provided'}</Text>
                </div>
                <div>
                  <Text size="sm" fw={500} c="dimmed" mb={4}>GST Number</Text>
                  <Text>{organization.gst_number || 'Not provided'}</Text>
                </div>
                <div>
                  <Text size="sm" fw={500} c="dimmed" mb={4}>PAN Number</Text>
                  <Text>{organization.pan_number || 'Not provided'}</Text>
                </div>
                <div>
                  <Text size="sm" fw={500} c="dimmed" mb={4}>CIN Number</Text>
                  <Text>{organization.cin_number || 'Not provided'}</Text>
                </div>
              </Stack>
            </Grid.Col>

            <Grid.Col span={{ base: 12, md: 6 }}>
              <Stack gap="md">
                <div>
                  <Text size="sm" fw={500} c="dimmed" mb={4}>Address</Text>
                  <Text>
                    {[
                      organization.address_line1,
                      organization.address_line2,
                      organization.city,
                      organization.state,
                      organization.postal_code,
                      organization.country
                    ].filter(Boolean).join(', ') || 'Not provided'}
                  </Text>
                </div>
                <div>
                  <Text size="sm" fw={500} c="dimmed" mb={4}>Created</Text>
                  <Text>{new Date(organization.created_at).toLocaleDateString()}</Text>
                </div>
                <div>
                  <Text size="sm" fw={500} c="dimmed" mb={4}>Last Updated</Text>
                  <Text>{new Date(organization.updated_at).toLocaleDateString()}</Text>
                </div>
              </Stack>
            </Grid.Col>
          </Grid>
        </Stack>
      </Paper>

<Card>
      <Tabs defaultValue="devices" >
        <Tabs.List>
          <Tabs.Tab value="devices" leftSection={<IconDevices size="0.8rem" />}>
            Devices
          </Tabs.Tab>
          <Tabs.Tab value="users" leftSection={<IconUsers size="0.8rem" />}>
            Users
          </Tabs.Tab>
        </Tabs.List>

        <Tabs.Panel value="devices" pt="md">
          <DeviceManagement companyId={organization.id} />
        </Tabs.Panel>

        <Tabs.Panel value="users" pt="md">
          <UserManagement companyId={organization.id} />
        </Tabs.Panel>
      </Tabs>
      </Card>
    </Stack>
  );
}

