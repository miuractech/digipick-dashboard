import { Container, Title, Text, Stack, ThemeIcon } from '@mantine/core';
import { IconUsers } from '@tabler/icons-react';

export default function Users() {
  return (
    <Container size="md" py="xl">
      <Stack align="center" gap="lg">
        <ThemeIcon size={80} radius="xl" variant="light" color="blue">
          <IconUsers size={40} />
        </ThemeIcon>
        <Title order={1} ta="center">Users Management</Title>
        <Text size="lg" c="dimmed" ta="center">
          This feature is coming soon. We're working hard to bring you a comprehensive user management system.
        </Text>
        <Text size="sm" c="dimmed" ta="center">
          Stay tuned for updates!
        </Text>
      </Stack>
    </Container>
  );
}
