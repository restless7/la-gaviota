'use server';
import { requireCapability, requireOwnedSubject, validateTier, assertTargetId, getActor } from '@/src/lib/server/authorization';
import { getServerDatabase } from '@/src/lib/server/database';
import { clerkClient } from '@clerk/nextjs/server';
import { revalidatePath } from 'next/cache';
import type { BusinessTier } from '@/src/lib/supabase';

// ---------- Fetch Current User's Latest Application ----------
export async function fetchMyBusinessApplication() {
  try {
    const actor = await getActor();
    if (!actor.userId || actor.role === 'GUEST') {
      return { success: true, data: null };
    }
    const supabase = getServerDatabase(actor);
    const { data, error } = await supabase
      .from('business_applications')
      .select('*')
      .eq('clerk_user_id', actor.userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error('Fetch own application error:', error);
      return { success: false, data: null };
    }
    return { success: true, data: data || null };
  } catch {
    return { success: false, data: null };
  }
}

// ---------- Submit Business Application ----------
export async function submitBusinessApplication(formData: {
  clerkUserId: string;
  applicantName: string;
  applicantEmail: string;
  businessName: string;
  businessType: BusinessTier;
  nit: string;
  phone: string;
  address: string;
  municipality: string;
  monthlyVolume: string;
  notes: string;
}) {
  const actor = await requireOwnedSubject(formData.clerkUserId);
  const supabase = getServerDatabase(actor);
  validateTier(formData.businessType);

  try {
    // Check if user already has a pending application to avoid duplicates
    const { data: existingPending } = await supabase
      .from('business_applications')
      .select('id')
      .eq('clerk_user_id', formData.clerkUserId)
      .eq('status', 'pending')
      .limit(1)
      .maybeSingle();

    const payload = {
      clerk_user_id: formData.clerkUserId,
      applicant_name: formData.applicantName.trim(),
      applicant_email: formData.applicantEmail.trim(),
      business_name: formData.businessName.trim(),
      business_type: formData.businessType,
      nit: formData.nit.trim(),
      phone: formData.phone.trim(),
      address: formData.address.trim(),
      municipality: formData.municipality,
      monthly_volume: formData.monthlyVolume,
      notes: formData.notes.trim(),
      status: 'pending' as const,
    };

    const query = existingPending?.id
      ? supabase.from('business_applications').update(payload).eq('id', existingPending.id).select().single()
      : supabase.from('business_applications').insert(payload).select().single();

    const { data, error } = await query;

    if (error) {
      console.error('Supabase insert/update error:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/solicitudes');
    revalidatePath('/aplicar-negocio');
    return { success: true, data };
  } catch (err) {
    console.error('Submit application error:', err);
    return { success: false, error: 'Error inesperado al enviar la solicitud.' };
  }
}

// ---------- Fetch All Applications (Admin) ----------
export async function fetchBusinessApplications() {
  const actor = await requireCapability('customers.manage');
  const supabase = getServerDatabase(actor);

  try {
    const { data, error } = await supabase
      .from('business_applications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Fetch applications error:', error);
      return { success: false, error: error.message, data: [] };
    }

    return { success: true, data: data || [] };
  } catch (err) {
    console.error('Fetch error:', err);
    return { success: false, error: 'Error al cargar solicitudes.', data: [] };
  }
}

// ---------- Approve Application (Admin) ----------
export async function approveApplication(applicationId: string, clerkUserId: string, businessType: BusinessTier, businessName: string, adminName: string) {
  const actor = await requireCapability('tiers.manage');
  const supabase = getServerDatabase(actor);

  assertTargetId(applicationId);
  assertTargetId(clerkUserId);
  validateTier(businessType);
  try {
    // 1. Update Clerk user metadata to grant the tier (preserving existing role/metadata)
    const client = await clerkClient();
    const targetUser = await client.users.getUser(clerkUserId);
    const existingMeta = targetUser.publicMetadata || {};

    await client.users.updateUserMetadata(clerkUserId, {
      publicMetadata: {
        ...existingMeta,
        tier: businessType,
        businessName: businessName,
        approvedAt: new Date().toISOString(),
      },
    });

    const reviewerLabel = adminName?.trim() ? `${adminName.trim()} (${actor.userId})` : actor.userId;

    // 2. Update application status in Supabase
    const { error } = await supabase
      .from('business_applications')
      .update({
        business_type: businessType,
        status: 'approved',
        reviewed_by: reviewerLabel,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    if (error) {
      console.error('Supabase update error:', error);
      return { success: false, error: error.message };
    }

    // 3. Create/Update customer record in 'customers' table
    const { data: appData } = await supabase
      .from('business_applications')
      .select('*')
      .eq('id', applicationId)
      .single();

    if (appData) {
      const fullAddress = appData.municipality && !String(appData.address || '').includes(appData.municipality)
        ? `${appData.address}, ${appData.municipality}`
        : appData.address;

      const { error: custErr } = await supabase
        .from('customers')
        .upsert({
          clerk_user_id: clerkUserId,
          full_name: appData.applicant_name,
          business_name: appData.business_name,
          email: appData.applicant_email,
          phone: appData.phone,
          address: fullAddress,
          nit: appData.nit || null,
          tier: businessType,
          updated_at: new Date().toISOString()
        }, { onConflict: 'clerk_user_id' });

      if (custErr) {
        console.error('Error syncing approved business to customers table:', custErr);
      }
    }

    revalidatePath('/admin/solicitudes');
    revalidatePath('/admin/clientes/micro');
    revalidatePath('/admin/clientes/restaurantes');
    revalidatePath('/admin/clientes/personas');
    revalidatePath('/admin/clientes/usuarios');
    revalidatePath('/');
    revalidatePath('/dashboard');

    return { success: true };
  } catch (err) {
    console.error('Approve error:', err);
    return { success: false, error: 'Error al aprobar la solicitud.' };
  }
}

// ---------- Reject Application (Admin) ----------
export async function rejectApplication(applicationId: string, adminName: string) {
  const actor = await requireCapability('tiers.manage');
  const supabase = getServerDatabase(actor);

  assertTargetId(applicationId);
  try {
    const reviewerLabel = adminName?.trim() ? `${adminName.trim()} (${actor.userId})` : actor.userId;

    const { error } = await supabase
      .from('business_applications')
      .update({
        status: 'rejected',
        reviewed_by: reviewerLabel,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    if (error) {
      console.error('Supabase update error:', error);
      return { success: false, error: error.message };
    }

    revalidatePath('/admin/solicitudes');
    revalidatePath('/aplicar-negocio');
    return { success: true };
  } catch (err) {
    console.error('Reject error:', err);
    return { success: false, error: 'Error al rechazar la solicitud.' };
  }
}
