import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!; // or SERVICE_ROLE if needed
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  const clerkUserId = 'user_3DeMHSeU0qTH4gm8JpHGPuJ9tvo';
  
  // Update customer to 1 order and 46645
  const { data, error } = await supabase
    .from('customers')
    .update({ total_orders: 1, total_spent: 46645 })
    .eq('clerk_user_id', clerkUserId)
    .select();
    
  console.log('Fixed Customer:', data, error);
}
run();
