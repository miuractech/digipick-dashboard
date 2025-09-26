import supabase from '../supabase';
import type { Device, CreateDeviceData, UpdateDeviceData, DeviceFilters, PaginationParams, PaginatedResponse } from './device.type';

const TABLE_NAME = 'devices';

export const deviceService = {
  async getAll(filters?: DeviceFilters): Promise<Device[]> {
    let query = supabase.from(TABLE_NAME).select('*');
    
    // By default, exclude archived devices unless specifically requested
    if (filters?.include_archived) {
      // Include both archived and non-archived
    } else if (filters?.archived !== undefined) {
      query = query.eq('archived', filters.archived);
    } else {
      // Default: exclude archived devices
      query = query.eq('archived', false);
    }
    
    if (filters?.search) {
      query = query.or(`device_name.ilike.%${filters.search}%,amc_id.ilike.%${filters.search}%,mac_address.ilike.%${filters.search}%,make.ilike.%${filters.search}%,model.ilike.%${filters.search}%`);
    }
    if (filters?.device_name) {
      query = query.ilike('device_name', `%${filters.device_name}%`);
    }
    if (filters?.amc_id) {
      query = query.ilike('amc_id', `%${filters.amc_id}%`);
    }
    if (filters?.mac_address) {
      query = query.ilike('mac_address', `%${filters.mac_address}%`);
    }
    if (filters?.make) {
      query = query.ilike('make', `%${filters.make}%`);
    }
    if (filters?.model) {
      query = query.ilike('model', `%${filters.model}%`);
    }
    if (filters?.company_id) {
      query = query.eq('company_id', filters.company_id);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getPaginated(filters?: DeviceFilters, pagination?: PaginationParams): Promise<PaginatedResponse<Device>> {
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from(TABLE_NAME).select('*', { count: 'exact' });
    
    // By default, exclude archived devices unless specifically requested
    if (filters?.include_archived) {
      // Include both archived and non-archived
    } else if (filters?.archived !== undefined) {
      query = query.eq('archived', filters.archived);
    } else {
      // Default: exclude archived devices
      query = query.eq('archived', false);
    }
    
    // Apply filters
    if (filters?.search) {
      query = query.or(`device_name.ilike.%${filters.search}%,amc_id.ilike.%${filters.search}%,mac_address.ilike.%${filters.search}%,make.ilike.%${filters.search}%,model.ilike.%${filters.search}%`);
    }
    if (filters?.device_name) {
      query = query.ilike('device_name', `%${filters.device_name}%`);
    }
    if (filters?.amc_id) {
      query = query.ilike('amc_id', `%${filters.amc_id}%`);
    }
    if (filters?.mac_address) {
      query = query.ilike('mac_address', `%${filters.mac_address}%`);
    }
    if (filters?.make) {
      query = query.ilike('make', `%${filters.make}%`);
    }
    if (filters?.model) {
      query = query.ilike('model', `%${filters.model}%`);
    }
    if (filters?.company_id) {
      query = query.eq('company_id', filters.company_id);
    }

    const { data, error, count } = await query
      .order('created_at', { ascending: false })
      .range(from, to);
    
    if (error) throw error;

    const totalCount = count || 0;
    const totalPages = Math.ceil(totalCount / pageSize);

    return {
      data: data || [],
      totalCount,
      page,
      pageSize,
      totalPages
    };
  },

  async getById(id: string): Promise<Device | null> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  },

  async getByCompanyId(companyId: string, filters?: Omit<DeviceFilters, 'company_id'>): Promise<Device[]> {
    let query = supabase.from(TABLE_NAME).select('*').eq('company_id', companyId);
    
    // By default, exclude archived devices unless specifically requested
    if (filters?.include_archived) {
      // Include both archived and non-archived
    } else if (filters?.archived !== undefined) {
      query = query.eq('archived', filters.archived);
    } else {
      // Default: exclude archived devices
      query = query.eq('archived', false);
    }
    
    if (filters?.search) {
      query = query.or(`device_name.ilike.%${filters.search}%,amc_id.ilike.%${filters.search}%,mac_address.ilike.%${filters.search}%,make.ilike.%${filters.search}%,model.ilike.%${filters.search}%`);
    }
    if (filters?.device_name) {
      query = query.ilike('device_name', `%${filters.device_name}%`);
    }
    if (filters?.amc_id) {
      query = query.ilike('amc_id', `%${filters.amc_id}%`);
    }
    if (filters?.mac_address) {
      query = query.ilike('mac_address', `%${filters.mac_address}%`);
    }
    if (filters?.make) {
      query = query.ilike('make', `%${filters.make}%`);
    }
    if (filters?.model) {
      query = query.ilike('model', `%${filters.model}%`);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async create(deviceData: CreateDeviceData): Promise<Device> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([deviceData])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(updateData: UpdateDeviceData): Promise<Device> {
    const { id, ...data } = updateData;
    const { data: updatedData, error } = await supabase
      .from(TABLE_NAME)
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return updatedData;
  },

  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from(TABLE_NAME)
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  },

  async archive(id: string): Promise<Device> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({ archived: true })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async unarchive(id: string): Promise<Device> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({ archived: false })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }
};
