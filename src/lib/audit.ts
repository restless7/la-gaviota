import { createClient } from '@supabase/supabase-js';
import { auth, clerkClient } from '@clerk/nextjs/server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// Use service role for audit logs to bypass RLS, or ensure admin token is used. We use ANON for now as RLS is "true" for admins, 
// but to securely write server-side without a custom jwt, we should use the service role if available, or just anon if policies allow.
const supabase = createClient(supabaseUrl, process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey);

type AuditCategory = 'PRICING' | 'KITS' | 'SUPPLIER' | 'ORDERS' | 'SYSTEM';

export async function logAdminAction(
  category: AuditCategory,
  action_type: string,
  description: string,
  reference_id?: string
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      console.warn('[Audit Log] Failed to log action: No authenticated user.');
      return;
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const actorName = user.firstName && user.lastName 
      ? `${user.firstName} ${user.lastName}` 
      : user.primaryEmailAddress?.emailAddress || 'Admin Desconocido';

    const { error } = await supabase
      .from('audit_logs')
      .insert({
        user_id: userId,
        actor_name: actorName,
        category,
        action_type,
        description,
        reference_id: reference_id || null
      });

    if (error) {
      console.error('[Audit Log] Failed to insert log to database:', error);
    } else {
      console.log(`[Audit Log] [${category}] ${action_type} - ${description}`);
    }
  } catch (err) {
    console.error('[Audit Log] Critical error during logging:', err);
  }
}
