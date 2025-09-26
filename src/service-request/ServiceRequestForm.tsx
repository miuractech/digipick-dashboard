import React, { useEffect, useState, useMemo, useRef } from 'react';
import { useForm } from '@mantine/form';
import {
  Stack,
  TextInput,
  Textarea,
  Select,
  Button,
  Group,
  Grid,
  Card,
  Text,
  Badge,
  Image,
  AspectRatio,
  ThemeIcon,
  Divider,
  Checkbox,
  Alert,
  Progress,
  Box
} from '@mantine/core';
import { Dropzone, type FileRejection } from '@mantine/dropzone';
import {
  IconBuilding,
  IconDevices,
  IconFileText,
  IconCalendar,
  IconAlertTriangle,
  IconUpload,
  IconX,
  IconFile,
  IconPhoto,
  IconVideo,
  IconTag,
  IconSettings,
  IconCategory,
  IconCloudUpload
} from '@tabler/icons-react';
import { DatePickerInput } from '@mantine/dates';
import { useServiceRequestActions } from './service_request.hook';
import { useOrganizations } from '../organization/organization.hook';
import { useDevices } from '../device/device.hook';
import { useServiceEngineers } from '../service-engineer/service-engineer.hook';
import { useAuth } from '../auth/useAuth';
import supabase from '../supabase';
import { 
  type ServiceRequest, 
  type CreateServiceRequestData, 
  type UpdateServiceRequestData,
  SERVICE_TYPES,
  SERVICE_STATUSES,
  MODE_OF_SERVICE
} from './service_request.type';

interface ServiceRequestFormProps {
  serviceRequest?: ServiceRequest | null;
  onClose: () => void;
  onSuccess: () => void;
}

