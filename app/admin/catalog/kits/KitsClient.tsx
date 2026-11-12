'use client';

import React, { useState } from 'react';
import { 
  Gift, 
  Plus, 
  GripVertical, 
  Settings2, 
  Image as ImageIcon, 
  Trash2, 
  CheckCircle,
  Sparkles,
  Edit,
  Eye,
  EyeOff,
  Package,
  Layers,
  Info,
  Check,
  X
} from 'lucide-react';
import { AdminProduct as Product } from '@/src/actions/products';
import { createOrUpdateKit, updateKitStatus, updateKitName, deleteKit, KitPayload } from '@/src/actions/kits';
import { uploadCatalogMedia } from '@/src/actions/media';

interface KitRecord {
  id: string;
  name: string;
  slug: string;
  fixed_price: number;
  banner_url?: string | null;
  status: 'active' | 'draft' | 'archived';
  created_at?: string;
  kit_items?: Array<{
    id: string;
    quantity: number;
    product_id: string;
    products?: {
      name: string;
      unit: string;
      image_url?: string | null;
      price_retail: number;
    };
  }>;
}

const PRESET_BANNERS = [
  { name: 'Banner Opción 1', url: '/IMAGES/kit-chevere-semana.jpg' },
  { name: 'Banner Opción 2', url: '/IMAGES/kit-chevere-semana2.jpeg' },
  { name: 'Banner Opción 3', url: '/IMAGES/kit-chevere-semana3.jpeg' }
];

