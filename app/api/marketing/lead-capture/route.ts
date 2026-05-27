import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { triggerOrderNotification } from '@/src/lib/notifications';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export async function POST(req: Request) {
  try {
    const payload = await req.json();
    const { fullName, businessName, businessType, phone, email, source } = payload;

    if (!fullName || !phone || !businessType) {
      return NextResponse.json({ error: 'Faltan campos requeridos (nombre, telefono, tipo)' }, { status: 400 });
    }

    const { data: lead, error } = await supabase
      .from('marketing_leads')
      .insert({
        full_name: fullName,
        business_name: businessName,
        business_type: businessType,
        phone: phone,
        email: email,
        source: source || 'Landing Page',
        status: 'Nuevo'
      })
      .select()
      .single();

    if (error) {
      throw error;
    }

    // Trigger internal alert to La Gaviota Sales Team
    // In production, you would call Meta API to send a message to the Admin's phone
    console.log(`[LEAD CAPTURED] Nuevo prospecto B2B recibido: ${businessName || fullName} (${businessType})`);

    return NextResponse.json({ 
      success: true, 
      leadId: lead.id,
      message: 'Prospecto capturado exitosamente' 
    });

  } catch (error) {
    console.error('[Lead Capture Error]', error);
    return NextResponse.json({ error: 'Falló la captura del prospecto' }, { status: 500 });
  }
}
