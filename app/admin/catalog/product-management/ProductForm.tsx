'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Package, ArrowLeft, Save, Loader2, Image as ImageIcon, Trash2 } from 'lucide-react';
import Link from 'next/link';
import { createProduct, updateProduct, deleteProduct, Product } from '@/src/actions/products';
import { createClient } from '@supabase/supabase-js';
import { CATEGORIES, SUBCATEGORIES } from '@/src/constants/productConstants';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

interface ProductFormProps {
  initialData?: Product;
}

export default function ProductForm({ initialData }: ProductFormProps) {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const isEditing = !!initialData;
  
  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    category: initialData?.category || CATEGORIES[0],
    subcategory: initialData?.subcategory || '',
    unit: initialData?.unit || 'Kg',
    baseCost: initialData?.baseCost || 0,
    priceRetail: initialData?.priceRetail || 0,
    priceMicro: initialData?.priceMicro || 0,
    priceRestaurant: initialData?.priceRestaurant || 0,
    stockQuantity: initialData?.stockQuantity || 100,
    isActive: initialData?.isActive ?? true,
    isInSeason: initialData?.isInSeason ?? true,
    imageUrl: initialData?.imageUrl || '',
    description: initialData?.description || ''
  });

  const availableSubcategories = SUBCATEGORIES[formData.category] || [];

  // Reset subcategory if category changes and the new category doesn't have the current subcategory
  useEffect(() => {
    if (availableSubcategories.length > 0 && !availableSubcategories.includes(formData.subcategory)) {
      setFormData(prev => ({ ...prev, subcategory: availableSubcategories[0] }));
    } else if (availableSubcategories.length === 0) {
      setFormData(prev => ({ ...prev, subcategory: '' }));
    }
  }, [formData.category, availableSubcategories]);

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(initialData?.imageUrl || null);
  const [isUploading, setIsUploading] = useState(false);

  const slugify = (text: string) => {
    return text.toString().toLowerCase()
      .replace(/\s+/g, '-')
      .replace(/[^\w\-]+/g, '')
      .replace(/\-\-+/g, '-')
      .replace(/^-+/, '')
      .replace(/-+$/, '');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let finalImageUrl = formData.imageUrl;
      
      if (imageFile) {
        setIsUploading(true);
        const fileExt = imageFile.name.split('.').pop();
        const slugName = slugify(formData.name) || 'product';
        const fileName = `${slugName}-${Date.now()}.${fileExt}`;
        
        const { data, error } = await supabase.storage
          .from('product-images')
          .upload(fileName, imageFile, { upsert: true });
          
        if (error) {
          console.error("Error uploading image:", error);
          alert('Error al subir la imagen.');
        } else if (data) {
          const { data: publicData } = supabase.storage.from('product-images').getPublicUrl(data.path);
          finalImageUrl = publicData.publicUrl;
        }
        setIsUploading(false);
      }

      const productPayload = { ...formData, imageUrl: finalImageUrl };

      if (isEditing) {
        await updateProduct(initialData.id, productPayload);
      } else {
        await createProduct(productPayload);
      }

      router.push('/admin/catalog/product-management');
      router.refresh();
    } catch (error) {
      console.error('Failed to save product:', error);
      alert('Error al guardar el producto.');
    } finally {
      setIsSubmitting(false);
      setIsUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!isEditing) return;
    
    if (window.confirm('¿Estás seguro de que deseas eliminar este producto? Esta acción no se puede deshacer y eliminará la imagen asociada.')) {
      setIsDeleting(true);
      try {
        await deleteProduct(initialData.id);
        router.push('/admin/catalog/product-management');
        router.refresh();
      } catch (error) {
        console.error('Failed to delete product:', error);
        alert('Error al eliminar el producto.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    setFormData(prev => {
      let newValue: any = value;
      if (type === 'number') {
        newValue = parseFloat(value) || 0;
      } else if (type === 'checkbox') {
        newValue = (e.target as HTMLInputElement).checked;
      }
      
      return {
        ...prev,
        [name]: newValue
      };
    });
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
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <a 
            href="/admin/catalog/product-management"
            className="p-2 hover:bg-slate-200 rounded-full transition-colors text-gray-600 bg-white shadow-sm border border-gray-200 block"
          >
            <ArrowLeft className="h-6 w-6" />
          </a>
          <div>
            <h1 className="text-3xl font-black text-slate-800 font-serif">
              {isEditing ? 'Editar Producto' : 'Registrar Nuevo Producto'}
            </h1>
            <p className="text-gray-500 font-medium">
              {isEditing ? `Modificando: ${initialData.name}` : 'Añada un nuevo ítem al catálogo general de La Gaviota.'}
            </p>
          </div>
        </div>
        {isEditing && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={isDeleting}
            className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-600 hover:bg-red-100 rounded-lg font-bold transition-colors"
          >
            {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
            Eliminar Producto
          </button>
        )}
      </div>

      <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-3 gap-8">
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
                {availableSubcategories.length > 0 && (
                  <div>
                    <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-2">Subcategoría</label>
                    <select
                      name="subcategory"
                      value={formData.subcategory}
                      onChange={handleChange}
                      className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#4CAF50] outline-none transition-all font-medium bg-white"
                    >
                      {availableSubcategories.map(sub => (
                        <option key={sub} value={sub}>{sub}</option>
                      ))}
                    </select>
                  </div>
                )}
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
              {isUploading && (
                <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex flex-col items-center justify-center">
                  <Loader2 className="h-8 w-8 text-[#4CAF50] animate-spin mb-2" />
                  <span className="text-sm font-bold text-[#4CAF50]">Subiendo...</span>
                </div>
              )}
              <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} disabled={isUploading} />
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
            disabled={isSubmitting || isUploading}
            className="w-full bg-[#E30613] hover:bg-red-700 text-white h-16 rounded-2xl font-black text-xl shadow-[0_8px_20px_rgba(227,6,19,0.3)] hover:shadow-[0_12px_24px_rgba(227,6,19,0.4)] transition-all flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="h-6 w-6 animate-spin" /> : <Save className="h-6 w-6" />}
            {isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar Producto' : 'Publicar Producto')}
          </button>
        </div>
      </form>
    </div>
  );
}
