'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';
import { submitBusinessApplication, fetchMyBusinessApplication } from '@/src/actions/businessApplications';
import { useUserRole } from '@/src/contexts/UserRoleContext';
import { Store, ChefHat, ArrowRight, ArrowLeft, CheckCircle2, Shield, Truck, Percent, Send, Loader2, Clock, AlertCircle } from 'lucide-react';
import { WhatsAppIcon } from '@/src/components/ui/WhatsAppIcon';
import type { BusinessTier, BusinessApplication } from '@/src/lib/supabase';

const TIERS = [
  {
    id: 'Micromercados' as BusinessTier,
    icon: Store,
    title: 'Micromercado / Tienda',
    description: 'Tiendas de barrio, minimercados y distribuidoras locales.',
    minOrder: '$150.000 COP',
    benefits: [
      'Precios 15-20% menores que detal',
      'Cantidades sugeridas x5, x10, x20',
      'Ruta de entrega preferencial',
    ],
    color: 'from-yellow-400 to-amber-500',
    border: 'border-yellow-400',
    bg: 'bg-yellow-50',
    text: 'text-yellow-700',
    image: '/IMAGES/aplicar-negocio-micromercado.jpeg'
  },
  {
    id: 'Restaurantes' as BusinessTier,
    icon: ChefHat,
    title: 'Restaurante / Mayorista',
    description: 'Restaurantes, hoteles, casinos y operadores de alimentos.',
    minOrder: '$300.000 COP',
    benefits: [
      'Los mejores precios del mercado mayorista',
      'Plantillas de compra recurrente',
      'Asesor comercial dedicado',
      'Entrega prioritaria antes de las 6 AM',
    ],
    color: 'from-emerald-400 to-green-600',
    border: 'border-green-500',
    bg: 'bg-green-50',
    text: 'text-green-700',
    image: '/IMAGES/aplicar-negocio-restaurante.jpeg'
  },
];

const MUNICIPALITIES = [
  'Bucaramanga',
  'Floridablanca',
  'Girón',
];

const B2B_DRAFT_STORAGE_KEY = 'gaviota_b2b_application_draft';

