import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // or SERVICE_ROLE if needed
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const { data: customer, error: err1 } = await supabase
    .from('customers')
    .select('*')
    .ilike('full_name', '%edward%');
  
  console.log('--- Customers ---');
  console.log(customer);
  
  if (customer && customer.length > 0) {
    const { data: orders, error: err2 } = await supabase
      .from('orders')
      .select('id, status, total_amount, payment_method, created_at')
      .eq('clerk_user_id', customer[0].clerk_user_id);
    
    console.log('\n--- Orders ---');
    console.log(orders);
  }
}
run();
