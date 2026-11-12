'use client';

import React, { useMemo, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import type { Product } from '@/src/actions/products';
import { createBuyingTemplate, deleteBuyingTemplate } from '@/src/actions/b2b';
import { useCart } from '@/src/contexts/CartContext';

export interface BuyingTemplateItem {
  product_id?: string;
  quantity?: number;
  product?: Product;
}

export interface BuyingTemplate {
  id: string;
  template_name: string;
  product_list?: BuyingTemplateItem[] | unknown;
}

interface B2BTemplatesSectionProps {
  initialTemplates: BuyingTemplate[];
  allProducts: Product[];
  accent?: 'yellow' | 'blue';
}

export function B2BTemplatesSection({
  initialTemplates,
  allProducts,
  accent = 'blue',
}: B2BTemplatesSectionProps) {
  const { items: cartItems, addToCart } = useCart();
  const router = useRouter();
  const [templates, setTemplates] = useState<BuyingTemplate[]>(initialTemplates);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [templateName, setTemplateName] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error' | 'warning'; text: string; showCartLink?: boolean } | null>(null);

  const catalogById = useMemo(
    () => new Map(allProducts.map((p) => [p.id, p])),
    [allProducts]
  );

  const buttonTheme =
    accent === 'yellow'
      ? 'bg-yellow-50 text-yellow-800 hover:bg-yellow-100 border border-yellow-200'
      : 'bg-blue-50 text-blue-800 hover:bg-blue-100 border border-blue-200';

  const hoverBorder = accent === 'yellow' ? 'hover:border-yellow-400' : 'hover:border-blue-400';

  const handleSaveFromCart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSaving || cartItems.length === 0) return;
    setIsSaving(true);
    setFeedback(null);

    try {
      const payloadItems = cartItems.map((i) => ({
        product_id: i.product.id,
        quantity: i.quantity,
      }));
      const res = await createBuyingTemplate(templateName, payloadItems);
      if (!res.ok) {
        setFeedback({ type: 'error', text: res.error });
        return;
      }
      setTemplates((prev) => [res.template as BuyingTemplate, ...prev]);
      setTemplateName('');
      setShowCreateForm(false);
      setFeedback({
        type: 'success',
        text: `Plantilla "${res.template.template_name}" guardada con ${payloadItems.length} producto(s).`,
      });
      router.refresh();
    } catch {
      setFeedback({ type: 'error', text: 'Error inesperado guardando la plantilla.' });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTemplateToCart = (tpl: BuyingTemplate) => {
    const rawList = Array.isArray(tpl.product_list) ? (tpl.product_list as BuyingTemplateItem[]) : [];
    if (rawList.length === 0) {
      setFeedback({ type: 'warning', text: `La plantilla "${tpl.template_name}" no tiene productos configurados.` });
      return;
    }

    let addedCount = 0;
    let skippedCount = 0;

    for (const entry of rawList) {
      const qty = Number(entry?.quantity) || 0;
      if (qty <= 0) continue;

      const pid = entry.product_id || entry.product?.id;
      const liveProduct = pid ? catalogById.get(pid) : undefined;
      const fallbackProduct =
        !liveProduct && entry.product && entry.product.isActive && entry.product.price > 0
          ? entry.product
          : undefined;
      const resolved = liveProduct || fallbackProduct;

      if (resolved) {
        addToCart(resolved, qty);
        addedCount++;
      } else {
        skippedCount++;
      }
    }

    if (addedCount === 0) {
      setFeedback({
        type: 'error',
        text: `Ninguno de los productos de "${tpl.template_name}" está activo en este momento.`,
      });
      return;
    }

    if (skippedCount > 0) {
      setFeedback({
        type: 'warning',
        text: `Se añadieron ${addedCount} producto(s) con tarifa vigente. ${skippedCount} producto(s) ya no están disponibles.`,
        showCartLink: true,
      });
      return;
    }

    router.push('/cart');
  };

  const handleDeleteTemplate = async (tpl: BuyingTemplate) => {
    if (deletingId) return;
    setDeletingId(tpl.id);
    setFeedback(null);

    try {
      const res = await deleteBuyingTemplate(tpl.id);
      if (!res.ok) {
        setFeedback({ type: 'error', text: res.error });
        return;
      }
      setTemplates((prev) => prev.filter((item) => item.id !== tpl.id));
      setFeedback({ type: 'success', text: `Plantilla "${tpl.template_name}" eliminada.` });
      router.refresh();
    } catch {
      setFeedback({ type: 'error', text: 'No se pudo eliminar la plantilla.' });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <section className="mb-12">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-xl font-black text-slate-800 font-serif">Mis Recetas / Plantillas de Compra</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Guarda listas recurrentes desde tu carrito y vuelve a pedir en 1 clic con precios actualizados.
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setShowCreateForm((prev) => !prev);
            setFeedback(null);
          }}
          className="rounded-xl bg-slate-900 px-4 py-2.5 text-xs font-black text-white shadow-sm hover:bg-slate-800 transition-colors"
        >
          {showCreateForm ? 'Cancelar' : `+ Guardar carrito como plantilla (${cartItems.length})`}
        </button>
      </div>

      {feedback && (
        <div
          role={feedback.type === 'error' ? 'alert' : 'status'}
          className={`mb-5 flex flex-wrap items-center justify-between gap-3 rounded-xl border px-4 py-3 text-sm font-semibold ${
            feedback.type === 'error'
              ? 'border-red-200 bg-red-50 text-red-800'
              : feedback.type === 'warning'
                ? 'border-amber-200 bg-amber-50 text-amber-900'
                : 'border-emerald-200 bg-emerald-50 text-emerald-800'
          }`}
        >
          <span>{feedback.text}</span>
          {feedback.showCartLink && (
            <Link href="/cart" className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-black text-white">
              Ir al carrito →
            </Link>
          )}
        </div>
      )}

      {showCreateForm && (
        <form
          onSubmit={handleSaveFromCart}
          className="mb-6 rounded-2xl border border-slate-200 bg-slate-50 p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-end"
        >
          <div className="flex-1">
            <label htmlFor="b2b-template-name" className="block text-xs font-bold text-slate-700 mb-1">
              Nombre de la plantilla semanal
            </label>
            <input
              id="b2b-template-name"
              type="text"
              required
              minLength={2}
              maxLength={80}
              value={templateName}
              onChange={(e) => setTemplateName(e.target.value)}
              placeholder="Ej. Mercado Lunes Cocina / Reposición Fin de Semana"
              className="w-full rounded-xl border border-gray-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-900"
            />
          </div>
          {cartItems.length === 0 ? (
            <Link
              href="/"
              className="rounded-xl bg-[#4CAF50] px-4 py-2.5 text-center text-xs font-black text-white hover:bg-green-700"
            >
              Tu carrito está vacío · Ir al catálogo
            </Link>
          ) : (
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-[#4CAF50] px-5 py-2.5 text-xs font-black text-white hover:bg-green-700 disabled:opacity-50"
            >
              {isSaving ? 'Guardando...' : `Guardar ${cartItems.length} ítem(s)`}
            </button>
          )}
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {templates.length === 0 ? (
          <div className="col-span-full rounded-2xl border border-dashed border-gray-300 bg-white p-6 text-center text-sm text-slate-600">
            Aún no tienes plantillas guardadas. Arma tu pedido en el catálogo y usa el botón{' '}
            <strong>&quot;Guardar carrito como plantilla&quot;</strong> para automatizar tu próxima compra.
          </div>
        ) : (
          templates.map((tpl) => {
            const list = Array.isArray(tpl.product_list) ? (tpl.product_list as BuyingTemplateItem[]) : [];
            const previewNames = list
              .slice(0, 3)
              .map((entry) => {
                const pid = entry.product_id || entry.product?.id;
                return (pid ? catalogById.get(pid)?.name : undefined) || entry.product?.name;
              })
              .filter(Boolean)
              .join(', ');

            return (
              <div
                key={tpl.id}
                className={`border border-gray-200 rounded-2xl p-5 bg-white flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${hoverBorder} transition-colors shadow-sm`}
              >
                <div className="min-w-0">
                  <h3 className="font-bold text-slate-800 text-lg truncate">{tpl.template_name}</h3>
                  <p className="text-xs font-semibold text-slate-500 mt-0.5">
                    {list.length} {list.length === 1 ? 'producto' : 'productos'}
                    {previewNames ? ` · ${previewNames}${list.length > 3 ? '…' : ''}` : ''}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => handleAddTemplateToCart(tpl)}
                    className={`${buttonTheme} font-bold px-4 py-2 rounded-xl text-xs transition-colors`}
                  >
                    Añadir al carrito
                  </button>
                  <button
                    type="button"
                    disabled={deletingId === tpl.id}
                    onClick={() => handleDeleteTemplate(tpl)}
                    aria-label={`Eliminar plantilla ${tpl.template_name}`}
                    className="rounded-xl border border-gray-200 px-3 py-2 text-xs font-bold text-gray-500 hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-50"
                  >
                    {deletingId === tpl.id ? '…' : 'Eliminar'}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