interface OrganizationSearchProps {
  organizations: Array<{id: string; name: string}>;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

const OrganizationSearch: React.FC<OrganizationSearchProps> = ({ 
  organizations, 
  value, 
  onChange, 
  required 
}) => {
  const [searchValue, setSearchValue] = useState('');
  
  const filteredOrganizations = useMemo(() => {
    if (!searchValue) return organizations.slice(0, 10);
    
    return organizations
      .filter(org => 
        org.name.toLowerCase().includes(searchValue.toLowerCase())
      )
      .slice(0, 10);
  }, [organizations, searchValue]);

  return (
    <Select
      label="Organization"
      placeholder="Search and select organization"
      data={filteredOrganizations.map((org) => ({
        value: org.id,
        label: org.name
      }))}
      value={value}
      onChange={(val) => onChange(val || '')}
      searchable
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      nothingFoundMessage="No organizations found"
      maxDropdownHeight={300}
      required={required}
    />
  );
};

export const ServiceRequestForm: React.FC<ServiceRequestFormProps> = ({
  serviceRequest,
  onClose,
  onSuccess
}) => {
  const { loading, createServiceRequest, updateServiceRequest } = useServiceRequestActions();
  const { organizations } = useOrganizations();
  const { devices } = useDevices();
  const { engineers: serviceEngineers } = useServiceEngineers();
  const { user } = useAuth();
  
  const [forceCreate, setForceCreate] = useState(false);
  const [uploadingFile, setUploadingFile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const isEditing = !!serviceRequest;
  const previousDeviceIdRef = useRef<string>('');

  // Memoize initial values to prevent form re-initialization
  const initialValues = useMemo(() => ({
      product: serviceRequest?.product || '',
      serial_no: serviceRequest?.serial_no || '',
      service_type: serviceRequest?.service_type || 'repair',
      service_details: serviceRequest?.service_details || '',
      organization_id: serviceRequest?.organization_id || '',
      device_id: serviceRequest?.device_id || '',
    user_id: serviceRequest?.user_id || user?.id || '',
      date_of_service: serviceRequest?.date_of_service ? new Date(serviceRequest.date_of_service) : null,
      uploaded_reference: serviceRequest?.uploaded_reference || '',
    uploaded_file_url: serviceRequest?.uploaded_file_url || '',
    mode_of_service: serviceRequest?.mode_of_service || '',
    service_engineer: serviceRequest?.service_engineer || '',
    engineer_comments: serviceRequest?.engineer_comments || '',
    payment_details: serviceRequest?.payment_details || '',
    status: serviceRequest?.status || 'pending'
  }), [serviceRequest, user?.id]);

  // Memoize validation rules to prevent re-renders
  const validationRules = useMemo(() => ({
    product: (value: string) => (!forceCreate && !value ? 'Product is required' : null),
    serial_no: (value: string) => (!forceCreate && !value ? 'Serial number is required' : null),
    service_details: (value: string) => (!forceCreate && !value ? 'Service details are required' : null),
    organization_id: (value: string) => (!forceCreate && !value ? 'Organization is required' : null),
    device_id: (value: string) => (!forceCreate && !value ? 'Device is required' : null),
    date_of_service: (value: Date | null) => {
      if (!value) return null; // Optional field
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to start of day
      const selectedDate = new Date(value);
      selectedDate.setHours(0, 0, 0, 0);
      return selectedDate < today ? 'Service date must be today or in the future' : null;
    }
  }), [forceCreate]);

  const form = useForm({
    initialValues,
    validate: validationRules
  });

  // Filter devices based on selected organization - memoized to prevent re-renders
  const filteredDevices = useMemo(() => {
    return devices.filter(
    (device) => device.company_id === form.values.organization_id
  );
  }, [devices, form.values.organization_id]);

  // Auto-populate device details when device is selected - prevent infinite renders
  useEffect(() => {
    const currentDeviceId = form.values.device_id;
    
    // Only update if device ID changed and we're not editing an existing request
    if (currentDeviceId && 
        currentDeviceId !== previousDeviceIdRef.current && 
        !serviceRequest) {
      
      const selectedDevice = devices.find((d) => d.id === currentDeviceId);
      if (selectedDevice) {
        form.setFieldValue('product', selectedDevice.device_name);
        form.setFieldValue('serial_no', selectedDevice.serial_number || selectedDevice.id);
      }
      
      previousDeviceIdRef.current = currentDeviceId;
    } else if (!currentDeviceId) {
      previousDeviceIdRef.current = '';
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.values.device_id, devices, serviceRequest]);

  // File upload handler
  const handleFileUpload = async (files: File[]) => {
    if (files.length === 0) return;
    
    const file = files[0];
    setUploadedFile(file);
    setUploadingFile(true);
    setUploadProgress(0);

    try {
      // Generate unique filename with timestamp
      const timestamp = Date.now();
      const fileExt = file.name.split('.').pop();
      const fileName = `${user?.id || 'unknown'}_${timestamp}.${fileExt}`;
      const filePath = `service-requests/${fileName}`;

      // Start progress simulation
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 80) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 200);

      // Upload to Supabase Storage
      const { error } = await supabase.storage
        .from('service-files')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (error) {
        throw error;
      }

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('service-files')
        .getPublicUrl(filePath);

      // Update form values
      form.setFieldValue('uploaded_file_url', publicUrl);
      
      // Set reference type based on file type
      if (file.type.startsWith('image/')) {
        form.setFieldValue('uploaded_reference', 'image');
      } else if (file.type.startsWith('video/')) {
        form.setFieldValue('uploaded_reference', 'video');
      } else if (file.type === 'application/pdf') {
        form.setFieldValue('uploaded_reference', 'pdf');
      } else {
        form.setFieldValue('uploaded_reference', 'document');
      }
      
      // Complete progress
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        setUploadingFile(false);
        setUploadProgress(0);
      }, 500);

    } catch (error) {
      console.error('Upload failed:', error);
      setUploadingFile(false);
      setUploadProgress(0);
      
      // Show error notification
      const errorMessage = error instanceof Error ? error.message : 'Upload failed';
      alert(`Upload failed: ${errorMessage}`);
    }
  };

  const removeUploadedFile = async () => {
    if (form.values.uploaded_file_url && uploadedFile) {
      try {
        // Extract file path from URL for deletion
        const url = new URL(form.values.uploaded_file_url);
        const filePath = url.pathname.split('/').slice(-2).join('/'); // Get last two parts of path
        
        // Delete from Supabase Storage
        await supabase.storage
          .from('service-files')
          .remove([filePath]);
      } catch (error) {
        console.error('Failed to delete file:', error);
      }
    }
    
    setUploadedFile(null);
    form.setFieldValue('uploaded_file_url', '');
    form.setFieldValue('uploaded_reference', '');
  };

  const handleSubmit = async (values: typeof form.values) => {
    try {
      // Format date properly for database
      const formattedDate = values.date_of_service ? 
        new Date(values.date_of_service).toISOString().split('T')[0] : null;

      if (serviceRequest) {
        // For updates, only send editable fields
        const updateData: UpdateServiceRequestData = {
          id: serviceRequest.id,
          date_of_service: formattedDate,
          service_engineer: values.service_engineer || null,
          engineer_comments: values.engineer_comments || null,
          payment_details: values.payment_details || null,
          status: values.status
        };
        await updateServiceRequest(updateData);
      } else {
        // For creation, send all required fields
        const createData: CreateServiceRequestData = {
          product: values.product,
          serial_no: values.serial_no,
          service_type: values.service_type,
          service_details: values.service_details,
          organization_id: values.organization_id,
          device_id: values.device_id,
          user_id: user?.id || values.user_id,
          date_of_service: formattedDate,
          uploaded_reference: values.uploaded_reference || null,
          uploaded_file_url: values.uploaded_file_url || null,
          mode_of_service: values.mode_of_service || null
        };
        await createServiceRequest(createData);
      }
      
      onSuccess();
    } catch (error) {
      console.error('Form submission error:', error);
      // Error handling is done in the hook, but log for debugging
    }
  };

  const getServiceTypeLabel = useMemo(() => {
    return (type: string) => SERVICE_TYPES.find(t => t.value === type)?.label || type;
  }, []);

  const getStatusColor = useMemo(() => {
    return (status: string) => {
      switch (status) {
        case 'completed': return 'green';
        case 'cancelled': return 'red';
        case 'pending': return 'yellow';
        default: return 'gray';
      }
    };
  }, []);

  const selectedOrganization = useMemo(() => 
    organizations.find(org => org.id === form.values.organization_id), 
    [organizations, form.values.organization_id]
  );
  
  const selectedDevice = useMemo(() => 
    devices.find(device => device.id === form.values.device_id), 
    [devices, form.values.device_id]
  );

  return (
    <form onSubmit={form.onSubmit(handleSubmit)}>
      <Stack>
        {isEditing && serviceRequest && (
          <Card  padding="lg" mb="md">
            <Stack>
              <Group justify="space-between">
                <Text fw={600} size="lg">Service Request Details</Text>
                <Badge color={getStatusColor(serviceRequest.status)} variant="light">
                  {serviceRequest.status.toUpperCase()}
                </Badge>
              </Group>
              
              <Divider />

              <Grid>
                <Grid.Col span={6}>
                  <Group gap="xs">
                    <ThemeIcon variant="light" size="sm">
                      <IconBuilding size={14} />
                    </ThemeIcon>
                    <div>
                      <Text fw={500}>{serviceRequest.organization?.name || selectedOrganization?.name}</Text>
                    </div>
                  </Group>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Group gap="xs">
                    <ThemeIcon variant="light" size="sm">
                      <IconDevices size={14} />
                    </ThemeIcon>
                    <div>
                      <Text fw={500}>{serviceRequest.device?.device_name || selectedDevice?.device_name}</Text>
                    </div>
                  </Group>
                </Grid.Col>
              </Grid>

              <Grid>
                <Grid.Col span={6}>
                  <Group gap="xs">
                    <ThemeIcon variant="light" size="sm">
                      <IconTag size={14} />
                    </ThemeIcon>
                    <div>
                      <Text fw={500}>{serviceRequest.product}</Text>
                    </div>
                  </Group>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Group gap="xs">
                    <ThemeIcon variant="light" size="sm">
                      <IconTag size={14} />
                    </ThemeIcon>
                    <div>
                      <Text fw={500} truncate size='xs'> {serviceRequest.serial_no}</Text>
                    </div>
                  </Group>
                </Grid.Col>
              </Grid>

        <Grid>
          <Grid.Col span={6}>
                  <Group gap="xs">
                    <ThemeIcon variant="light" size="sm">
                      <IconSettings size={14} />
                    </ThemeIcon>
                    <div>
                      <Text fw={500}>{getServiceTypeLabel(serviceRequest.service_type)}</Text>
                    </div>
                  </Group>
                </Grid.Col>
                <Grid.Col span={6}>
                  <Group gap="xs">
                    <ThemeIcon variant="light" size="sm">
                      <IconSettings size={14} />
                    </ThemeIcon>
                    <div>
                      <Text fw={500}>{serviceRequest.mode_of_service || 'Not specified'}</Text>
                    </div>
                  </Group>
                </Grid.Col>
              </Grid>

              <div>
                <Group gap="xs" mb="xs">
                  <ThemeIcon variant="light" size="sm">
                    <IconFileText size={14} />
                  </ThemeIcon>
                <Text size="sm">{serviceRequest.service_details}</Text>
                </Group>

              </div>

              <div>
                <Group gap="xs">
                  <ThemeIcon variant="light" size="sm">
                    <IconCalendar size={14} />
                  </ThemeIcon>
                  <div>
                    <Text size="sm" c="dimmed">Date Requested</Text>
                    <Text fw={500}>{new Date(serviceRequest.date_of_request).toLocaleDateString()}</Text>
                  </div>
                </Group>
              </div>

              {serviceRequest.uploaded_reference && (
                <div>
                  <Group gap="xs" mb="xs">
                    <ThemeIcon variant="light" size="sm">
                      <IconCategory size={14} />
                    </ThemeIcon>
                    <div>
                      <Text size="sm" c="dimmed">Reference Type</Text>
                      <Text fw={500}>{serviceRequest.uploaded_reference}</Text>
                    </div>
                  </Group>
                </div>
              )}

              {serviceRequest.uploaded_file_url && (
                <div>
                  <Group gap="xs" mb="xs">
                    <ThemeIcon variant="light" size="sm">
                      <IconCloudUpload size={14} />
                    </ThemeIcon>
                    <Text size="sm" c="dimmed">Uploaded Media</Text>
                  </Group>
                  {serviceRequest.uploaded_reference?.includes('image') || 
                   serviceRequest.uploaded_file_url.match(/\.(jpg|jpeg|png|gif|webp)$/i) ? (
                    <AspectRatio ratio={16 / 9} maw={400}>
                      <Image
                        src={serviceRequest.uploaded_file_url}
                        alt="Service request reference"
                        fit="contain"
                        fallbackSrc="data:image/svg+xml,%3csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100' height='100' fill='%23ddd'/%3e%3ctext x='50' y='50' text-anchor='middle' dy='.3em'%3eImage%3c/text%3e%3c/svg%3e"
                      />
                    </AspectRatio>
                  ) : serviceRequest.uploaded_reference?.includes('video') || 
                       serviceRequest.uploaded_file_url.match(/\.(mp4|webm|ogg|mov)$/i) ? (
                    <AspectRatio ratio={16 / 9} maw={400}>
                      <video controls style={{ width: '100%', height: '100%' }}>
                        <source src={serviceRequest.uploaded_file_url} type="video/mp4" />
                        Your browser does not support the video tag.
                      </video>
                    </AspectRatio>
                  ) : (
                    <Text size="sm" c="blue" component="a" href={serviceRequest.uploaded_file_url} target="_blank">
                      View File
                    </Text>
                  )}
                </div>
              )}
            </Stack>
          </Card>
        )}

        {!isEditing && (
          <>
            {!user && (
              <Alert 
                icon={<IconAlertTriangle size={16} />} 
                title="Authentication Required" 
                color="red"
                mb="md"
              >
                You must be logged in to create service requests.
              </Alert>
            )}
            
            {forceCreate && (
              <Alert 
                icon={<IconAlertTriangle size={16} />} 
                title="Force Create Mode" 
                color="yellow"
                mb="md"
              >
                Creating service request with minimal validation. Ensure all data is correct.
              </Alert>
            )}
            
             <Checkbox
               label="Force create (bypass validation warnings)"
               checked={forceCreate}
               onChange={(event) => setForceCreate(event.currentTarget.checked)}
               mb="md"
             />

            <Grid>
              <Grid.Col span={6}>
                <OrganizationSearch
                  organizations={organizations}
                  value={form.values.organization_id}
                  onChange={(value) => form.setFieldValue('organization_id', value)}
                  required={!forceCreate}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <Select
              label="Device"
              placeholder="Select device"
                  data={filteredDevices.slice(0, 20).map((device) => ({
                value: device.id,
                label: device.device_name
              }))}
              {...form.getInputProps('device_id')}
              disabled={!form.values.organization_id}
                  required={!forceCreate}
                  searchable
                  nothingFoundMessage="No devices found for this organization"
            />
          </Grid.Col>
        </Grid>

        <Grid>
          <Grid.Col span={6}>
            <TextInput
              label="Product"
              placeholder="Enter product name"
              {...form.getInputProps('product')}
                  required={!forceCreate}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label="Serial Number"
              placeholder="Enter serial number"
              {...form.getInputProps('serial_no')}
                  required={!forceCreate}
            />
          </Grid.Col>
        </Grid>

        <Grid>
          <Grid.Col span={6}>
            <Select
              label="Service Type"
              placeholder="Select service type"
              data={SERVICE_TYPES}
              {...form.getInputProps('service_type')}
                  required={!forceCreate}
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <Select
              label="Mode of Service"
              placeholder="Select mode of service"
              data={MODE_OF_SERVICE}
              {...form.getInputProps('mode_of_service')}
              clearable
            />
          </Grid.Col>
        </Grid>

        <Textarea
          label="Service Details"
          placeholder="Describe the service required..."
          minRows={3}
          {...form.getInputProps('service_details')}
              required={!forceCreate}
        />

        <Grid>
          <Grid.Col span={6}>
            <DatePickerInput
              label="Preferred Service Date"
              placeholder="Select preferred date"
                   {...form.getInputProps('date_of_service')}
                   minDate={new Date()}
                   clearable
            />
          </Grid.Col>
          <Grid.Col span={6}>
            <TextInput
              label="Reference Type"
              placeholder="e.g., video, image, pdf"
              {...form.getInputProps('uploaded_reference')}
                   disabled
            />
          </Grid.Col>
        </Grid>

             {/* File Upload Section */}
             <Box>
               <Text size="sm" fw={500} mb="xs">Upload Reference File</Text>
               
               {!form.values.uploaded_file_url ? (
                 <Dropzone
                   onDrop={handleFileUpload}
                   onReject={(fileRejections: FileRejection[]) => console.log('rejected files', fileRejections)}
                   maxSize={50 * 1024 ** 2} // 50MB
                   accept={{
                     'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp'],
                     'video/*': ['.mp4', '.avi', '.mov', '.wmv', '.flv', '.webm'],
                     'application/pdf': ['.pdf'],
                     'text/plain': ['.txt'],
                     'application/msword': ['.doc'],
                     'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx']
                   }}
                   disabled={uploadingFile}
                 >
                   <Group justify="center" gap="xl" mih={120} style={{ pointerEvents: 'none' }}>
                     <Dropzone.Accept>
                       <IconUpload size={52} color="var(--mantine-color-blue-6)" stroke={1.5} />
                     </Dropzone.Accept>
                     <Dropzone.Reject>
                       <IconX size={52} color="var(--mantine-color-red-6)" stroke={1.5} />
                     </Dropzone.Reject>
                     <Dropzone.Idle>
                       <IconFile size={52} color="var(--mantine-color-dimmed)" stroke={1.5} />
                     </Dropzone.Idle>

                     <div>
                       <Text size="xl" inline>
                         Drag files here or click to select
                       </Text>
                       <Text size="sm" c="dimmed" inline mt={7}>
                         Attach images, videos, or documents (max 50MB)
                       </Text>
                       <Text size="xs" c="dimmed" mt={4}>
                         Supported: Images, Videos, PDF, Word documents
                       </Text>
                     </div>
                   </Group>
                 </Dropzone>
               ) : (
                 <Card withBorder p="md">
                   <Group justify="space-between">
                     <Group>
                       {form.values.uploaded_reference === 'image' && <IconPhoto size={20} color="green" />}
                       {form.values.uploaded_reference === 'video' && <IconVideo size={20} color="blue" />}
                       {!['image', 'video'].includes(form.values.uploaded_reference) && <IconFile size={20} color="gray" />}
                       <div>
                         <Text size="sm" fw={500}>
                           {uploadedFile?.name || 'Uploaded file'}
                         </Text>
                         <Text size="xs" c="dimmed">
                           {form.values.uploaded_reference} • {uploadedFile && (uploadedFile.size / 1024 / 1024).toFixed(2)} MB
                         </Text>
                       </div>
                     </Group>
                     <Button
                       variant="outline"
                       color="red"
                       size="xs"
                       onClick={removeUploadedFile}
                       leftSection={<IconX size={14} />}
                     >
                       Remove
                     </Button>
                   </Group>
                   
                   {/* Preview for images */}
                   {form.values.uploaded_reference === 'image' && form.values.uploaded_file_url && (
                     <Box mt="md">
                       <Text size="xs" c="dimmed" mb="xs">Preview:</Text>
                       <AspectRatio ratio={16 / 9} maw={300}>
                         <Image
                           src={form.values.uploaded_file_url}
                           alt="Uploaded preview"
                           fit="contain"
                           fallbackSrc="data:image/svg+xml,%3csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3e%3crect width='100' height='100' fill='%23ddd'/%3e%3ctext x='50' y='50' text-anchor='middle' dy='.3em'%3eImage%3c/text%3e%3c/svg%3e"
                         />
                       </AspectRatio>
                     </Box>
                   )}
                 </Card>
               )}

               {uploadingFile && (
                 <Box mt="sm">
                   <Group justify="space-between" mb="xs">
                     <Text size="sm">Uploading...</Text>
                     <Text size="sm">{uploadProgress}%</Text>
                   </Group>
                   <Progress value={uploadProgress} size="sm" />
                 </Box>
               )}
             </Box>
          </>
        )}

        {/* Editable fields for both create and edit modes */}
        {isEditing && (
          <>
            <Text fw={600} size="md" mt="lg">Update Service Request</Text>
            <Divider />
            
            <DatePickerInput
              label="Preferred Service Date"
              placeholder="Select preferred date"
              {...form.getInputProps('date_of_service')}
              minDate={new Date()}
              clearable
            />

            <Grid>
              <Grid.Col span={6}>
                <Select
                  label="Service Engineer"
                  placeholder="Select service engineer"
                  data={serviceEngineers.filter(engineer => engineer.id).map((engineer) => ({
                    value: engineer.id!,
                    label: engineer.name
                  }))}
                  {...form.getInputProps('service_engineer')}
                  clearable
                />
              </Grid.Col>
              <Grid.Col span={6}>
                <Select
                  label="Status"
                  placeholder="Select status"
                  data={SERVICE_STATUSES}
                  {...form.getInputProps('status')}
                  required
                />
              </Grid.Col>
            </Grid>

            <Textarea
              label="Engineer Comments"
              placeholder="Enter engineer comments..."
              minRows={3}
              {...form.getInputProps('engineer_comments')}
            />

            <Textarea
              label="Payment Details"
              placeholder="Enter payment details..."
              minRows={2}
              {...form.getInputProps('payment_details')}
            />
          </>
        )}

        <Group justify="flex-end" mt="md">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button 
            type="submit" 
            loading={loading}
            disabled={!isEditing && !user && !forceCreate}
          >
            {serviceRequest ? 'Update' : 'Create'} Service Request
          </Button>
        </Group>
      </Stack>
    </form>
  );
};
