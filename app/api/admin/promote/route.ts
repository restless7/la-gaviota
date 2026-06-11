import { auth, clerkClient } from '@clerk/nextjs/server';
import { NextResponse } from 'next/server';

export async function GET() {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      return NextResponse.json({ error: 'Debes iniciar sesión primero para usar esta ruta.' }, { status: 401 });
    }

    const client = await clerkClient();
    const user = await client.users.getUser(userId);
    const existingMetadata = user.publicMetadata || {};
    
    // We preserve the existing tier (like 'Restaurantes') but explicitly add the SUPER_ADMIN role
    await client.users.updateUserMetadata(userId, {
      publicMetadata: {
        ...existingMetadata,
        role: 'SUPER_ADMIN',
      }
    });
    
    return NextResponse.json({ 
      success: true, 
      message: '¡Felicidades! Tu cuenta ha sido promovida a SUPER_ADMIN. Por favor, cierra sesión y vuelve a entrar para actualizar tus permisos.',
      newMetadata: {
        ...existingMetadata,
        role: 'SUPER_ADMIN'
      }
    });
  } catch (error) {
    console.error('Error promoting user:', error);
    return NextResponse.json({ error: 'Hubo un error al promover tu cuenta.' }, { status: 500 });
  }
}
