import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

const mockEvents = [
  { actor: 'Sebastian Garcia', action: 'Aplicó multiplicadores masivos', target: 'Gestión de Precios', category: 'pricing', details: 'Detal +25%, Micro +15%, Rest. +5% — 210 productos actualizados.' },
  { actor: 'Sebastian Garcia', action: 'Cambió estado de pedido', target: 'ORD-1004', category: 'order', details: 'Parrilla Santandereana: "Pendiente" → "En Ruta"' },
  { actor: 'Sistema', action: 'Alerta de stock bajo', target: 'Tomate Chonto', category: 'inventory', details: 'Stock cayó a 5 Kg — umbral mínimo alcanzado.' },
  { actor: 'Sebastian Garcia', action: 'Registró nueva granja', target: 'Huerta Orgánica La Cumbre', category: 'supplier', details: 'Zapatoca, Santander — Productos: Aguacate Criollo, Uchuva, Feijoa. Estado: Auditando.' },
  { actor: 'Sistema', action: 'Inicio de sesión', target: 'Admin Panel', category: 'system', details: 'Sebastian Garcia inició sesión desde IP 181.49.xx.xx (Bucaramanga).' },
  { actor: 'Sebastian Garcia', action: 'Actualizó costo base', target: 'Aguacate Hass', category: 'pricing', details: 'Costo de compra: $1,200 → $1,350 COP/kg' },
];

async function seedAuditLogs() {
  console.log('Seeding audit logs...');
  const { error } = await supabase
    .from('audit_logs')
    .insert(mockEvents);

  if (error) {
    console.error('Error seeding audit logs:', error);
  } else {
    console.log('Audit logs seeded successfully!');
  }
}

seedAuditLogs();
