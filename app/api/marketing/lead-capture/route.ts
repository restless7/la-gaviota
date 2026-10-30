import { insertPublicLead } from '@/src/lib/server/database';
import { NextResponse } from 'next/server';

import { triggerOrderNotification } from '@/src/lib/notifications';



export async function POST(req: Request) {
  try {
    const raw = await req.text();
    if (new TextEncoder().encode(raw).length > 8192) return NextResponse.json({error:'Payload too large'},{status:413});
    const payload = JSON.parse(raw);
    if (!payload || typeof payload !== 'object' || Array.isArray(payload) || Object.keys(payload).some(k => !['fullName','businessName','businessType','phone','email','source'].includes(k))) return NextResponse.json({error:'Invalid payload'},{status:400});
    if (Object.values(payload).some(v => typeof v !== 'string' || v.length > 512)) return NextResponse.json({error:'Invalid field'},{status:400});
    const { fullName, businessName, businessType, phone } = payload;

    if (!fullName || !phone || !businessType) {
      return NextResponse.json({ error: 'Faltan campos requeridos (nombre, telefono, tipo)' }, { status: 400 });
    }

    const { data: lead, error } = await insertPublicLead(payload);

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
