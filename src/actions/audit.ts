'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface AuditLog {
  id: string;
  created_at: string;
  user_id: string;
  actor_name: string;
  category: 'PRICING' | 'KITS' | 'SUPPLIER' | 'ORDERS' | 'SYSTEM';
  action_type: string;
  description: string;
  reference_id?: string;
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }

  return data || [];
}