export default function KitsClient({ 
  initialProducts, 
  initialKits = [] 
}: { 
  initialProducts: Product[]; 
  initialKits?: KitRecord[];
}) {
  const [kits, setKits] = useState<KitRecord[]>(initialKits as KitRecord[]);
  const [editingKitId, setEditingKitId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [kitName, setKitName] = useState('Kit Chévere de la Semana');
  const [kitSlug, setKitSlug] = useState('kit-chevere-de-la-semana');
  const [kitPrice, setKitPrice] = useState('45000');
  const [kitItems, setKitItems] = useState<{ product: Product; quantity: number }[]>([]);
  const [bannerFile, setBannerFile] = useState<File | null>(null);
  const [bannerPreview, setBannerPreview] = useState<string | null>('/IMAGES/kit-chevere-semana.jpg');
  const [customBannerUrl, setCustomBannerUrl] = useState<string | null>('/IMAGES/kit-chevere-semana.jpg');
  const [isSaving, setIsSaving] = useState(false);
  const [toast, setToast] = useState('');
  const [editingNameId, setEditingNameId] = useState<string | null>(null);
  const [inlineNameValue, setInlineNameValue] = useState<string>('');

  const activeKits = kits.filter(k => k.status === 'active');
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

  const handleAddProductClick = (product: Product) => {
    if (!kitItems.find(i => i.product.id === product.id)) {
      setKitItems(prev => [...prev, { product, quantity: 1 }]);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
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
      setCustomBannerUrl(null);
    }
  };

  const handleSelectPresetBanner = (url: string) => {
    setBannerFile(null);
    setBannerPreview(url);
    setCustomBannerUrl(url);
  };

  const handleEditKit = (kit: KitRecord) => {
    setEditingKitId(kit.id);
    setKitName(kit.name);
    setKitSlug(kit.slug);
    setKitPrice(kit.fixed_price.toString());
    setBannerPreview(kit.banner_url || '/IMAGES/kit-chevere-semana.jpg');
    setCustomBannerUrl(kit.banner_url || null);
    setBannerFile(null);

    if (kit.kit_items && kit.kit_items.length > 0) {
      const mapped = kit.kit_items.map(item => {
        const prod = initialProducts.find(p => p.id === item.product_id) || {
          id: item.product_id,
          name: item.products?.name || 'Producto',
          category: 'Varios',
          subcategory: null,
          unit: item.products?.unit || 'Kg',
          baseCost: 0,
          priceRetail: item.products?.price_retail || 0,
          priceMicro: 0,
          priceRestaurant: 0,
          previousPriceRetail: null,
          previousPriceMicro: null,
          previousPriceRestaurant: null,
          stockQuantity: 999,
          isActive: true,
          isInSeason: true,
          imageUrl: item.products?.image_url || null,
          description: null
        };
        return { product: prod, quantity: item.quantity };
      });
      setKitItems(mapped);
    } else {
      setKitItems([]);
    }
  };

  const handleCancelEdit = () => {
    setEditingKitId(null);
    setKitName('Kit Chévere Nuevo');
    setKitSlug(`kit-chevere-${Date.now().toString().slice(-4)}`);
    setKitPrice('45000');
    setKitItems([]);
    setBannerFile(null);
    setBannerPreview('/IMAGES/kit-chevere-semana.jpg');
    setCustomBannerUrl('/IMAGES/kit-chevere-semana.jpg');
  };

  const handleStartRename = (kit: KitRecord) => {
    setEditingNameId(kit.id);
    setInlineNameValue(kit.name);
  };

  const handleSaveRename = async (kitId: string) => {
    if (!inlineNameValue.trim()) return;
    try {
      await updateKitName(kitId, inlineNameValue.trim());
      setKits(prev => prev.map(k => k.id === kitId ? { ...k, name: inlineNameValue.trim() } : k));
      if (editingKitId === kitId) {
        setKitName(inlineNameValue.trim());
      }
      setEditingNameId(null);
      setToast(`Kit renombrado a "${inlineNameValue.trim()}"`);
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      console.error(err);
      alert('Error al renombrar el kit');
    }
  };

  const handleToggleStatus = async (kit: KitRecord) => {
    const newStatus = kit.status === 'active' ? 'draft' : 'active';
    const activeCount = kits.filter(k => k.id !== kit.id && k.status === 'active').length;
    if (newStatus === 'active' && activeCount >= 3) {
      alert('Ya tienes 3 Kits Chéveres activos para la vitrina de la tienda. Desactiva uno primero antes de activar este.');
      return;
    }
    try {
      await updateKitStatus(kit.id, newStatus);
      setKits(prev => prev.map(k => k.id === kit.id ? { ...k, status: newStatus } : k));
      setToast(`Kit "${kit.name}" cambiado a ${newStatus === 'active' ? 'Activo (visible en tienda)' : 'Borrador'}`);
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      console.error(err);
      alert('Error al actualizar el estado del kit');
    }
  };

  const handleDeleteKit = async (kitId: string) => {
    if (!confirm('¿Estás seguro de eliminar este kit?')) return;
    try {
      await deleteKit(kitId);
      setKits(prev => prev.filter(k => k.id !== kitId));
      if (editingKitId === kitId) handleCancelEdit();
      setToast('Kit eliminado correctamente');
      setTimeout(() => setToast(''), 3000);
    } catch (err) {
      console.error(err);
      alert('Error al eliminar el kit');
    }
  };

  const handleSaveKit = async () => {
    if (kitItems.length === 0) {
      alert('Agrega al menos un producto al kit.');
      return;
    }
    setIsSaving(true);
    try {
      let finalBannerUrl = customBannerUrl || '';

      if (bannerFile) {
        const upload = new FormData();
        upload.set('file', bannerFile);
        finalBannerUrl = (await uploadCatalogMedia('kit', upload)).url;
      }

      const parsedPrice = parseFloat(kitPrice.replace(/[^\d]/g, '')) || 0;

      const payload: KitPayload = {
        id: editingKitId || undefined,
        name: kitName,
        slug: kitSlug,
        fixed_price: parsedPrice,
        banner_url: finalBannerUrl || undefined,
        items: kitItems.map(i => ({
          product_id: i.product.id,
          quantity: i.quantity
        }))
      };

      const res = await createOrUpdateKit(payload);

      // Refresh local kits list
      const savedKit: KitRecord = {
        id: res.kitId || editingKitId || `kit-${Date.now()}`,
        name: kitName,
        slug: kitSlug,
        fixed_price: parsedPrice,
        banner_url: finalBannerUrl || null,
        status: 'active',
        kit_items: kitItems.map((item, idx) => ({
          id: `ki-${idx}`,
          quantity: item.quantity,
          product_id: item.product.id,
          products: {
            name: item.product.name,
            unit: item.product.unit,
            image_url: item.product.imageUrl,
            price_retail: item.product.priceRetail
          }
        }))
      };

      setKits(prev => {
        const exists = prev.some(k => k.id === savedKit.id);
        if (exists) return prev.map(k => k.id === savedKit.id ? savedKit : k);
        return [savedKit, ...prev];
      });

      setToast(editingKitId ? 'Kit actualizado exitosamente.' : 'Nuevo Kit guardado y activo.');
      setTimeout(() => setToast(''), 3000);

      handleCancelEdit();
    } catch (err) {
      console.error(err);
      alert('Hubo un error guardando el kit.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-4 sm:p-8 max-w-[1700px] mx-auto min-h-screen flex flex-col gap-6 relative">
      {toast && (
        <div className="fixed top-24 right-8 bg-emerald-600 text-white px-5 py-3 rounded-2xl font-bold shadow-2xl flex items-center gap-2 animate-in fade-in slide-in-from-top-4 z-50">
           <CheckCircle className="w-5 h-5" /> {toast}
        </div>
      )}

      {/* Header bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-gray-100 shadow-sm">
         <div className="flex items-center gap-4">
            <div className="bg-[#E30613]/10 p-3.5 rounded-2xl border border-[#E30613]/20">
               <Gift className="h-8 w-8 text-[#E30613]" />
            </div>
            <div>
               <div className="flex items-center gap-2">
                 <h1 className="text-2xl sm:text-3xl font-black text-slate-800 font-serif">Kits Chéveres y Negocios</h1>
                 <span className="text-xs font-black uppercase px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-900 border border-amber-300">
                   Hasta 3 en Vitrina
                 </span>
               </div>
               <p className="text-gray-500 text-xs sm:text-sm mt-1">
                 Administra las opciones de &quot;Kit Chévere&quot; que se exhiben en la tienda pública (máximo 3 activos simultáneos).
               </p>
            </div>
         </div>
         <div className="flex items-center gap-3">
            {editingKitId && (
              <button
                type="button"
                onClick={handleCancelEdit}
                className="px-4 py-2.5 rounded-xl border border-gray-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors"
              >
                Cancelar Edición
              </button>
            )}
            <button 
              onClick={handleSaveKit}
              disabled={isSaving}
              className="bg-red-700 hover:bg-red-800 text-white px-6 py-2.5 rounded-xl font-bold text-xs sm:text-sm shadow-md transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : <><Plus className="h-4 w-4" /> {editingKitId ? 'Actualizar Kit' : 'Guardar y Activar Kit'}</>}
            </button>
         </div>
      </div>

      {/* Status banner for active showcase kits */}
      <div className="bg-gradient-to-r from-slate-900 to-amber-950 p-4 sm:p-5 rounded-2xl text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-md border border-amber-500/20">
        <div className="flex items-center gap-3">
          <Sparkles className="h-5 w-5 text-amber-400 shrink-0" />
          <div className="text-xs sm:text-sm">
            <span className="font-bold text-amber-300">Estado de Vitrina: </span>
            <span>{activeKits.length} de 3 opciones de Kit Chévere activas.</span>
            <span className="text-slate-300 ml-1 hidden md:inline">
              Los kits con estado &quot;Activo&quot; rotan en el banner principal de la tienda.
            </span>
          </div>
        </div>
        <div className="flex items-center gap-1.5 self-end sm:self-auto">
          {[0, 1, 2].map(slot => (
            <div 
              key={slot} 
              className={`h-2.5 w-7 rounded-full transition-colors ${
                slot < activeKits.length ? 'bg-amber-400 shadow-sm shadow-amber-400/50' : 'bg-white/20'
              }`} 
              title={`Ranura ${slot + 1}: ${activeKits[slot]?.name || 'Vacía'}`}
            />
          ))}
        </div>
      </div>

      {/* Existing Kits List */}
      {kits.length > 0 && (
        <div className="bg-white rounded-3xl p-6 border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-slate-800 flex items-center gap-2">
              <Layers className="h-5 w-5 text-red-600" />
              <span>Kits Registrados en el Sistema ({kits.length})</span>
            </h2>
            <span className="text-xs text-slate-400 font-medium">Click en &quot;Editar&quot; para cargarlo al canvas</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {kits.map(kit => {
              const isActive = kit.status === 'active';
              const isCurrentlyEditing = editingKitId === kit.id;
              return (
                <div 
                  key={kit.id}
                  className={`rounded-2xl border p-4 transition-all ${
                    isCurrentlyEditing 
                      ? 'border-red-500 bg-red-50/20 shadow-md ring-2 ring-red-400/30' 
                      : isActive 
                        ? 'border-amber-300 bg-amber-50/20' 
                        : 'border-gray-200 bg-white'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2 mb-2">
                    <div className="flex-1 min-w-0">
                      <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-black uppercase tracking-wider ${
                        isActive 
                          ? 'bg-emerald-100 text-emerald-800 border border-emerald-200' 
                          : 'bg-slate-100 text-slate-600'
                      }`}>
                        {isActive ? <><Eye size={10} /> En Vitrina (Activo)</> : <><EyeOff size={10} /> Borrador</>}
                      </span>

                      {editingNameId === kit.id ? (
                        <div className="flex items-center gap-1 mt-1.5">
                          <input
                            autoFocus
                            type="text"
                            value={inlineNameValue}
                            onChange={(e) => setInlineNameValue(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleSaveRename(kit.id);
                              if (e.key === 'Escape') setEditingNameId(null);
                            }}
                            className="text-xs font-bold px-2 py-1 border border-red-500 rounded-lg outline-none w-full bg-white text-slate-900 shadow-sm"
                            placeholder="Nombre del Kit"
                          />
                          <button
                            type="button"
                            onClick={() => handleSaveRename(kit.id)}
                            className="p-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg transition-colors shrink-0"
                            title="Guardar nombre"
                          >
                            <Check size={12} />
                          </button>
                          <button
                            type="button"
                            onClick={() => setEditingNameId(null)}
                            className="p-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-lg transition-colors shrink-0"
                            title="Cancelar"
                          >
                            <X size={12} />
                          </button>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 mt-1 group/title">
                          <h3 className="font-bold text-slate-900 text-sm line-clamp-1">{kit.name}</h3>
                          <button
                            type="button"
                            onClick={() => handleStartRename(kit)}
                            className="opacity-70 group-hover/title:opacity-100 text-slate-400 hover:text-red-600 p-0.5 rounded transition-all shrink-0"
                            title="Editar nombre del kit"
                          >
                            <Edit size={12} />
                          </button>
                        </div>
                      )}
                      
                      <p className="text-xs text-slate-400 font-mono mt-0.5">/shop?category=kits/{kit.slug}</p>
                    </div>
                    <span className="text-base font-black text-slate-900 whitespace-nowrap shrink-0">
                      ${Number(kit.fixed_price).toLocaleString('es-CO')}
                    </span>
                  </div>

                  <div className="relative aspect-[16/9] w-full rounded-xl overflow-hidden bg-slate-100 mb-3 border border-gray-100">
                    <img 
                      src={kit.banner_url || '/IMAGES/kit-chevere-semana.jpg'} 
                      alt={kit.name}
                      className="w-full h-full object-contain"
                    />
                    <span className="absolute bottom-1 right-1 bg-black/60 text-white text-[10px] px-1.5 py-0.5 rounded backdrop-blur-sm">
                      {kit.kit_items?.length || 0} productos
                    </span>
                  </div>

                  <div className="flex items-center justify-between gap-2 pt-2 border-t border-gray-100">
                    <button
                      type="button"
                      onClick={() => handleToggleStatus(kit)}
                      className={`text-xs font-bold px-3 py-1.5 rounded-lg transition-colors flex items-center gap-1.5 ${
                        isActive 
                          ? 'text-amber-800 bg-amber-100 hover:bg-amber-200' 
                          : 'text-emerald-800 bg-emerald-50 hover:bg-emerald-100'
                      }`}
                    >
                      {isActive ? <><EyeOff size={12} /> Pausar</> : <><Eye size={12} /> Activar</>}
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleEditKit(kit)}
                        className="text-xs font-bold px-3 py-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 transition-colors flex items-center gap-1"
                      >
                        <Edit size={12} /> Editar
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteKit(kit.id)}
                        className="text-xs font-bold p-1.5 rounded-lg text-red-600 hover:bg-red-50 transition-colors"
                        title="Eliminar kit"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Builder Workspace: Catalog on Left, Canvas on Right */}
      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-[600px]">
         
         {/* Left Pane: Global Catalog Search */}
         <div className="w-full lg:w-[420px] bg-white rounded-3xl shadow-sm border border-gray-200 flex flex-col overflow-hidden max-h-[750px]">
            <div className="p-4 border-b border-gray-100 bg-slate-50">
               <h3 className="font-bold text-slate-800 text-sm mb-2 flex items-center gap-2">
                 <Package className="h-4 w-4 text-emerald-600" />
                 <span>Catálogo Disponible</span>
               </h3>
               <input 
                 type="text" 
                 placeholder="Buscar producto para agregar..." 
                 value={searchTerm}
                 onChange={(e) => setSearchTerm(e.target.value)}
                 className="w-full px-3 py-2 border border-gray-200 rounded-xl text-xs outline-none focus:border-red-600 bg-white font-medium" 
               />
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-2 bg-slate-50/50">
               {filteredProducts.map(p => (
                  <div 
                    key={p.id} 
                    draggable 
                    onDragStart={(e) => handleDragStart(e, p)}
                    onClick={() => handleAddProductClick(p)}
                    className="flex items-center justify-between bg-white border border-gray-100 p-2.5 rounded-xl hover:border-emerald-500 hover:shadow-sm transition-all cursor-pointer group"
                    title="Arrastra o haz click para agregar al kit"
                  >
                     <div className="flex items-center gap-2.5 min-w-0">
                       <div className="h-9 w-9 rounded-lg bg-slate-100 overflow-hidden shrink-0">
                         {p.imageUrl ? (
                           <img src={p.imageUrl} alt={p.name} className="h-full w-full object-cover" />
                         ) : (
                           <div className="h-full w-full flex items-center justify-center text-xs">🧺</div>
                         )}
                       </div>
                       <div className="min-w-0">
                         <p className="font-bold text-slate-800 text-xs truncate">{p.name}</p>
                         <p className="text-[10px] text-gray-500">${p.priceRetail.toLocaleString()} COP / {p.unit}</p>
                       </div>
                     </div>
                     <button
                       type="button"
                       className="h-7 w-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center text-xs font-bold opacity-80 group-hover:opacity-100 group-hover:bg-emerald-600 group-hover:text-white transition-all shrink-0"
                     >
                       +
                     </button>
                  </div>
               ))}
            </div>
         </div>

         {/* Right Pane: Kit Builder Canvas */}
         <div 
           onDrop={handleDrop} 
           onDragOver={handleDragOver}
           className="flex-1 bg-white rounded-3xl shadow-md border-2 border-red-500/20 flex flex-col overflow-hidden"
         >
            <div className="p-6 border-b border-gray-100 bg-gradient-to-r from-red-500/5 via-amber-500/5 to-transparent flex flex-col sm:flex-row justify-between items-start gap-4">
               <div className="flex-1 w-full">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-red-100 text-red-800">
                      {editingKitId ? 'Modo Edición de Kit' : 'Nuevo Kit Chévere'}
                    </span>
                    <span className="text-[11px] text-slate-400 font-medium">Nombre visible en vitrina y carrito</span>
                  </div>
                  <input 
                    type="text" 
                    value={kitName}
                    onChange={(e) => {
                      setKitName(e.target.value);
                      if (!editingKitId) {
                        setKitSlug(e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                      }
                    }}
                    placeholder="Nombre del Kit Chévere (ej. Kit Semanal, Kit Familiar)"
                    className="text-2xl sm:text-3xl font-black text-slate-800 bg-transparent border-none outline-none w-full hover:bg-white focus:bg-white rounded-xl p-1 transition-colors" 
                  />

                  {/* Quick Name Presets */}
                  <div className="flex flex-wrap items-center gap-1.5 mt-2">
                    <span className="text-[10px] font-bold text-slate-400 uppercase">Sugerencias:</span>
                    {['Kit Semanal', 'Kit Familiar', 'Kit Restaurante', 'Kit Mayorista'].map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => {
                          setKitName(preset);
                          if (!editingKitId) setKitSlug(preset.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                        }}
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-600 border border-slate-200 transition-colors"
                      >
                        {preset}
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1 mt-2 text-xs text-red-700 font-bold">
                     <Settings2 className="h-3.5 w-3.5" /> URL Slug: /shop?category=kits/{kitSlug}
                  </div>
               </div>
               <div className="text-right self-end sm:self-auto shrink-0">
                  <p className="text-[11px] font-bold uppercase text-gray-500 mb-1">Precio Fijo del Combo</p>
                  <div className="flex items-center gap-1 justify-end">
                     <span className="font-black text-2xl text-slate-800">$</span>
                     <input 
                       type="text" 
                       value={kitPrice}
                       onChange={(e) => setKitPrice(e.target.value)}
                       className="text-2xl sm:text-3xl font-black text-red-700 outline-none text-right w-36 border-b-2 border-dashed border-red-300 focus:border-red-600 bg-transparent" 
                     />
                     <span className="text-xs font-bold text-gray-400">COP</span>
                  </div>
               </div>
            </div>

            <div className="flex-1 p-6 bg-slate-50/50 overflow-y-auto space-y-5">
               
               {/* Banner selection / upload */}
               <div className="bg-white p-4 rounded-2xl border border-gray-200">
                 <p className="text-xs font-bold uppercase text-slate-600 mb-2 flex items-center gap-1.5">
                   <ImageIcon className="h-4 w-4 text-amber-600" />
                   <span>Imagen del Banner (Selecciona un preset o sube personalizada)</span>
                 </p>
                 <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-3">
                   {PRESET_BANNERS.map((preset, idx) => (
                     <button
                       key={preset.url}
                       type="button"
                       onClick={() => handleSelectPresetBanner(preset.url)}
                       className={`relative aspect-[16/9] rounded-xl overflow-hidden border-2 text-left transition-all ${
                         bannerPreview === preset.url ? 'border-red-600 ring-2 ring-red-400/40' : 'border-gray-200 hover:border-gray-400'
                       }`}
                     >
                       <img src={preset.url} alt={preset.name} className="w-full h-full object-cover" />
                       <span className="absolute bottom-1 left-1 bg-black/70 text-white text-[10px] font-bold px-1.5 py-0.5 rounded">
                         Opción {idx + 1}
                       </span>
                     </button>
                   ))}
                 </div>

                 <label className="border border-dashed border-gray-300 rounded-xl p-3 flex items-center justify-center gap-2 text-xs font-bold text-gray-600 hover:border-red-600 hover:text-red-700 transition-colors cursor-pointer bg-slate-50">
                    <ImageIcon className="h-4 w-4" />
                    <span>O subir archivo personalizado desde el equipo (JPG/PNG)</span>
                    <input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleBannerChange} />
                 </label>
               </div>

               {/* Dropped items area */}
               <div className="space-y-3">
                 <div className="flex items-center justify-between">
                   <h4 className="text-xs font-bold uppercase text-slate-600">
                     Contenido del Kit ({kitItems.length} productos seleccionados)
                   </h4>
                   <span className="text-[11px] text-slate-400">Arrastra productos aquí</span>
                 </div>

                 {kitItems.length === 0 ? (
                   <div className="text-center py-16 bg-white rounded-2xl border-2 border-dashed border-gray-200">
                     <p className="text-gray-400 font-medium text-sm">Arrastra o haz click en productos del catálogo para armar este Kit Chévere.</p>
                   </div>
                 ) : (
                   kitItems.map(item => (
                     <div key={item.product.id} className="flex items-center gap-3 bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm relative group">
                        <GripVertical className="h-4 w-4 text-gray-300 cursor-grab" />
                        <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
                           {item.product.imageUrl ? (
                             <img src={item.product.imageUrl} alt={item.product.name} className="w-full h-full object-cover" />
                           ) : (
                             <span className="text-sm">📦</span>
                           )}
                        </div>
                        <div className="flex-1 min-w-0">
                           <p className="font-bold text-slate-800 text-xs truncate">{item.product.name}</p>
                           <p className="text-[10px] text-gray-500">Unitario: ${item.product.priceRetail.toLocaleString()} COP</p>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                           <input 
                             type="number" 
                             min="0.1"
                             step="0.1"
                             value={item.quantity} 
                             onChange={(e) => handleUpdateQuantity(item.product.id, e.target.value)}
                             className="w-16 border border-gray-200 rounded-lg p-1 text-center font-bold text-xs" 
                           /> 
                           <span className="text-xs text-gray-500 font-medium">{item.product.unit}</span>
                        </div>
                        <button 
                          onClick={() => handleRemoveItem(item.product.id)}
                          className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition-colors shrink-0"
                          title="Quitar del kit"
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
    </div>
  );
}
