'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Package, ArrowLeft, Save, Loader2, Image as ImageIcon } from 'lucide-react';
import Link from 'next/link';
import { createProduct } from '@/src/actions/products';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);
import { CATEGORIES } from '@/src/constants/productConstants';

export default function NewProductPage() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    category: CATEGORIES[0],
    unit: 'Kg',
    baseCost: 0,
    priceRetail: 0,
    priceMicro: 0,
    priceRestaurant: 0,
    stockQuantity: 100,
    isActive: true,
    isInSeason: true,
    imageUrl: '',
    description: ''
  });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let finalImageUrl = formData.imageUrl;
      
      if (imageFile) {
        const fileExt = imageFile.name.split('.').pop();
        const fileName = `product-${Date.now()}.${fileExt}`;
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(fileName, imageFile);
          
        if (error) {
          console.error("Error uploading image:", error);
          // Fallback to what we have if error
        } else if (data) {
          const { data: publicData } = supabase.storage.from('product-images').getPublicUrl(data.path);
          finalImageUrl = publicData.publicUrl;
        }
      }

      await createProduct({ ...formData, imageUrl: finalImageUrl });
      router.push('/admin/catalog/inventory');
      router.refresh();
    } catch (error) {
      console.error('Failed to create product:', error);
      alert('Error al crear el producto.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    const val = type === 'number' ? parseFloat(value) || 0 : (e.target as HTMLInputElement).checked ?? value;
    
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : val
    }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  return (
    <div className="p-8 max-w-[1000px] mx-auto space-y-8 animate-fade-in">
      <div className="flex items-center gap-4">
        <Link 
          href="/admin/catalog/inventory"
          className="p-2 hover:bg-slate-100 rounded-full transition-colors text-gray-500"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-black text-slate-800 font-serif">Registrar Nuevo Producto</h1>
          <p className="text-gray-500 font-medium">Añada un nuevo ítem al catálogo general de La Gaviota.</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column: Basic Info */}
        <div className="md:col-span-2 space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <Package className="h-5 w-5 text-[#4CAF50]" />
              Información Básica
            </h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Nombre del Producto</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Ej. Tomate Chonto Seleccionado"
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#4CAF50] focus:ring-1 focus:ring-[#4CAF50] outline-none transition-all font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Categoría</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#4CAF50] outline-none transition-all font-medium bg-white"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Unidad de Medida</label>
                  <input
                    type="text"
                    name="unit"
                    required
                    value={formData.unit}
                    onChange={handleChange}
                    placeholder="Ej. Kg, Unidad, Atado"
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#4CAF50] outline-none font-medium"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Descripción del Producto</label>
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Describa la frescura, origen o usos del producto..."
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#4CAF50] outline-none transition-all font-medium h-24 resize-none"
                />
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <span className="text-[#E30613]">$</span>
              Estructura de Precios (COP)
            </h2>
            
            <div className="grid grid-cols-2 gap-6">
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Costo de Compra (Base)</label>
                <input
                  type="number"
                  name="baseCost"
                  required
                  value={formData.baseCost}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#E30613] outline-none font-mono font-bold text-lg"
                />
              </div>
              <div className="col-span-2 md:col-span-1">
                <label className="block text-xs font-black text-[#E30613] uppercase tracking-widest mb-2">Precio Detal (Público)</label>
                <input
                  type="number"
                  name="priceRetail"
                  required
                  value={formData.priceRetail}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-red-100 bg-red-50/30 focus:border-[#E30613] outline-none font-mono font-bold text-lg text-[#E30613]"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-[#4CAF50] uppercase tracking-widest mb-2">Precio Micromercados</label>
                <input
                  type="number"
                  name="priceMicro"
                  required
                  value={formData.priceMicro}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-green-100 bg-green-50/30 focus:border-[#4CAF50] outline-none font-mono font-bold text-lg text-[#218524]"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-[#ca8a04] uppercase tracking-widest mb-2">Precio Restaurantes</label>
                <input
                  type="number"
                  name="priceRestaurant"
                  required
                  value={formData.priceRestaurant}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-yellow-100 bg-yellow-50/30 focus:border-[#ca8a04] outline-none font-mono font-bold text-lg text-[#a87405]"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Status & Media */}
        <div className="space-y-6">
          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-slate-800">Estado</h2>
            
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Stock Inicial</label>
                <input
                  type="number"
                  name="stockQuantity"
                  required
                  value={formData.stockQuantity}
                  onChange={handleChange}
                  className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none font-bold"
                />
              </div>

              <div className="flex flex-col gap-3 pt-2">
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="isActive"
                    checked={formData.isActive}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-gray-300 text-[#4CAF50] focus:ring-[#4CAF50]"
                  />
                  <span className="font-bold text-slate-700 text-sm">Producto Activo</span>
                </label>
                <label className="flex items-center gap-3 cursor-pointer group">
                  <input
                    type="checkbox"
                    name="isInSeason"
                    checked={formData.isInSeason}
                    onChange={handleChange}
                    className="w-5 h-5 rounded border-gray-300 text-[#4CAF50] focus:ring-[#4CAF50]"
                  />
                  <span className="font-bold text-slate-700 text-sm">En Temporada</span>
                </label>
              </div>
            </div>
          </div>

          <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm space-y-6">
            <h2 className="text-xl font-bold text-slate-800 flex items-center gap-2">
              <ImageIcon className="h-5 w-5 text-gray-400" />
              Imagen Principal
            </h2>
            <label className="aspect-square bg-slate-50 rounded-2xl border-2 border-dashed border-gray-300 flex flex-col items-center justify-center text-center p-4 cursor-pointer hover:border-[#4CAF50] transition-colors relative overflow-hidden group">
              {imagePreview ? (
                <img src={imagePreview} alt="Preview" className="absolute inset-0 w-full h-full object-cover" />
              ) : (
                <>
                  <ImageIcon className="h-8 w-8 mb-2 text-gray-400 group-hover:text-[#4CAF50]" />
                  <p className="text-xs font-bold text-gray-500 px-4 group-hover:text-[#4CAF50]">Haga clic para subir una imagen</p>
                  <p className="text-[10px] text-gray-400 mt-1">JPG o PNG (máx 2MB)</p>
                </>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
            </label>
            <input
              type="text"
              name="imageUrl"
              placeholder="O ingrese una URL externa..."
              value={formData.imageUrl}
              onChange={handleChange}
              className="w-full px-3 py-2 text-xs border border-gray-200 rounded-lg outline-none focus:border-[#4CAF50]"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-[#E30613] hover:bg-red-700 text-white h-16 rounded-2xl font-black text-xl shadow-[0_8px_20px_rgba(227,6,19,0.3)] hover:shadow-[0_12px_24px_rgba(227,6,19,0.4)] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
            {isSubmitting ? 'Guardando...' : 'Publicar Producto'}
          </button>
        </div>
      </form>
    </div>
  );
}
