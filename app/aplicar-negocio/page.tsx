'use client';

import React, { useState } from 'react';
import { useUser, SignInButton } from '@clerk/nextjs';
import Image from 'next/image';
import { submitBusinessApplication } from '@/src/actions/businessApplications';
import { Building2, Store, ChefHat, ArrowRight, ArrowLeft, CheckCircle2, Shield, Truck, Percent, Send, Loader2 } from 'lucide-react';
import type { BusinessTier } from '@/src/lib/supabase';

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
  'Bucaramanga', 'Floridablanca', 'Girón', 'Piedecuesta',
  'Lebrija', 'San Gil', 'Socorro', 'Barichara', 'Cúcuta', 'Otro',
];

export default function AplicarNegocioPage() {
  const { user, isSignedIn, isLoaded } = useUser();
  const [step, setStep] = useState(1);
  const [selectedTier, setSelectedTier] = useState<BusinessTier | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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

  const updateForm = (key: string, value: string) => {
    setForm(prev => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async () => {
    if (!user || !selectedTier) return;
    setIsSubmitting(true);

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
      setSubmitted(true);
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
    return (
      <div className="min-h-[70vh] flex items-center justify-center px-4">
        <div className="max-w-lg text-center">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-[#4CAF50]" />
          </div>
          <h1 className="text-3xl font-black text-slate-800 mb-4 font-serif">¡Solicitud Enviada!</h1>
          <p className="text-gray-600 mb-2 text-lg">
            Tu solicitud para <strong className="text-[#E30613]">{form.businessName}</strong> como <strong>{selectedTier}</strong> ha sido recibida.
          </p>
          <p className="text-gray-500 text-sm mb-8">
            Nuestro equipo revisará tu aplicación en las próximas 24-48 horas. Te notificaremos por correo electrónico cuando sea aprobada.
          </p>
          <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-sm text-gray-500 mb-8">
            <p className="font-bold text-slate-700 mb-1">¿Qué sigue?</p>
            <p>Una vez aprobada, tu cuenta se actualizará automáticamente con los precios especiales de tu tier. Podrás ver el cambio reflejado inmediatamente al iniciar sesión.</p>
          </div>
          <a href="/" className="inline-flex items-center gap-2 bg-[#E30613] hover:bg-[#c90510] text-[#FFCC00] px-8 py-3 rounded-full font-bold shadow-lg transition-all">
            Seguir comprando <ArrowRight className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-b from-slate-50 to-white min-h-screen">
      {/* Hero Banner */}
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

      <div className="max-w-4xl mx-auto px-4 -mt-4 pb-20">
        {/* Step Indicator */}
        <div className="flex items-center justify-center gap-2 mb-12">
          {[1, 2, 3].map(s => (
            <React.Fragment key={s}>
              <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-sm transition-all ${step >= s ? 'bg-[#E30613] text-white shadow-lg scale-110' : 'bg-gray-200 text-gray-400'}`}>
                {step > s ? '✓' : s}
              </div>
              {s < 3 && (
                <div className={`w-12 sm:w-20 h-1 rounded-full transition-colors ${step > s ? 'bg-[#E30613]' : 'bg-gray-200'}`}></div>
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
                    className={`text-left rounded-2xl border-2 overflow-hidden transition-all flex flex-col ${isSelected ? `${tier.border} shadow-xl scale-[1.02]` : 'border-gray-200 hover:border-gray-300 hover:shadow-lg'}`}
                  >
                    {tier.image && (
                      <div className="w-full h-48 relative">
                        <Image src={tier.image} alt={tier.title} fill className="object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent"></div>
                        <div className={`absolute bottom-4 left-4 w-12 h-12 rounded-xl bg-gradient-to-br ${tier.color} flex items-center justify-center shadow-md border-2 border-white`}>
                          <Icon className="w-6 h-6 text-white" />
                        </div>
                      </div>
                    )}
                    <div className="p-8 pt-6 flex-1">
                      <h3 className="text-xl font-black text-slate-800 mb-1">{tier.title}</h3>
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
              <div className="bg-white border border-gray-100 rounded-xl p-5 text-center">
                <Percent className="w-8 h-8 text-[#E30613] mx-auto mb-2" />
                <h4 className="font-bold text-slate-800 text-sm">Precios Exclusivos</h4>
                <p className="text-xs text-gray-500 mt-1">Hasta 30% menos que precio al detal</p>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-5 text-center">
                <Truck className="w-8 h-8 text-[#4CAF50] mx-auto mb-2" />
                <h4 className="font-bold text-slate-800 text-sm">Entrega Prioritaria</h4>
                <p className="text-xs text-gray-500 mt-1">Antes de las 6 AM en su negocio</p>
              </div>
              <div className="bg-white border border-gray-100 rounded-xl p-5 text-center">
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
            <div className="text-center mb-10">
              <h2 className="text-2xl font-black text-slate-800 font-serif">Datos de su Negocio</h2>
              <p className="text-gray-500 mt-2">Complete la información para verificar su establecimiento.</p>
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
            <div className="text-center mb-10">
              <h2 className="text-2xl font-black text-slate-800 font-serif">Confirmar Solicitud</h2>
              <p className="text-gray-500 mt-2">Revise su información antes de enviar.</p>
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

            {/* Auth Gate */}
            {!isSignedIn ? (
              <div className="max-w-2xl mx-auto mt-8 bg-yellow-50 border border-yellow-200 rounded-xl p-6 text-center">
                <p className="text-yellow-800 font-bold mb-3">Debes iniciar sesión para enviar tu solicitud</p>
                <SignInButton mode="modal">
                  <button className="bg-[#E30613] text-[#FFCC00] px-6 py-2.5 rounded-full font-bold shadow-md">
                    Iniciar Sesión
                  </button>
                </SignInButton>
              </div>
            ) : (
              <div className="flex justify-between mt-8 max-w-2xl mx-auto">
                <button
                  onClick={() => setStep(2)}
                  className="text-gray-500 hover:text-gray-700 font-bold flex items-center gap-2 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" /> Editar
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
  );
}
