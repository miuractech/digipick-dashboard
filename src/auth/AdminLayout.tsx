import {
  AppShell,
  Burger,
  Group,
  Text,
  NavLink,
  Button,
  Avatar,
  Box,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { notifications } from "@mantine/notifications";
import {
  IconLogout,
  IconBuilding,
  IconDevices,
  IconHome,
  IconAlertTriangle,
  IconTool,
} from "@tabler/icons-react";
import { useNavigate, useLocation, Outlet } from "react-router-dom";
import { useAuth } from "./useAuth";
import LOGO from "../assets/logo.svg";
import { theme } from "../theme";

export default function AdminLayout() {
  const [opened, { toggle }] = useDisclosure();
  const [desktopOpened, { toggle: toggleDesktop }] = useDisclosure(true);
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      notifications.show({
        title: "Logged Out",
        message: "You have been successfully logged out.",
        color: "blue",
      });
      // Navigation will be handled automatically by ProtectedRoute
    } catch (error) {
      console.error("Logout error:", error);
      notifications.show({
        title: "Logout Error",
        message: "Failed to logout. Please try again.",
        color: "red",
      });
    }
  };


  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <AppShell
      header={{ height: 60 }}
      withBorder={false}
      navbar={{
        width: 300,
        breakpoint: "sm",
        collapsed: { mobile: !opened, desktop: !desktopOpened },
      }}
      padding="md"
    >
      <AppShell.Header>
        <Group h="100%" px="md" justify="space-between">
          <Group>
            <Burger
              opened={opened}
              onClick={toggle}
              hiddenFrom="sm"
              size="sm"
            />
            <Group>
              <Burger
                opened={opened}
                onClick={toggle}
                hiddenFrom="sm"
                size="sm"
              />
              <Burger
                opened={desktopOpened}
                onClick={toggleDesktop}
                visibleFrom="sm"
                size="sm"
              />
            </Group>
            <Group gap="xs">
              <img src={LOGO} alt="Image Pick Logo" className="h-8" />
            </Group>
          </Group>

    
              <Button
                variant="subtle"
              >
                <Group gap="xs">
                  <Avatar size="sm" color="blue">
                    {user?.name.charAt(0).toUpperCase()}
                  </Avatar>
                  <Text size="sm">{user?.name}</Text>
                </Group>
              </Button>
          
        </Group>
      </AppShell.Header>

      <AppShell.Navbar p="md">
        <Box mb="xl">
       

          <NavLink
            label="Dashboard"
            className="rounded-xl m-2 font-light"
            style={{
              padding: "12px",
              fontSize: "18px",
              backgroundColor: isActive("/admin/dashboard")
                ? theme.colors?.primary?.[6]
                : "transparent",
              color: isActive("/admin/dashboard") ? "white" : "black",
            }}
            leftSection={<IconHome size="1rem" />}
            active={isActive("/admin/dashboard")}
            onClick={() => navigate("/admin/dashboard")}
          />

          <NavLink
            label="Organization"
            className="rounded-xl m-2 font-light"
            style={{ padding: "12px", fontSize: "18px",
              backgroundColor: isActive("/admin/organization")
                ? theme.colors?.primary?.[6]
                : "transparent",
              color: isActive("/admin/organization") ? "white" : "black",
             }}
            leftSection={<IconBuilding size="1rem" />}
            active={isActive("/admin/organization")}
            onClick={() => navigate("/admin/organization")}
          />

          <NavLink
            label="Devices"
            className="rounded-xl m-2 font-light"
            style={{ padding: "12px", fontSize: "18px",
              backgroundColor: isActive("/admin/devices")
                ? theme.colors?.primary?.[6]
                : "transparent",
              color: isActive("/admin/devices") ? "white" : "black",
            }}
            leftSection={<IconDevices size="1rem" />}
            active={isActive("/admin/devices")}
            onClick={() => navigate("/admin/devices")}
          />
          <NavLink
            label="Service Request"
            className="rounded-xl m-2 font-light"
            style={{ padding: "12px", fontSize: "18px",
              backgroundColor: isActive("/admin/service-request")
                ? theme.colors?.primary?.[6]
                : "transparent",
              color: isActive("/admin/service-request") ? "white" : "black",
            }}
            leftSection={<IconAlertTriangle size="1rem" />}
            active={isActive("/admin/service-request")}
            onClick={() => navigate("/admin/service-request")}
          />

          <NavLink
            label="Service Engineers"
            className="rounded-xl m-2 font-light"
            style={{ padding: "12px", fontSize: "18px",
              backgroundColor: isActive("/admin/service-engineers")
                ? theme.colors?.primary?.[6]
                : "transparent",
              color: isActive("/admin/service-engineers") ? "white" : "black",
            }}
            leftSection={<IconTool size="1rem" />}
            active={isActive("/admin/service-engineers")}
            onClick={() => navigate("/admin/service-engineers")}
          />
        </Box>

        <Box mt="auto">
       

          <NavLink
            label="Logout"
            className="rounded-xl m-2 font-light"
            style={{ padding: "12px", fontSize: "18px",
              backgroundColor: isActive("/admin/logout")
                ? theme.colors?.primary?.[6]
                : "transparent",
              color: isActive("/admin/logout") ? "white" : "black",
            }}
            leftSection={<IconLogout size="1rem" />}
            color="red"
            onClick={handleLogout}
          />
        </Box>
      </AppShell.Navbar>

      <AppShell.Main className="bg-gray-50">
        <Outlet />
      </AppShell.Main>
    </AppShell>
  );
}
