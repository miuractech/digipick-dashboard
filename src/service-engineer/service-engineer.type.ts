export type ServiceEngineer = {
  id?: string;         // optional unique ID for the engineer
  name: string;        // full name
  comments: string;    // notes about the service
  contact_number: string; // phone number (snake_case for DB)
  email: string;       // email
  expertise: ("demo_installation" | "repair" | "service" | "calibration")[];
};

export type CreateServiceEngineerRequest = Omit<ServiceEngineer, 'id'>;

export type UpdateServiceEngineerRequest = Partial<ServiceEngineer> & {
  id: string;
};

export type ServiceEngineerFilters = {
  name?: string;
  expertise?: string[];
  email?: string;
};
