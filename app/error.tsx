'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertCircle, RefreshCw, Home } from 'lucide-react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('Unhandled app error:', error);
  }, [error]);

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl border border-gray-100 p-8 text-center">
        <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mx-auto mb-5 text-red-600">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-2">Algo no salió como esperábamos</h2>
        <p className="text-slate-600 text-sm mb-6 leading-relaxed">
          Ha ocurrido una inconsistencia temporal. Puedes recargar la página o volver a la tienda principal.
          {error.digest && (
            <span className="block text-xs text-slate-400 mt-2 font-mono">ID de incidencia: {error.digest}</span>
          )}
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            onClick={() => reset()}
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl bg-red-700 text-white font-bold text-sm hover:bg-red-800 transition-colors shadow-sm"
          >
            <RefreshCw className="h-4 w-4" /> Recargar
          </button>
          <Link
            href="/"
            className="flex-1 inline-flex items-center justify-center gap-2 px-5 py-3 rounded-xl border border-slate-200 text-slate-700 font-bold text-sm hover:bg-slate-50 transition-colors"
          >
            <Home className="h-4 w-4" /> Inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

