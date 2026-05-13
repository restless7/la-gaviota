'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  target: string;
  category: 'pricing' | 'order' | 'supplier' | 'system' | 'inventory';
  details: string;
}

export async function fetchAuditLogs(): Promise<AuditLog[]> {
  const { data, error } = await supabase
    .from('audit_logs')
    .select('*')
    .order('timestamp', { ascending: false })
    .limit(50);

  if (error) {
    console.error('Error fetching audit logs:', error);
    return [];
  }

  return data || [];
}

export async function logAuditEvent(log: Omit<AuditLog, 'id' | 'timestamp'>) {
  const { error } = await supabase
    .from('audit_logs')
    .insert([log]);

  if (error) {
    console.error('Error logging audit event:', error);
  }
}
