import supabase from '../supabase';
import type { Organization, CreateOrganizationData, UpdateOrganizationData, OrganizationFilters, PaginationParams, PaginatedResponse } from './organization.type';

const TABLE_NAME = 'company_details';

export const organizationService = {
  async getAll(filters?: OrganizationFilters): Promise<Organization[]> {
    let query = supabase.from(TABLE_NAME).select('*');
    
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
    }
    if (filters?.name) {
      query = query.ilike('name', `%${filters.name}%`);
    }
    if (filters?.email) {
      query = query.ilike('email', `%${filters.email}%`);
    }
    if (filters?.phone) {
      query = query.ilike('phone', `%${filters.phone}%`);
    }
    if (filters?.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }
    if (filters?.state) {
      query = query.ilike('state', `%${filters.state}%`);
    }
    if (filters?.country) {
      query = query.eq('country', filters.country);
    }
    if (filters?.archived !== undefined) {
      query = query.eq('archived', filters.archived);
    }

    const { data, error } = await query.order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  },

  async getPaginated(filters?: OrganizationFilters, pagination?: PaginationParams): Promise<PaginatedResponse<Organization>> {
    const page = pagination?.page || 1;
    const pageSize = pagination?.pageSize || 20;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase.from(TABLE_NAME).select('*', { count: 'exact' });
    
    // Apply filters
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
    }
    if (filters?.name) {
      query = query.ilike('name', `%${filters.name}%`);
    }
    if (filters?.email) {
      query = query.ilike('email', `%${filters.email}%`);
    }
    if (filters?.phone) {
      query = query.ilike('phone', `%${filters.phone}%`);
    }
    if (filters?.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }
    if (filters?.state) {
      query = query.ilike('state', `%${filters.state}%`);
    }
    if (filters?.country) {
      query = query.eq('country', filters.country);
    }
    if (filters?.archived !== undefined) {
      query = query.eq('archived', filters.archived);
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

  async getById(id: string): Promise<Organization | null> {
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

  async create(organizationData: CreateOrganizationData): Promise<Organization> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert([{
        ...organizationData,
        country: organizationData.country || 'India'
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async update(updateData: UpdateOrganizationData): Promise<Organization> {
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


  async archive(id: string): Promise<Organization> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({ archived: true })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async unarchive(id: string): Promise<Organization> {
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .update({ archived: false })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  },

  async exportToExcel(filters?: OrganizationFilters): Promise<Organization[]> {
    let query = supabase.from(TABLE_NAME).select('*');
    
    // Apply same filters as getPaginated but without pagination
    if (filters?.search) {
      query = query.or(`name.ilike.%${filters.search}%,email.ilike.%${filters.search}%,phone.ilike.%${filters.search}%`);
    }
    if (filters?.name) {
      query = query.ilike('name', `%${filters.name}%`);
    }
    if (filters?.email) {
      query = query.ilike('email', `%${filters.email}%`);
    }
    if (filters?.phone) {
      query = query.ilike('phone', `%${filters.phone}%`);
    }
    if (filters?.city) {
      query = query.ilike('city', `%${filters.city}%`);
    }
    if (filters?.state) {
      query = query.ilike('state', `%${filters.state}%`);
    }
    if (filters?.country) {
      query = query.eq('country', filters.country);
    }
    if (filters?.archived !== undefined) {
      query = query.eq('archived', filters.archived);
    }

    // Apply limit of 500 records and order by created date
    const { data, error } = await query
      .order('created_at', { ascending: false })
      .limit(500);
    
    if (error) throw error;
    return data || [];
  }
};
