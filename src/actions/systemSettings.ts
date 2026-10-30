'use server';
import { requireCapability } from '@/src/lib/server/authorization';
import { getServerDatabase } from '@/src/lib/server/database';



import { revalidatePath } from 'next/cache';
import { currentUser } from '@clerk/nextjs/server';


export interface DeliveryZone {
  name: string;
  enabled: boolean;
  minOrder: number;
}

export interface SystemSettings {
  id: string;
  business_name: string;
  nit: string;
  address: string;
  phone: string;
  hours: string;
  delivery_zones: DeliveryZone[];
  notifications: {
    emailNewOrder: boolean;
    emailLowStock: boolean;
    whatsappNewOrder: boolean;
    whatsappDelivery: boolean;
    dailyReport: boolean;
  };
  retail_margin: number;
  micro_margin: number;
  wholesale_margin: number;
}

export async function fetchSystemSettings(): Promise<SystemSettings> {
  const actor = await requireCapability('settings.read');
  const supabase = getServerDatabase(actor);

  const { data, error } = await supabase
    .from('system_settings')
    .select('*')
    .eq('id', 'global')
    .single();

  if (error || !data) {
    // Return mock if error/not found
    return {
      id: 'global',
      business_name: 'Surtifruver La Gaviota',
      nit: '900.123.456-7',
      address: 'Centro de Abastos - Bucaramanga',
      phone: '+57 315 XXX XXXX',
      hours: 'Lunes a Sábado: 3:00 AM - 6:00 PM | Domingos: 4:00 AM - 2:00 PM',
      delivery_zones: [
        { name: 'Bucaramanga Centro', enabled: true, minOrder: 25000 },
        { name: 'Floridablanca', enabled: true, minOrder: 35000 },
        { name: 'Girón', enabled: true, minOrder: 40000 },
        { name: 'Piedecuesta', enabled: true, minOrder: 45000 },
        { name: 'Lebrija', enabled: false, minOrder: 80000 },
      ],
      notifications: {
        emailNewOrder: true,
        emailLowStock: true,
        whatsappNewOrder: false,
        whatsappDelivery: true,
        dailyReport: true,
      },
      retail_margin: 25,
      micro_margin: 15,
      wholesale_margin: 5,
    };
  }

  return data as SystemSettings;
}

export async function updateSystemSettings(settings: Partial<SystemSettings>): Promise<{ success: boolean; error?: string }> {
  const actor = await requireCapability('settings.manage');
  const supabase = getServerDatabase(actor);

  const user = await currentUser();
  const actorName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.emailAddresses[0]?.emailAddress || 'Admin' : 'System Admin';

  const { error } = await supabase
    .from('system_settings')
    .update({
      ...settings,
      updated_at: new Date().toISOString()
    })
    .eq('id', 'global');

  if (error) {
    console.error('Error updating settings:', error);
    return { success: false, error: error.message };
  }

  // Audit log for settings update
  await supabase.from('audit_logs').insert({
    actor: actorName,
    action: 'Actualizó Configuración Global',
    target: 'Sistema',
    category: 'SYSTEM',
    details: 'Se actualizaron parámetros generales del ecosistema.'
  });

  revalidatePath('/admin/settings');
  return { success: true };
}
