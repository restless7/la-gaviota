import 'server-only';
import { requireCapability } from '@/src/lib/server/authorization';
import { getServerDatabase } from '@/src/lib/server/database';

import { auth, clerkClient } from '@clerk/nextjs/server';

type AuditCategory = 'PRICING' | 'KITS' | 'SUPPLIER' | 'ORDERS' | 'SYSTEM';

export async function logAdminAction(
  category: AuditCategory,
  action_type: string,
  description: string,
  reference_id?: string
) {
  try {
    const actor = await requireCapability('audit.write');
    const supabase = getServerDatabase(actor);
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
        actor: actorName,
        action: action_type,
        target: reference_id || 'System',
        category,
        details: description,
        metadata: { actor_clerk_id: userId }
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
