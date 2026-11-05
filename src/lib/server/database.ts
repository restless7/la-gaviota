import { requireScheduler } from './scheduler';
import 'server-only';
import { createClient } from '@supabase/supabase-js';
import { assertIssuedActor, type Actor } from './authorization';
import { assertStagingSafety } from '../safetyGuard';

// Service role bypasses RLS: guards and scoped queries are the trusted boundary.
// No anonymous-key fallback. Secret is read only after a validated actor is supplied.
export function getServerDatabase(actor: Actor) {
 assertIssuedActor(actor);
 if (process.env.APP_ENV === 'staging' || process.env.NEXT_PUBLIC_APP_ENV === 'staging') {
   assertStagingSafety();
 }
 const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
 if (!url || !key) throw new Error('SERVER_DATABASE_UNCONFIGURED');
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}

// Scheduler credentials are considered a capability only after constant-time verification.
export function getSchedulerDatabase(req: Request) {
 requireScheduler(req);
 return configuredServiceDatabase();
}
function configuredServiceDatabase() {
 if (process.env.APP_ENV === 'staging' || process.env.NEXT_PUBLIC_APP_ENV === 'staging') {
   assertStagingSafety();
 }
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL, key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url || !key) throw new Error('SERVER_DATABASE_UNCONFIGURED');
 return createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
}
// Intentionally public insertion boundary; validation and fixed projection occur before credentials.
export async function insertPublicLead(payload: Record<string,unknown>) {
 const allowed=['fullName','businessName','businessType','phone','email','source'];
 if(Object.keys(payload).some(k=>!allowed.includes(k)) || Object.values(payload).some(v=>typeof v!=='string'||v.length>512) || !payload.fullName || !payload.phone || !payload.businessType) throw new Error('INVALID_LEAD');
 const db=configuredServiceDatabase();
 return db.from('marketing_leads').insert({full_name:payload.fullName,business_name:payload.businessName,business_type:payload.businessType,phone:payload.phone,email:payload.email,source:payload.source||'Landing Page',status:'Nuevo'}).select('id').single();
}

// Public fixed projection; no caller-supplied table or select. Defaults to track_inventory: false if row is absent.
export async function readPublicInventoryFlag() {
 const db=configuredServiceDatabase();
 const {data,error}=await db.from('global_settings').select('track_inventory').eq('id','default').maybeSingle();
 if(error || !data || typeof data.track_inventory!=='boolean') return {track_inventory:false};
 return {track_inventory:data.track_inventory};
}

// Scoped database client for public retail checkout (guest or authenticated retail validation).
export function getGuestCheckoutDatabase() {
 return configuredServiceDatabase();
}
