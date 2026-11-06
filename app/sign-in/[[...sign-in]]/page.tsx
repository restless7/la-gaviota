import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { SignIn } from '@clerk/nextjs';

export default function SignInPage() {
  return (
    <div className="min-h-[88vh] bg-gradient-to-br from-[#fdfbf7] via-white to-emerald-50/40 py-10 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden shadow-2xl border border-slate-200/80 bg-white">
        
        {/* Left Visual Showcase Column */}
        <div className="relative lg:col-span-6 min-h-[360px] lg:min-h-[680px] flex flex-col justify-between p-8 sm:p-12 text-white overflow-hidden">
          <Image
            src="/IMAGES/Colombian_produce_on_202603260851.jpeg"
            alt="Frutas y verduras frescas de Santander - La Gaviota"
            fill
            priority
            unoptimized
            className="object-cover object-center scale-105"
          />
          {/* Rich Multi-Stop Overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/95 via-slate-900/75 to-slate-900/45" />

          {/* Top Badge */}
          <div className="relative z-10 flex items-center justify-between gap-4">
            <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur-md border border-white/25 px-4 py-1.5 text-xs font-extrabold uppercase tracking-wider text-white shadow-sm">
              <span>🥑</span> Frescura de Santander a tu mesa
            </span>
          </div>

          {/* Center Value Proposition */}
          <div className="relative z-10 my-8 space-y-5">
            <h1 className="text-3xl sm:text-4xl font-black font-serif leading-tight tracking-tight text-white">
              Merca más rápido y guarda tus datos para siempre
            </h1>
            <p className="text-sm sm:text-base text-slate-200 font-medium leading-relaxed max-w-md">
              Accede a tu portal de <strong className="text-white font-extrabold">Surtifruver La Gaviota</strong> o crea tu cuenta en segundos para disfrutar de una experiencia sin filas.
            </p>

            <ul className="space-y-3 pt-2 text-sm text-slate-100 font-semibold">
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#83b745] text-white text-xs font-black">✓</span>
                <span>Guarda tu dirección en Bucaramanga, Floridablanca o Girón para no digitarla de nuevo.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#83b745] text-white text-xs font-black">✓</span>
                <span>Repite tus pedidos anteriores en 1 solo clic y rastrea tu entrega en vivo.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#83b745] text-white text-xs font-black">✓</span>
                <span>Accede a tarifas especiales para Hogares, Micromercados y Restaurantes.</span>
              </li>
            </ul>
          </div>

          {/* Explicit Account Creation Callout Card */}
          <div className="relative z-10 rounded-2xl bg-white/15 backdrop-blur-md border border-white/25 p-5 shadow-lg">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-black uppercase tracking-wider text-[#a8e063]">
                  ¿Primera vez en La Gaviota?
                </p>
                <p className="text-sm font-bold text-white mt-0.5">
                  Crea tu cuenta gratis en menos de 30 segundos.
                </p>
              </div>
              <Link
                href="/sign-up"
                className="inline-flex items-center justify-center rounded-xl bg-[#83b745] hover:bg-[#6fa335] px-5 py-3 text-xs font-black uppercase tracking-wider text-white shadow-md transition-all shrink-0"
              >
                ✨ Crear Cuenta Gratis →
              </Link>
            </div>
          </div>
        </div>

        {/* Right Authentication Column */}
        <div className="lg:col-span-6 flex flex-col justify-center items-center p-6 sm:p-10 lg:p-12 bg-white">
          <div className="w-full max-w-md space-y-6">
            
            {/* Explicit Mode Switcher Tabs */}
            <div className="grid grid-cols-2 gap-2 p-1.5 bg-slate-100 rounded-2xl border border-slate-200">
              <div className="text-center py-2.5 px-3 rounded-xl bg-white text-slate-900 font-black text-xs uppercase tracking-wider shadow-sm">
                Iniciar Sesión
              </div>
              <Link
                href="/sign-up"
                className="text-center py-2.5 px-3 rounded-xl text-[#5b8726] hover:bg-white/60 font-black text-xs uppercase tracking-wider transition-colors flex items-center justify-center gap-1"
              >
                <span>✨</span> Crear Cuenta
              </Link>
            </div>

            {/* New User Explicit Prompt Banner */}
            <div className="rounded-2xl border-2 border-[#83b745]/35 bg-[#f4faeb] p-4 flex items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-xs font-black text-slate-900">
                  ¿Aún no tienes usuario registrado?
                </p>
                <p className="text-[11px] font-semibold text-slate-600 mt-0.5">
                  Regístrate gratis con Google o con tu correo electrónico.
                </p>
              </div>
              <Link
                href="/sign-up"
                className="shrink-0 rounded-xl bg-[#83b745] hover:bg-[#6c9c36] px-3.5 py-2 text-[11px] font-black uppercase tracking-wide text-white shadow-sm transition-colors"
              >
                Registrarme
              </Link>
            </div>

            {/* Clerk SignIn Component */}
            <div className="flex justify-center">
              <SignIn
                path="/sign-in"
                routing="path"
                signUpUrl="/sign-up"
                appearance={{
                  elements: {
                    rootBox: 'w-full mx-auto',
                    card: 'shadow-md border border-slate-100 rounded-2xl w-full',
                  }
                }}
              />
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}
