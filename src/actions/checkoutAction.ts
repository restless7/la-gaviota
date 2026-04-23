'use server';

/**
 * Server Action representing the Bold enterprise Payment / Order processing layer.
 * Currently mocked for UI/UX testing as per Phase 5 Implementation Plan.
 */
export async function submitCheckoutOrder(formData: FormData) {
  // Simulate network delay for enterprise transaction feel
  await new Promise(resolve => setTimeout(resolve, 1500));
  
  const firstName = formData.get('firstName');
  const lastName = formData.get('lastName');
  const email = formData.get('email');
  
  console.log(`[Order Processing] Bold Gateway Mock invoked for ${firstName} ${lastName} (${email})`);
  
  // Return mock successful order payload
  // In a real application, this would pipe to Prisma/Supabase to create an Order record
  return {
    success: true,
    orderId: `GAV-${Math.floor(Math.random() * 1000000)}`,
    status: 'PAID_MOCK',
    timestamp: new Date().toISOString()
  };
}
