export type Bindings = {
  DB: D1Database;
}

export interface Vote {
  id: number;
  title: string;
  description?: string;
  vote_url: string;
  deadline?: string;
  platform?: string;
  category: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface AdRequest {
  id: number;
  title: string;
  description?: string;
  location: string;
  contact_info?: string;
  deadline?: string;
  category: string;
  status: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}

export interface RadioRequest {
  id: number;
  title: string;
  station_name: string;
  program_name?: string;
  request_url?: string;
  request_method?: string;
  country: string;
  category: string;
  description?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
}
