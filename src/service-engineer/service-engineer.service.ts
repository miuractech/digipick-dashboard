import supabase from '../supabase';
import type { ServiceEngineer, CreateServiceEngineerRequest, UpdateServiceEngineerRequest, ServiceEngineerFilters } from './service-engineer.type';

export const serviceEngineerService = {
  // Get all service engineers
  async getAll(filters?: ServiceEngineerFilters): Promise<ServiceEngineer[]> {
    let query = supabase.from('service_engineers').select('*');

    if (filters?.name) {
      query = query.ilike('name', `%${filters.name}%`);
    }

    if (filters?.email) {
      query = query.ilike('email', `%${filters.email}%`);
    }

    if (filters?.expertise && filters.expertise.length > 0) {
      query = query.overlaps('expertise', filters.expertise);
    }

    const { data, error } = await query.order('name');
    
    if (error) throw error;
    return data || [];
  },

  // Get service engineer by ID
  async getById(id: string): Promise<ServiceEngineer | null> {
    const { data, error } = await supabase
      .from('service_engineers')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data;
  },

  // Create new service engineer
  async create(engineer: CreateServiceEngineerRequest): Promise<ServiceEngineer> {
    const { data, error } = await supabase
      .from('service_engineers')
      .insert(engineer)
      .select()
      .single();

    if (error) {
        console.error(error);
        throw error};
    return data;
  },

  // Update service engineer
  async update(engineer: UpdateServiceEngineerRequest): Promise<ServiceEngineer> {
    const { id, ...updateData } = engineer;
    const { data, error } = await supabase
      .from('service_engineers')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  // Delete service engineer
  async delete(id: string): Promise<void> {
    const { error } = await supabase
      .from('service_engineers')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },

  // Get engineers by expertise
  async getByExpertise(expertise: string): Promise<ServiceEngineer[]> {
    const { data, error } = await supabase
      .from('service_engineers')
      .select('*')
      .contains('expertise', [expertise])
      .order('name');

    if (error) throw error;
    return data || [];
  }
};
