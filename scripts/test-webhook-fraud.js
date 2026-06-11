const { createClient } = require('@supabase/supabase-js');
const crypto = require('crypto');
const dotenv = require('dotenv');

// We need a modern fetch or we can use http module
const http = require('http');

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const wompiSecret = process.env.WOMPI_EVENTS_SECRET || 'test_secret'; // Fallback if local doesn't have it

if (!supabaseUrl || !supabaseKey) {
  console.error("Faltan variables de entorno de Supabase en .env.local");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function runTest() {
  console.log("\n=======================================================");
  console.log("💣 INICIANDO SIMULACIÓN DE ATAQUE: EXPLOTACIÓN DE PRECIOS");
  console.log("=======================================================\n");

  // 1. Obtener una orden real para atacar
  console.log("[1] Obteniendo una orden Pendiente en la base de datos...");
  let { data: orders } = await supabase
    .from('orders')
    .select('id, total_amount')
    .in('status', ['Pendiente', 'PENDING_PAYMENT'])
    .limit(1);

  let orderId;
  let totalAmount;

  if (orders && orders.length > 0) {
    orderId = orders[0].id;
    totalAmount = orders[0].total_amount;
  } else {
    console.log("[1] No hay órdenes pendientes. Creando orden dummy de $500.000 COP...");
    const { data: newOrder, error } = await supabase.from('orders').insert({
      customer_name: 'Hacker Simulado',
      customer_email: 'hacker@blackhat.com',
      customer_phone: '3000000000',
      delivery_address: 'Calle Falsa 123',
      delivery_municipality: 'Bogotá',
      total_amount: 500000,
      status: 'Pendiente',
      payment_method: 'wompi'
    }).select('id, total_amount').single();
    
    if (error) {
       console.error("Error creando orden:", error);
       process.exit(1);
    }
    orderId = newOrder.id;
    totalAmount = newOrder.total_amount;
  }

  console.log(`[🎯] OBJETIVO FIJADO: Orden ID ${orderId}`);
  console.log(`[💰] Valor Real: $${totalAmount} COP`);

  // 2. Generar Firma Criptográfica para Monto Alterado
  const transactionId = `txn_fraud_${Date.now()}`;
  const status = 'APPROVED';
  const amountInCents = 1000; // Intento de pagar $10 COP (1000 centavos)
  const timestamp = Date.now().toString();

  console.log(`[2] Falsificando payload de Wompi... Monto alterado a $10 COP (1000 cents)`);
  
  // Fórmula: id + status + amount_in_cents + timestamp + secret
  const stringToHash = `${transactionId}${status}${amountInCents}${timestamp}${wompiSecret}`;
  const checksum = crypto.createHash('sha256').update(stringToHash, 'utf8').digest('hex');

  console.log(`[🔐] Firma Criptográfica válida calculada: ${checksum.substring(0,10)}...`);

  const payload = JSON.stringify({
    signature: {
      properties: ["transaction.id", "transaction.status", "transaction.amount_in_cents"],
      checksum: checksum
    },
    data: {
      transaction: {
        id: transactionId,
        reference: orderId,
        status: status,
        amount_in_cents: amountInCents
      }
    },
    timestamp: parseInt(timestamp, 10)
  });

  // 3. Disparar el Ataque
  console.log("\n[3] Disparando misil HTTP POST al Webhook Local...");
  
  const options = {
    hostname: 'localhost',
    port: 3002,
    path: '/api/webhooks/wompi',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': payload.length
    }
  };

  const req = http.request(options, (res) => {
    let data = '';
    res.on('data', (chunk) => data += chunk);
    res.on('end', async () => {
      console.log(`\n[📡] Respuesta del Webhook: HTTP ${res.statusCode}`);
      console.log(`[📡] Cuerpo: ${data}`);

      // 4. Verificar el estado en la base de datos
      console.log("\n[4] Verificando estado final en Supabase...");
      const { data: checkOrder } = await supabase.from('orders').select('status, notes').eq('id', orderId).single();
      
      console.log(`[✅] Status final de la orden: ${checkOrder.status}`);
      console.log(`[📝] Notas de la orden: ${checkOrder.notes}`);
      
      console.log("\n=======================================================");
      console.log("💥 SIMULACIÓN FINALIZADA");
      console.log("=======================================================\n");
    });
  });

  req.on('error', (error) => {
    console.error('[Error] El servidor local Next.js no está corriendo o rechazó la conexión.');
    console.error('Asegúrate de tener "npm run dev" ejecutándose en otra terminal.');
  });

  req.write(payload);
  req.end();
}

runTest();