export default function AplicarNegocioPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const { role: activeUserTier, businessName: activeBusinessName } = useUserRole();
  const [step, setStep] = useState(1);
  const [selectedTier, setSelectedTier] = useState<BusinessTier | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [existingApp, setExistingApp] = useState<BusinessApplication | null>(null);

  // Form state
  const [form, setForm] = useState({
    businessName: '',
    nit: '',
    phone: '',
    address: '',
    municipality: 'Bucaramanga',
    monthlyVolume: '',
    notes: '',
  });

  // Restore draft from localStorage (so signing in at Step 3 never loses form data)
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      try {
        const raw = localStorage.getItem(B2B_DRAFT_STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (parsed.selectedTier) setSelectedTier(parsed.selectedTier);
          if (parsed.form) setForm(prev => ({ ...prev, ...parsed.form }));
          if (parsed.step && parsed.selectedTier) setStep(parsed.step);
        }
      } catch {
        // Ignore storage errors
      }
    });
    return () => {
      active = false;
    };
  }, []);

  // Save draft to localStorage as user progresses
  useEffect(() => {
    if (!selectedTier && !form.businessName) return;
    try {
      localStorage.setItem(B2B_DRAFT_STORAGE_KEY, JSON.stringify({ selectedTier, form, step }));
    } catch {
      // Ignore storage errors
    }
  }, [selectedTier, form, step]);

  // Fetch existing application if signed in
  useEffect(() => {
    if (!isLoaded || !isSignedIn) return;
    fetchMyBusinessApplication().then(res => {
      if (res.success && res.data) {
        setExistingApp(res.data as BusinessApplication);
      }
    });
  }, [isLoaded, isSignedIn]);

  const updateForm = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!user || !selectedTier) return;
    setIsSubmitting(true);
    setSubmitError(null);

    const result = await submitBusinessApplication({
      clerkUserId: user.id,
      applicantName: user.fullName || user.firstName || 'Sin nombre',
      applicantEmail: user.primaryEmailAddress?.emailAddress || '',
      businessName: form.businessName,
      businessType: selectedTier,
      nit: form.nit,
      phone: form.phone,
      address: form.address,
      municipality: form.municipality,
      monthlyVolume: form.monthlyVolume,
      notes: form.notes,
    });

    setIsSubmitting(false);
    if (result.success) {
      try {
        localStorage.removeItem(B2B_DRAFT_STORAGE_KEY);
      } catch {
        // Ignore
      }
      setSubmitted(true);
    } else {
      setSubmitError(result.error || 'No pudimos enviar tu solicitud. Intenta nuevamente.');
    }
  };

  // Loading state
  if (!isLoaded) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#E30613] animate-spin" />
      </div>
    );
  }

  // ── Success State ──
  if (submitted) {
    const fastTrackMsg = encodeURIComponent(
      `Hola Surtifruver La Gaviota 👋 Acabo de enviar mi solicitud mayorista en la web:\n` +
      `• Negocio: ${form.businessName}\n` +
      `• Categoría: ${selectedTier}\n` +
      `• NIT: ${form.nit || 'En trámite'}\n` +
      `• Municipio: ${form.municipality}\n` +
      `¿Me ayudan por favor con la activación de tarifas mayoristas?`
    );
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-lg text-center bg-white p-8 rounded-3xl shadow-xl border border-slate-100">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-[#4CAF50]" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-4 font-serif">¡Solicitud Enviada!</h1>
          <p className="text-gray-600 mb-2 text-lg">
            Tu solicitud para <strong className="text-[#E30613]">{form.businessName}</strong> como <strong>{selectedTier}</strong> ha sido recibida.
          </p>
          <p className="text-gray-500 text-sm mb-6">
            Nuestro equipo comercial revisará tu solicitud. Una vez aprobada, tu cuenta verá automáticamente los precios mayoristas de <strong>{selectedTier}</strong> en todo el catálogo.
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-gray-600 mb-6 text-left">
            <p className="font-bold text-slate-800 mb-1">💡 ¿Necesitas activación inmediata hoy mismo?</p>
            <p className="text-xs leading-relaxed">Envíanos un mensaje directo por WhatsApp para que nuestro equipo valide tu negocio y active tus precios mayoristas en minutos.</p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <a
              href={`https://wa.me/573112694676?text=${fastTrackMsg}`}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1da851] text-white px-6 py-3 rounded-full font-black text-sm shadow-md transition-all"
            >
              <WhatsAppIcon className="w-4 h-4 fill-current" />
              <span>Agilizar por WhatsApp</span>
            </a>
            <Link href="/" className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#E30613] hover:bg-[#c90510] text-[#FFCC00] px-6 py-3 rounded-full font-bold text-sm shadow-lg transition-all">
              <span>Ir a la tienda</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const activeTierObj = TIERS.find(t => t.id === selectedTier);

  return (
    <div className={`relative min-h-screen ${step === 1 ? 'bg-gradient-to-b from-slate-50 to-white' : 'bg-slate-900'}`}>
      {/* Dynamic Background for Steps 2 and 3 */}
      {step > 1 && activeTierObj?.image && (
        <div className="fixed inset-0 z-0 animate-fade-in">
          <Image src={activeTierObj.image} alt="Background" fill className="object-cover" priority />
          <div className="absolute inset-0 bg-slate-900/80 backdrop-blur-md"></div>
        </div>
      )}

      <div className="relative z-10">
        {/* Hero Banner */}
        {step === 1 && (
          <div className="relative bg-slate-900 text-white overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-[#E30613]/30 to-[#4CAF50]/20"></div>
            <div className="absolute -bottom-1 left-0 right-0 h-8 bg-slate-50" style={{ clipPath: 'ellipse(55% 100% at 50% 100%)' }}></div>
            <div className="max-w-4xl mx-auto px-4 py-16 md:py-20 relative z-10 text-center">
              <span className="inline-block bg-[#FFCC00] text-slate-900 text-xs font-black uppercase tracking-widest px-4 py-1.5 rounded-full mb-6">
                Programa Exclusivo para Negocios
              </span>
              <h1 className="text-4xl md:text-5xl font-black font-serif mb-4 leading-tight">
                Precios <span className="text-[#FFCC00]">Mayoristas</span> para<br />
                su Negocio
              </h1>
              <p className="text-gray-300 text-lg max-w-2xl mx-auto">
                Únase al programa de negocios de La Gaviota y acceda a precios especiales y entregas prioritarias para su establecimiento.
              </p>
            </div>
          </div>
        )}

        <div className={`max-w-4xl mx-auto px-4 pb-20 ${step === 1 ? '-mt-4' : 'pt-16'}`}>
          {/* Live Status Banner if User Already Has a B2B Tier or Pending Application */}
          {activeUserTier !== 'Personas Naturales' ? (
            <div className="mb-8 rounded-2xl border border-emerald-300 bg-emerald-50 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <CheckCircle2 className="w-6 h-6 text-emerald-700 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-black text-emerald-950 uppercase tracking-wide">
                    Cuenta Mayorista Activa: {activeUserTier} {activeBusinessName ? `(${activeBusinessName})` : ''}
                  </h3>
                  <p className="text-xs text-emerald-800 mt-0.5">
                    Tus precios preferenciales ya están activos en toda la tienda y en tu portal exclusivo B2B.
                  </p>
                </div>
              </div>
              <Link
                href="/dashboard"
                className="shrink-0 rounded-full bg-emerald-700 hover:bg-emerald-800 px-5 py-2.5 text-xs font-black text-white shadow-sm transition-colors"
              >
                Ir a Mi Portal B2B →
              </Link>
            </div>
          ) : existingApp?.status === 'pending' ? (
            <div className="mb-8 rounded-2xl border border-amber-300 bg-amber-50 p-5 shadow-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <Clock className="w-6 h-6 text-amber-700 shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-black text-amber-950 uppercase tracking-wide">
                    Solicitud en Revisión: {existingApp.business_name} ({existingApp.business_type})
                  </h3>
                  <p className="text-xs text-amber-900 mt-0.5">
                    Recibimos tu solicitud. Puedes actualizar tus datos abajo o escribirnos por WhatsApp para activación inmediata.
                  </p>
                </div>
              </div>
              <a
                href={`https://wa.me/573112694676?text=${encodeURIComponent(`Hola La Gaviota 👋 Consulto el estado de mi solicitud mayorista para ${existingApp.business_name} (${existingApp.business_type}).`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-[#25D366] hover:bg-[#1da851] px-4 py-2 text-xs font-black text-white shadow-sm transition-colors"
              >
                <WhatsAppIcon className="w-3.5 h-3.5 fill-current" />
                <span>Consultar por WhatsApp</span>
              </a>
            </div>
          ) : null}

          {/* Step Indicator */}
          <div className="flex items-center justify-center gap-2 mb-12">
            {[1, 2, 3].map(s => (
              <React.Fragment key={s}>
                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all ${step >= s ? 'bg-[#E30613] text-white shadow-lg scale-110' : 'bg-gray-200/20 text-gray-400'}`}>
                  {step > s ? '✓' : s}
                </div>
                {s < 3 && (
                  <div className={`w-12 sm:w-20 h-1 rounded-full transition-colors ${step > s ? 'bg-[#E30613]' : 'bg-gray-200/20'}`}></div>
                )}
              </React.Fragment>
            ))}
          </div>

          {/* ── STEP 1: Select Tier ── */}
          {step === 1 && (
            <div className="animate-fade-in">
              <div className="text-center mb-10">
                <h2 className="text-2xl font-black text-slate-800 font-serif">¿Qué tipo de negocio tiene?</h2>
                <p className="text-gray-500 mt-2">Seleccione su categoría para ver los beneficios y precios disponibles.</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                {TIERS.map(tier => {
                  const Icon = tier.icon;
                  const isSelected = selectedTier === tier.id;
                  return (
                    <button
                      key={tier.id}
                      onClick={() => setSelectedTier(tier.id)}
                      className={`text-left rounded-2xl border-2 overflow-hidden transition-all flex flex-col bg-white ${isSelected ? `${tier.border} shadow-xl scale-[1.02]` : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'}`}
                    >
                      {tier.image && (
                        <div className="w-full h-72 relative">
                          <Image src={tier.image} alt={tier.title} fill className="object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent"></div>
                          <div className={`absolute bottom-4 left-4 w-12 h-12 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center shadow-md border-2 border-white`}>
                            <Icon className="w-6 h-6 text-white" />
                          </div>
                        </div>
                      )}
                      <div className="p-8 pt-6 flex-1">
                        <h3 className="text-2xl font-black text-slate-800 mb-1">{tier.title}</h3>
                        <p className="text-sm text-gray-500 mb-4">{tier.description}</p>
                        <p className="text-xs font-bold text-gray-400 uppercase mb-3">Pedido mínimo: {tier.minOrder}</p>
                        <ul className="space-y-2">
                          {tier.benefits.map(b => (
                            <li key={b} className="flex items-start gap-2 text-sm text-gray-600">
                              <CheckCircle2 className={`w-4 h-4 ${tier.text} flex-shrink-0 mt-0.5`} />
                              {b}
                            </li>
                          ))}
                        </ul>
                        {isSelected && (
                          <div className={`mt-4 inline-block ${tier.bg} ${tier.text} text-xs font-black uppercase px-3 py-1 rounded-full`}>
                            ✓ Seleccionado
                          </div>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Benefits Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-10">
                <div className="bg-white border border-gray-100 rounded-xl p-5 text-center shadow-sm">
                  <Percent className="w-8 h-8 text-[#E30613] mx-auto mb-2" />
                  <h4 className="font-bold text-slate-800 text-sm">Precios Exclusivos</h4>
                  <p className="text-xs text-gray-500 mt-1">Hasta 30% menos que precio al detal</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-5 text-center shadow-sm">
                  <Truck className="w-8 h-8 text-[#4CAF50] mx-auto mb-2" />
                  <h4 className="font-bold text-slate-800 text-sm">Entrega Prioritaria</h4>
                  <p className="text-xs text-gray-500 mt-1">Antes de las 6 AM en su negocio</p>
                </div>
                <div className="bg-white border border-gray-100 rounded-xl p-5 text-center shadow-sm">
                  <Shield className="w-8 h-8 text-[#FFCC00] mx-auto mb-2" />
                  <h4 className="font-bold text-slate-800 text-sm">Calidad Garantizada</h4>
                  <p className="text-xs text-gray-500 mt-1">Productos siempre frescos del campo</p>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  onClick={() => selectedTier && setStep(2)}
                  disabled={!selectedTier}
                  className="bg-[#E30613] hover:bg-[#c90510] disabled:opacity-40 disabled:cursor-not-allowed text-[#FFCC00] px-8 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 transition-all"
                >
                  Continuar <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

        {/* ── STEP 2: Business Details Form ── */}
        {step === 2 && (
          <div className="animate-fade-in">
            <div className="text-center mb-10 drop-shadow-md">
              <h2 className="text-4xl font-black text-white font-serif">Datos de su Negocio</h2>
              <p className="text-gray-300 mt-2 text-lg">Complete la información para verificar su establecimiento.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-2xl mx-auto space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Nombre del Negocio *</label>
                  <input
                    type="text"
                    value={form.businessName}
                    onChange={(e) => updateForm('businessName', e.target.value)}
                    placeholder="Restaurante El Gordo"
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-[#E30613] font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">NIT / Cédula</label>
                  <input
                    type="text"
                    value={form.nit}
                    onChange={(e) => updateForm('nit', e.target.value)}
                    placeholder="900.123.456-7"
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-[#E30613] font-medium"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Teléfono / WhatsApp *</label>
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => updateForm('phone', e.target.value)}
                    placeholder="+57 315 123 4567"
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-[#E30613] font-medium"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Municipio *</label>
                  <select
                    value={form.municipality}
                    onChange={(e) => updateForm('municipality', e.target.value)}
                    className="w-full border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-[#E30613] font-medium bg-white"
                  >
                    {MUNICIPALITIES.map(m => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Dirección del Negocio *</label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => updateForm('address', e.target.value)}
                  placeholder="Cra 27 #36-20, Centro"
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-[#E30613] font-medium"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Volumen Mensual Estimado (COP)</label>
                <select
                  value={form.monthlyVolume}
                  onChange={(e) => updateForm('monthlyVolume', e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-[#E30613] font-medium bg-white"
                >
                  <option value="">Seleccione un rango...</option>
                  <option value="$150.000 - $500.000">$150.000 - $500.000</option>
                  <option value="$500.000 - $1.000.000">$500.000 - $1.000.000</option>
                  <option value="$1.000.000 - $3.000.000">$1.000.000 - $3.000.000</option>
                  <option value="$3.000.000+">$3.000.000+</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Notas Adicionales</label>
                <textarea
                  value={form.notes}
                  onChange={(e) => updateForm('notes', e.target.value)}
                  rows={3}
                  placeholder="Productos de interés, frecuencia de pedido, etc."
                  className="w-full border border-gray-200 rounded-lg px-4 py-3 outline-none focus:border-[#E30613] font-medium resize-none"
                />
              </div>
            </div>

            <div className="flex justify-between mt-8 max-w-2xl mx-auto">
              <button
                onClick={() => setStep(1)}
                className="text-gray-500 hover:text-gray-700 font-bold flex items-center gap-2 transition-colors"
              >
                <ArrowLeft className="w-4 h-4" /> Atrás
              </button>
              <button
                onClick={() => form.businessName && form.phone && form.address ? setStep(3) : null}
                disabled={!form.businessName || !form.phone || !form.address}
                className="bg-[#E30613] hover:bg-[#c90510] disabled:opacity-40 disabled:cursor-not-allowed text-[#FFCC00] px-8 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 transition-all"
              >
                Revisar y Enviar <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ── STEP 3: Review & Submit ── */}
        {step === 3 && (
          <div className="animate-fade-in">
            <div className="text-center mb-10 drop-shadow-md">
              <h2 className="text-4xl font-black text-white font-serif">Confirmar Solicitud</h2>
              <p className="text-gray-300 mt-2 text-lg">Revise su información antes de enviar.</p>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 max-w-2xl mx-auto">
              <div className="space-y-4">
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                  <span className="text-sm font-bold text-gray-400 uppercase">Tipo de Negocio</span>
                  <span className="font-black text-slate-800">{selectedTier}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                  <span className="text-sm font-bold text-gray-400 uppercase">Nombre del Negocio</span>
                  <span className="font-bold text-slate-800">{form.businessName}</span>
                </div>
                {form.nit && (
                  <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                    <span className="text-sm font-bold text-gray-400 uppercase">NIT</span>
                    <span className="font-medium text-slate-700">{form.nit}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                  <span className="text-sm font-bold text-gray-400 uppercase">Teléfono</span>
                  <span className="font-medium text-slate-700">{form.phone}</span>
                </div>
                <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                  <span className="text-sm font-bold text-gray-400 uppercase">Dirección</span>
                  <span className="font-medium text-slate-700">{form.address}, {form.municipality}</span>
                </div>
                {form.monthlyVolume && (
                  <div className="flex justify-between items-center pb-4 border-b border-gray-100">
                    <span className="text-sm font-bold text-gray-400 uppercase">Volumen Mensual</span>
                    <span className="font-medium text-slate-700">{form.monthlyVolume}</span>
                  </div>
                )}
                <div className="flex justify-between items-start pt-2">
                  <span className="text-sm font-bold text-gray-400 uppercase">Solicitante</span>
                  <div className="text-right">
                    <span className="font-bold text-slate-800 block">{user?.fullName || user?.firstName}</span>
                    <span className="text-xs text-gray-400">{user?.primaryEmailAddress?.emailAddress}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Error Banner */}
            {submitError && (
              <div className="max-w-2xl mx-auto mt-6 bg-red-50 border border-red-200 rounded-xl p-4 flex items-center gap-3 text-red-800 text-sm font-bold">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Auth Gate */}
            {!isSignedIn ? (
              <div className="max-w-2xl mx-auto mt-8 bg-amber-50 border border-amber-300 rounded-2xl p-6 text-center shadow-lg">
                <p className="text-amber-950 font-black text-base mb-1">Crea tu cuenta o inicia sesión para vincular tu negocio</p>
                <p className="text-amber-800 text-xs mb-4">
                  Los datos que acabas de ingresar para <strong>{form.businessName}</strong> están guardados y no se perderán.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Link
                    href="/sign-up?redirect_url=/aplicar-negocio"
                    className="bg-[#E30613] hover:bg-[#c90510] text-[#FFCC00] px-6 py-2.5 rounded-full font-black text-xs uppercase tracking-wider shadow-md transition-all"
                  >
                    ✨ Crear Cuenta Ahora
                  </Link>
                  <Link
                    href="/sign-in?redirect_url=/aplicar-negocio"
                    className="bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 px-6 py-2.5 rounded-full font-bold text-xs uppercase tracking-wider shadow-sm transition-all"
                  >
                    Ya tengo cuenta · Iniciar Sesión
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex justify-between mt-8 max-w-2xl mx-auto">
                <button
                  onClick={() => setStep(2)}
                  className="text-gray-300 hover:text-white font-bold flex items-center gap-2 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Editar datos
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting}
                  className="bg-[#4CAF50] hover:bg-green-700 disabled:opacity-50 text-white px-8 py-3 rounded-full font-bold shadow-lg flex items-center gap-2 transition-all"
                >
                  {isSubmitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Enviando...</>
                  ) : (
                    <><Send className="w-4 h-4" /> Enviar Solicitud</>
                  )}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
    </div>
  );
}
