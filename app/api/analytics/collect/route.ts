import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

function parseDevice(userAgent: string): { device: 'mobile' | 'desktop' | 'tablet'; browser: string } {
  const ua = userAgent.toLowerCase();
  let device: 'mobile' | 'desktop' | 'tablet' = 'desktop';
  if (/tablet|ipad|playbook|silk/i.test(ua)) {
    device = 'tablet';
  } else if (/mobile|iphone|android|ipod|blackberry|opera mini|iemobile/i.test(ua)) {
    device = 'mobile';
  }

  let browser = 'Otro';
  if (ua.includes('edg/')) browser = 'Edge';
  else if (ua.includes('chrome') && ua.includes('mobile')) browser = 'Chrome Mobile';
  else if (ua.includes('chrome')) browser = 'Chrome Desktop';
  else if (ua.includes('safari') && ua.includes('mobile')) browser = 'Safari iOS';
  else if (ua.includes('safari')) browser = 'Safari';
  else if (ua.includes('firefox')) browser = 'Firefox';

  return { device, browser };
}

function classifyChannel(referrer?: string | null, utmSource?: string | null): string {
  const ref = (referrer || '').toLowerCase();
  const src = (utmSource || '').toLowerCase();

  if (ref.includes('whatsapp') || ref.includes('wa.me') || src.includes('whatsapp')) return 'WhatsApp';
  if (ref.includes('google') || src.includes('google')) return 'Google Orgánico';
  if (ref.includes('instagram') || ref.includes('facebook') || ref.includes('meta') || src.includes('meta')) return 'Redes Sociales';
  if (src.includes('campana') || src.includes('email') || src.includes('newsletter')) return 'Campaña Especial';
  return 'Directo';
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      pathname,
      referrer,
      visitorId,
      sessionId,
      duration = 10,
      utmSource,
      utmMedium,
      utmCampaign,
      productId,
      category,
      city = 'Bucaramanga',
    } = body;

    // Disregard admin panel route telemetry so internal operations don't inflate client analytics
    if (!pathname || typeof pathname !== 'string' || pathname.startsWith('/admin') || pathname.startsWith('/api')) {
      return NextResponse.json({ ok: true, ignored: true });
    }

    const userAgent = req.headers.get('user-agent') || '';
    const { device, browser } = parseDevice(userAgent);
    const channel = classifyChannel(referrer, utmSource);

    if (supabaseUrl && serviceKey) {
      const supabase = createClient(supabaseUrl, serviceKey, {
        auth: { persistSession: false },
      });

      const { error } = await supabase.from('analytics_page_views').insert({
        pathname,
        session_id: sessionId || 'anon-session',
        visitor_id: visitorId || 'anon-visitor',
        referrer: referrer ? String(referrer).slice(0, 500) : null,
        referrer_channel: channel,
        device_type: device,
        browser,
        city,
        duration_seconds: Math.max(1, Math.min(Number(duration) || 10, 3600)),
        utm_source: utmSource ? String(utmSource).slice(0, 100) : null,
        utm_medium: utmMedium ? String(utmMedium).slice(0, 100) : null,
        utm_campaign: utmCampaign ? String(utmCampaign).slice(0, 100) : null,
        product_id: productId ? String(productId).slice(0, 50) : null,
        category: category ? String(category).slice(0, 50) : null,
      });

      if (error && error.code !== '42P01') {
        console.warn('Analytics collect warning:', error.message);
      }
    }

    return NextResponse.json({ ok: true });
  } catch (err) {
    // Fail silently to never impact user experience
    console.error('Analytics collect error:', err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
