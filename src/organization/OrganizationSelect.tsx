import React, { useState, useEffect } from 'react';
import { Select, Loader, Text } from '@mantine/core';
import { useDebouncedValue } from '@mantine/hooks';
import { organizationService } from './organization.service';
import type { Organization } from './organization.type';

interface OrganizationSelectProps {
  value?: string;
  onChange: (value: string | null) => void;
  placeholder?: string;
  label?: string;
  clearable?: boolean;
  searchable?: boolean;
  disabled?: boolean;
  error?: string;
}

export const OrganizationSelect: React.FC<OrganizationSelectProps> = ({
  value,
  onChange,
  placeholder = "Search and select organization...",
  label,
  clearable = true,
  searchable = true,
  disabled = false,
  error
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [debouncedSearch] = useDebouncedValue(searchValue, 300);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchOrganizations = async () => {
      try {
        setLoading(true);
        const filters = debouncedSearch ? { search: debouncedSearch } : {};
        const data = await organizationService.getAll(filters);
        
        // Ensure data is an array and limit to first 100 results for performance
        if (Array.isArray(data)) {
          setOrganizations(data.slice(0, 100));
        } else {
          console.warn('Organization service returned non-array data:', data);
          setOrganizations([]);
        }
      } catch (err) {
        console.error('Failed to fetch organizations:', err);
        setOrganizations([]);
      } finally {
        setLoading(false);
      }
    };

    fetchOrganizations();
  }, [debouncedSearch]);

  // Create select data with safety checks
  const selectData = React.useMemo(() => {
    if (!Array.isArray(organizations)) {
      return [];
    }
    
    return organizations
      .filter(org => org && typeof org === 'object' && org.id && org.name)
      .map(org => ({
        value: String(org.id),
        label: String(org.name)
      }));
  }, [organizations]);

  return (
    <Select
      label={label}
      placeholder={placeholder}
      value={value || null}
      onChange={onChange}
      data={selectData || []}
      searchable={searchable}
      clearable={clearable}
      disabled={disabled}
      error={error}
      searchValue={searchValue}
      onSearchChange={setSearchValue}
      rightSection={loading ? <Loader size={16} /> : undefined}
      maxDropdownHeight={300}
      nothingFoundMessage={
        loading ? (
          <Text size="sm" c="dimmed">Searching...</Text>
        ) : searchValue && selectData.length === 0 ? (
          <Text size="sm" c="dimmed">No organizations found</Text>
        ) : (
          <Text size="sm" c="dimmed">Start typing to search organizations</Text>
        )
      }
    />
  );
};
