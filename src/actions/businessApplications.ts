'use server';

import { supabase } from '@/src/lib/supabase';
import { clerkClient } from '@clerk/nextjs/server';
import type { BusinessTier } from '@/src/lib/supabase';

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
  try {
    const { data, error } = await supabase
      .from('business_applications')
      .insert({
        clerk_user_id: formData.clerkUserId,
        applicant_name: formData.applicantName,
        applicant_email: formData.applicantEmail,
        business_name: formData.businessName,
        business_type: formData.businessType,
        nit: formData.nit,
        phone: formData.phone,
        address: formData.address,
        municipality: formData.municipality,
        monthly_volume: formData.monthlyVolume,
        notes: formData.notes,
        status: 'pending',
      })
      .select()
      .single();

    if (error) {
      console.error('Supabase insert error:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (err) {
    console.error('Submit application error:', err);
    return { success: false, error: 'Error inesperado al enviar la solicitud.' };
  }
}

// ---------- Fetch All Applications (Admin) ----------
export async function fetchBusinessApplications() {
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
  try {
    // 1. Update Clerk user metadata to grant the tier
    const client = await clerkClient();
    await client.users.updateUserMetadata(clerkUserId, {
      publicMetadata: {
        tier: businessType,
        businessName: businessName,
        approvedAt: new Date().toISOString(),
      },
    });

    // 2. Update application status in Supabase
    const { error } = await supabase
      .from('business_applications')
      .update({
        status: 'approved',
        reviewed_by: adminName,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    if (error) {
      console.error('Supabase update error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Approve error:', err);
    return { success: false, error: 'Error al aprobar la solicitud.' };
  }
}

// ---------- Reject Application (Admin) ----------
export async function rejectApplication(applicationId: string, adminName: string) {
  try {
    const { error } = await supabase
      .from('business_applications')
      .update({
        status: 'rejected',
        reviewed_by: adminName,
        reviewed_at: new Date().toISOString(),
      })
      .eq('id', applicationId);

    if (error) {
      console.error('Supabase update error:', error);
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (err) {
    console.error('Reject error:', err);
    return { success: false, error: 'Error al rechazar la solicitud.' };
  }
}
