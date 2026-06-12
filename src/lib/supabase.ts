import { createClient } from '@supabase/supabase-js';
import type { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// Types for our business applications table
export type ApplicationStatus = 'pending' | 'approved' | 'rejected';
export type BusinessTier = 'Micromercados' | 'Restaurantes';

export interface BusinessApplication {
  id: string;
  clerk_user_id: string;
  applicant_name: string;
  applicant_email: string;
  business_name: string;
  business_type: BusinessTier;
  nit: string;
  phone: string;
  address: string;
  municipality: string;
  monthly_volume: string;
  notes: string;
  status: ApplicationStatus;
  reviewed_by: string | null;
  reviewed_at: string | null;
  created_at: string;
}
