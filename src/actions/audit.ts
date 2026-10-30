'use server';
import { requireCapability } from '@/src/lib/server/authorization';
import { getServerDatabase } from '@/src/lib/server/database';





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
  const actor = await requireCapability('audit.read');
  const supabase = getServerDatabase(actor);

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
