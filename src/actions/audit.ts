'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface AuditLog {
  id: string;
  created_at: string;
  user_id?: string;
  actor_name: string;
  category: string;
  action_type: string;
  description: string;
  reference_id?: string;
  // Fallbacks for the mock database
  timestamp?: string;
  actor?: string;
  action?: string;
  target?: string;
  details?: string;
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(100);

  if (error || !data) {
    console.error('Error fetching audit logs:', error);
    return [];
  }

  // Normalize category to uppercase so it matches the UI constants
  const normalizedData = data.map(row => ({
    ...row,
    category: row.category ? row.category.toUpperCase() : 'SYSTEM'
  }));

  return normalizedData as AuditLog[];
}
