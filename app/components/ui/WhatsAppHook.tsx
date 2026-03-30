'use client';

import React from 'react';

export default function WhatsAppHook() {
  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 isolate">
      {/* Tooltip/Hook Message */}
      <div className="bg-white px-4 py-2 rounded-2xl shadow-lg border border-gray-100 text-sm font-medium text-gray-700 animate-bounce mb-1">
        ¿Dudas con tu pedido? Habla con IA 👋
      </div>
      
      {/* FAB Button */}
      <button 
        className="w-16 h-16 bg-[#25D366] text-white rounded-full flex items-center justify-center shadow-lg hover:bg-[#128C7E] transition-all transform hover:scale-105 group relative"
        aria-label="Abrir Asistente AI WhatsApp"
      >
        {/* Pulsing rings */}
        <div className="absolute inset-0 rounded-full animate-ping bg-[#25D366] opacity-30"></div>
        
        {/* SVG Icon */}
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 relative z-10" fill="currentColor" viewBox="0 0 24 24">
          <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946.003-6.556 5.338-11.891 11.893-11.891 3.181.001 6.167 1.24 8.413 3.488 2.245 2.248 3.481 5.236 3.48 8.414-.003 6.557-5.338 11.892-11.893 11.892-1.99-.001-3.951-.5-5.688-1.448l-6.305 1.654zm6.597-3.807c1.676.995 3.276 1.591 5.392 1.592 5.448 0 9.898-4.45 9.898-9.898 0-5.452-4.453-9.899-9.898-9.899-5.451 0-9.898 4.448-9.898 9.898 0 2.115.602 3.734 1.598 5.422l-1.144 4.183 4.283-1.142zm11.396-8.156c-.035-.067-.13-.105-.275-.178-.145-.072-.857-.423-.989-.472-.132-.048-.228-.072-.324.072-.096.145-.373.473-.457.57-.084.098-.168.12-.313.047-.53-.263-1.189-.526-1.874-1.14-.523-.467-.876-1.042-.978-1.188-.102-.146-.011-.225.061-.297.065-.064.145-.17.218-.255.071-.084.095-.144.143-.242.048-.097.024-.181-.012-.255-.036-.073-.324-.783-.443-1.072-.116-.282-.234-.244-.323-.248-.084-.004-.18-.005-.276-.005-.096 0-.251.036-.383.181-.132.146-.503.493-.503 1.201 0 .708.515 1.393.587 1.489.072.097 1.015 1.549 2.459 2.174.344.148.613.237.822.303.346.11.661.094.908.057.276-.041.857-.35 1.978-.69.07-.46.07-.852.049-.933z" />
        </svg>
      </button>
    </div>
  );
}
