'use client';

import React, { useState } from 'react';
import { Gift, Plus, GripVertical, Settings2, Image as ImageIcon, Trash2, CheckCircle } from 'lucide-react';
import { Product } from '@/src/actions/products';
import { createOrUpdateKit, KitPayload } from '@/src/actions/kits';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

export default function KitsClient({ initialProducts }: { initialProducts: Product[] }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [kitName, setKitName] = useState('Kit Nuevo');
  const [kitSlug, setKitSlug] = useState('kit-nuevo');
  const [kitPrice, setKitPrice] = useState('0');
  const [kitItems, setKitItems] = useState<{ product: Product; quantity: number }[]>([]);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState('');

  const filteredProducts = initialProducts.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));

  const handleDragStart = (e: React.DragEvent, product: Product) => {
    e.dataTransfer.setData('application/json', JSON.stringify(product));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    try {
      const data = e.dataTransfer.getData('application/json');
      if (data) {
        const product: Product = JSON.parse(data);
        if (!kitItems.find(i => i.product.id === product.id)) {
          setKitItems(prev => [...prev, { product, quantity: 1 }]);
        }
      }
    } catch (err) {
      console.error('Drop error', err);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault(); // necessary to allow dropping
  };

  const handleRemoveItem = (id: string) => {
    setKitItems(prev => prev.filter(i => i.product.id !== id));
  };

  const handleUpdateQuantity = (id: string, qty: string) => {
    const val = parseFloat(qty) || 0;
    setKitItems(prev => prev.map(i => i.product.id === id ? { ...i, quantity: val } : i));
  };

  const handleBannerChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setBannerFile(file);
      setBannerPreview(URL.createObjectURL(file));
    }
  };

  const handleSaveKit = async () => {
    if (kitItems.length === 0) {
      alert("Agrega al menos un producto al kit.");
      return;
    }
    setIsSaving(true);
    try {
      let finalBannerUrl = '';
      
      // Upload Banner if exists
      if (bannerFile) {
        const fileExt = bannerFile.name.split('.').pop();
        const fileName = `${kitSlug}-${Date.now()}.${fileExt}`;
        const { data, error } = await supabase.storage
          .from('kit-banners')
          .upload(fileName, bannerFile);
          
        if (error) {
          console.error("Error uploading banner:", error);
        } else if (data) {
          const { data: publicData } = supabase.storage.from('kit-banners').getPublicUrl(data.path);
          finalBannerUrl = publicData.publicUrl;
        }
      }

      const payload: KitPayload = {
        name: kitName,
        slug: kitSlug,
        fixed_price: parseFloat(kitPrice.replace(/\./g, '')), // Parse '45.000' to 45000
        banner_url: finalBannerUrl || undefined,
        items: kitItems.map(i => ({
          product_id: i.product.id,
          quantity: i.quantity
        }))
      };

      await createOrUpdateKit(payload);
      
      setToast('Kit guardado exitosamente.');
      setTimeout(() => setToast(''), 3000);
      
      // Reset
      setKitName('Kit Nuevo');
      setKitSlug(`kit-nuevo-${Date.now().toString().slice(-4)}`);
      setKitPrice('0');
      setKitItems([]);
      setBannerFile(null);
      setBannerPreview(null);

    } catch (err) {
      console.error(err);
      alert("Hubo un error guardando el kit.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-8 max-w-[1600px] mx-auto h-[calc(100vh-100px)] flex flex-col relative">
      {toast && (
        <div className="absolute top-0 right-8 bg-green-500 text-white px-4 py-2 rounded-lg font-bold shadow-lg flex items-center gap-2 animate-fade-in z-50">
           <CheckCircle className="w-5 h-5" /> {toast}
        </div>
      )}

      <div className="flex items-center justify-between mb-8">
         <div className="flex items-center gap-4">
            <div className="bg-[#E30613]/10 p-3 rounded-xl border border-[#E30613]/20">
               <Gift className="h-8 w-8 text-[#E30613]" />
            </div>
            <div>
               <h1 className="text-3xl font-black text-slate-800">Constructor de Kits y Combos</h1>
               <p className="text-gray-500 mt-1">Arrastra productos para ensamblar "Kits Chéveres" y fija precios cerrados.</p>
            </div>
         </div>
         <button 
          onClick={handleSaveKit}
          disabled={isSaving}
          className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-lg font-bold shadow-md transition-all flex items-center gap-2 disabled:opacity-50">
            {isSaving ? 'Guardando...' : <><Plus className="h-4 w-4" /> Guardar Kit / Combo</>}
         </button>
      </div>

      <div className="flex-1 flex gap-8 min-h-0">
         {/* Left Pane: Global Catalog Search */}
         <div className="w-[400px] bg-white rounded-2xl shadow-sm border border-gray-200 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-gray-100 bg-slate-50">
               <h3 className="font-bold text-slate-800 mb-2">Catálogo Surtifruver</h3>
               <input 
                 type="text" 
                 placeholder="Buscar para arrastrar..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm outline-none focus:border-[#E30613]" 
               />
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/50">
               {filteredProducts.map(p => (
                  <div 
                    key={p.id} 
                    draggable 
                    onDragStart={(e) => handleDragStart(e, p)}
                    className="flex flex-col bg-white border border-gray-100 p-3 rounded-lg hover:border-[#4CAF50] hover:shadow-md transition-all cursor-grab active:cursor-grabbing group"
                  >
                     <span className="font-bold text-slate-800 text-sm">{p.name}</span>
                     <span className="text-xs text-gray-500">{p.category} • ${p.priceRetail.toLocaleString()} COP / {p.unit}</span>
                  </div>
               ))}
            </div>
         </div>

         {/* Right Pane: Kit Builder Canvas */}
         <div 
           onDrop={handleDrop} 
           onDragOver={handleDragOver}
           className="flex-1 bg-white rounded-2xl shadow-xl border-2 border-[#E30613]/20 flex flex-col overflow-hidden"
         >
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-[#E30613]/5 to-transparent flex justify-between items-start">
               <div className="flex-1">
                  <input 
                    type="text" 
                    value={kitName}
                    onChange={(e) => {
                      setKitName(e.target.value);
                      setKitSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                    }}
                    placeholder="Nombre del Kit"
                    className="text-3xl font-black text-slate-800 bg-transparent border-none outline-none w-full hover:bg-white focus:bg-white rounded p-1 transition-colors" 
                  />
                  <div className="flex items-center gap-1 mt-2 text-sm text-[#E30613] font-bold">
                     <Settings2 className="h-4 w-4" /> URL Slug: /shop?category=kits/{kitSlug}
                  </div>
               </div>
               <div className="text-right">
                  <p className="text-xs font-bold uppercase text-gray-400 mb-1">Precio Fijo del Combo</p>
                  <div className="flex items-center gap-2">
                     <span className="font-black text-2xl text-slate-800">$</span>
                     <input 
                       type="text" 
                       value={kitPrice}
                       onChange={(e) => setKitPrice(e.target.value)}
                       className="text-3xl font-black text-[#E30613] outline-none text-right w-32 border-b-2 border-dashed border-red-300 focus:border-[#E30613] bg-transparent" 
                     />
                  </div>
               </div>
            </div>

            <div className="flex-1 p-6 bg-slate-50/50 overflow-y-auto w-full max-w-3xl mx-auto space-y-4">
               {/* Banner Upload */}
               <label className="border-2 border-dashed border-gray-300 rounded-xl p-6 flex flex-col items-center justify-center text-gray-500 hover:border-[#E30613] hover:text-[#E30613] transition-colors cursor-pointer bg-white overflow-hidden relative">
                  {bannerPreview ? (
                     <img src={bannerPreview} alt="Banner" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                  ) : (
                    <>
                      <ImageIcon className="h-8 w-8 mb-2" />
                      <span className="font-bold">Subir Imagen del Banner (JPG/PNG)</span>
                      <span className="text-xs mt-1 text-gray-400">Resolución recomendada: 1200x400px</span>
                    </>
                  )}
                  <input type="file" accept="image/*" className="hidden" onChange={handleBannerChange} />
               </label>

               {/* Dropped items area */}
               {kitItems.length === 0 ? (
                 <div className="text-center py-20">
                   <p className="text-gray-400 font-medium">Arrastra productos del catálogo aquí para armar tu combo.</p>
                 </div>
               ) : (
                 kitItems.map(item => (
                   <div key={item.product.id} className="flex items-center gap-4 bg-white p-4 rounded-xl border border-gray-200 shadow-sm relative group">
                      <GripVertical className="h-5 w-5 text-gray-300 cursor-grab" />
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center overflow-hidden">
                         {item.product.imageUrl ? (
                           <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                         ) : (
                           <span className="text-xl">📦</span>
                         )}
                      </div>
                      <div className="flex-1">
                         <p className="font-bold text-slate-800">{item.product.name}</p>
                         <p className="text-xs text-gray-500">Valor Unitario: ${item.product.priceRetail.toLocaleString()} COP</p>
                      </div>
                      <div className="flex items-center gap-2">
                         <input 
                           type="number" 
                           value={item.quantity} 
                           onChange={(e) => handleUpdateQuantity(item.product.id, e.target.value)}
                           className="w-16 border border-gray-200 rounded p-1 text-center font-bold" 
                         /> 
                         <span className="text-sm text-gray-500 font-medium">{item.product.unit}</span>
                      </div>
                      <button 
                        onClick={() => handleRemoveItem(item.product.id)}
                        className="opacity-0 group-hover:opacity-100 absolute -right-3 -top-3 bg-red-100 text-red-600 p-2 rounded-full shadow-md hover:bg-red-500 hover:text-white transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                   </div>
                 ))
               )}
            </div>
         </div>
      </div>
    </div>
  );
}
