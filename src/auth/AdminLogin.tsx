import { useState } from "react";
import {
  Paper,
  TextInput,
  PasswordInput,
  Button,
  Title,
  Text,
  Stack,
  LoadingOverlay,
  Anchor,
  Group,
  Box,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import {
  IconAlertCircle,
  IconCheck,
  IconEye,
  IconEyeOff,
  IconMail,
  IconBrandApple,
  IconBrandGooglePlay,
  IconDownload,
} from "@tabler/icons-react";
import LOGO from "../assets/logo.svg";
import "./AdminLogin.css";
import { useNavigate } from "react-router-dom";
import authService from "./authService";
import type { LoginCredentials } from "./auth";

export default function AdminLogin() {  
  const [isLoading, setIsLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const navigate = useNavigate();
  const loginForm = useForm<LoginCredentials>({
    initialValues: {
      email: "",
      password: "",
    },
    validate: {
      email: (value) => {
        if (!value) return "Email is required";
        if (!/^\S+@\S+$/.test(value)) return "Invalid email format";
        return null;
      },
      password: (value) => {
        if (!value) return "Password is required";
        if (value.length < 8) return "Password must be at least 8 characters";
        return null;
      },
    },
  });

  const resetForm = useForm({
    initialValues: {
      email: "",
    },
    validate: {
      email: (value) => {
        if (!value) return "Email is required";
        if (!/^\S+@\S+$/.test(value)) return "Invalid email format";
        return null;
      },
    },
  });

  const handleLogin = async (values: LoginCredentials) => {
    setIsLoading(true);
    loginForm.setErrors({});

    try {
      const response = await authService.login(values);

      if (response.error) {
        if (response.error.includes("Admin access only")) {
          notifications.show({
            title: "Access Denied",
            message: "Admin access only. Unauthorized user.",
            color: "red",
            icon: <IconAlertCircle />,
          });
        } else {
          notifications.show({
            title: "Login Failed",
            message: response.error,
            color: "red",
            icon: <IconAlertCircle />,
          });
        }
      } else if (response.user) {
        notifications.show({
          title: "Login Successful",
          message: `Welcome back, ${response.user.name}!`,
          color: "green",
          icon: <IconCheck />,
        });

        navigate("/admin/dashboard");
        loginForm.setErrors({});
      }
    } catch (err) {
      console.error("Login error:", err);
      notifications.show({
        title: "Error",
        message: "An unexpected error occurred. Please try again.",
        color: "red",
        icon: <IconAlertCircle />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async (values: { email: string }) => {
    setIsLoading(true);

    try {
      const response = await authService.resetPassword(values);

      if (response.success) {
        notifications.show({
          title: "Reset Link Sent",
          message: response.message,
          color: "green",
          icon: <IconCheck />,
        });
        setShowForgotPassword(false);
      } else {
        notifications.show({
          title: "Reset Failed",
          message: response.message,
          color: "red",
          icon: <IconAlertCircle />,
        });
      }
    } catch (err) {
      console.error("Reset password error:", err);
      notifications.show({
        title: "Error",
        message: "Failed to send reset email. Please try again.",
        color: "red",
        icon: <IconAlertCircle />,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left side - Blue brand section */}
      <div className="hidden bg-gray-50 lg:flex lg:w-1/2 items-center justify-center p-12">
        <div className="text-center text-white">
          <div className="mb-8">
            <img src={LOGO} alt="Image Pick Logo" className="h-24 mx-auto mb-6" />
          </div>
          <div className="text-xl opacity-90 font-light">
            Admin Dashboard
          </div>
        </div>
      </div>

      {/* Right side - Login form */}
      <div className="w-full lg:w-1/2 bg-[#4078c0] flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden text-center mb-8">
            <img src={LOGO} alt="Image Pick Logo" className="h-16 mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800">Image Pick</h1>
          </div>

          <Paper
            p="xl"
            radius="md"
            className="bg-white shadow-lg"
          >
            <LoadingOverlay visible={isLoading} />

            <Stack gap="lg">
              {/* Header */}
              <Box ta="center" mb="md">
                <Title order={2} fw={600} c="gray.8" mb="xs">
                  Sign In
                </Title>
                <Text size="sm" c="gray.6">
                  Sign In to you account
                </Text>
              </Box>


                {!showForgotPassword ? (
                  /* Login Form */
                  <form onSubmit={loginForm.onSubmit(handleLogin)}>
                    <Stack gap="md">
                      {/* App Download Buttons */}
                      <Stack gap="xs" mb="md">
                        <Button 
                          variant="outline" 
                          leftSection={<IconBrandApple size={20} />}
                          className="border-gray-300 hover:bg-gray-50 text-gray-700"
                          component="a"
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            window.open('https://apps.apple.com/app/imagepick', '_blank');
                          }}
                        >
                           Visit App Store
                        </Button>
                        <Button 
                          variant="outline" 
                          leftSection={<IconBrandGooglePlay size={20} />}
                          className="border-gray-300 hover:bg-gray-50 text-gray-700"
                          component="a"
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            window.open('https://play.google.com/store/apps/details?id=com.imagepick', '_blank');
                          }}
                        >
                          Visit Google Play
                        </Button>
                        <Button 
                          variant="outline" 
                          leftSection={<IconDownload size={20} />}
                          className="border-gray-300 hover:bg-gray-50 text-gray-700"
                          component="a"
                          href="#"
                          onClick={(e) => {
                            e.preventDefault();
                            window.open('/downloads/imagepick-manual.pdf', '_blank');
                          }}
                        >
                          Download Manual
                        </Button>
                      </Stack>

                      <Text ta="center" c="gray.6" size="sm" my="md">
                        Admin Login
                      </Text>

                      <TextInput
                        label="Email"
                        placeholder="malualacan@gmail.com"
                        {...loginForm.getInputProps("email")}
                        disabled={isLoading}
                        size="md"
                        className="[&_input]:bg-gray-50"
                      />

                      <PasswordInput
                        label="Password"
                        placeholder="••••••••••"
                        visibilityToggleIcon={({ reveal }) =>
                          reveal ? (
                            <IconEyeOff size={18} />
                          ) : (
                            <IconEye size={18} />
                          )
                        }
                        {...loginForm.getInputProps("password")}
                        disabled={isLoading}
                        size="md"
                        className="[&_input]:bg-gray-50"
                      />

                      <Group justify="space-between" mt="xs" mb="md">
                        <Group gap="xs">
                          <input type="checkbox" id="remember" className="text-blue-600" />
                          <Text size="sm" c="gray.6" component="label" htmlFor="remember">
                            Remember me
                          </Text>
                        </Group>
                        <Anchor
                          size="sm"
                          onClick={() => setShowForgotPassword(true)}
                          className="cursor-pointer text-blue-600 hover:text-blue-700"
                        >
                          Forgot Password?
                        </Anchor>
                      </Group>

                      <Button
                        type="submit"
                        fullWidth
                        size="lg"
                        disabled={isLoading}
                        loading={isLoading}
                        className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                        radius="md"
                      >
                        Sign In
                      </Button>
                    </Stack>
                  </form>
                ) : (
                  /* Reset Password Form */
                  <form onSubmit={resetForm.onSubmit(handleForgotPassword)}>
                    <Stack gap="md">
                      <Title order={3} ta="center" c="gray.8" mb="xs">
                        Reset Password
                      </Title>
                      <Text size="sm" c="gray.6" ta="center" mb="lg">
                        Enter your email address and we'll send you a password reset link
                      </Text>

                      <TextInput
                        label="Email Address"
                        placeholder="Enter your admin email"
                        leftSection={<IconMail size={18} />}
                        {...resetForm.getInputProps("email")}
                        disabled={isLoading}
                        size="md"
                        className="[&_input]:bg-gray-50"
                        required
                      />

                      <Stack gap="sm" mt="lg">
                        <Button
                          type="submit"
                          fullWidth
                          disabled={isLoading}
                          loading={isLoading}
                          size="lg"
                          className="bg-blue-600 hover:bg-blue-700 text-white font-medium"
                          radius="md"
                        >
                          {isLoading ? "Sending..." : "Send Reset Link"}
                        </Button>
                        <Button
                          variant="outline"
                          fullWidth
                          onClick={() => {
                            setShowForgotPassword(false);
                            resetForm.reset();
                          }}
                          disabled={isLoading}
                          size="lg"
                          className="border-gray-300 text-gray-700 hover:bg-gray-50"
                          radius="md"
                        >
                          Back to Login
                        </Button>
                      </Stack>

                      <Text size="xs" c="gray.5" ta="center" mt="md">
                        Check your email for the reset link. It may take a few minutes to arrive.
                      </Text>
                    </Stack>
                  </form>
                )}
              </Stack>
            </Paper>
          </div>
        </div>
      </div>
  
  );
}
