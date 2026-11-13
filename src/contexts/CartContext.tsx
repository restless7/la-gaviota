'use client';

import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { Product, fetchProducts } from '@/src/actions/products';
import { parseCartDraft, reconcileCartDraft } from '@/src/lib/cartPersistence';
import { useUserRole } from './UserRoleContext';

export interface CartItem {
  product: Product;
  quantity: number;
  addedAt: number;
}

export interface LaunchDiscountInfo {
  hasDiscount: boolean;
  discountAmount: number;
  discountPercent: number;
  discountLabel: string;
  badge: string;
  finalCartTotal: number;
  nextTier: {
    needed: number;
    nextPercent: number;
    nextMinSubtotal: number;
  } | null;
  campaignName: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number | ((current: number) => number)) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  cartRestoreError: string | null;
  cartReady: boolean;
  cartTotal: number;
  itemCount: number;
  freeShippingThreshold: number;
  remainingForFreeShipping: number;
  progressPercent: number;
  discountInfo: LaunchDiscountInfo;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const [cartRestoreError, setCartRestoreError] = useState<string | null>(null);
  const { role, isSignedIn } = useUserRole();

  useEffect(() => {
    let cancelled = false;
    async function restore() {
      await Promise.resolve();
      if (cancelled) return;
      setIsInitialized(false);
      try {
        const saved = localStorage.getItem('gaviota_cart');
        if (!saved) { if (!cancelled) { setCartRestoreError(null); setIsInitialized(true); } return; }
        const draft = parseCartDraft(saved);
        // Strip legacy costs/prices before fetching; never overwrite this draft on failure.
        localStorage.setItem('gaviota_cart', JSON.stringify(draft));
        const catalog = await fetchProducts();
        if (cancelled) return;
        const restored = reconcileCartDraft(draft, catalog, Date.now());
        setItems(restored.items);
        if (restored.rejected.length) { setCartRestoreError('Hay productos que requieren revisión. Tu selección se conserva; actualiza para reintentar.'); return; }
        setCartRestoreError(null);
        setIsInitialized(true);
      } catch {
        if (!cancelled) setCartRestoreError('No pudimos verificar tu carrito. Tu selección se conserva; actualiza para reintentar.');
      }
    }
    void restore();
    return () => { cancelled = true; };
  }, [role]);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('gaviota_cart', JSON.stringify({ version: 2, items: items.map(item => ({ id: item.product.id, quantity: item.quantity })) }));
      
      // Debounce Sync with Abandoned Cart Backend for authenticated users only
      if (!isSignedIn || items.length === 0) return;

      const handler = setTimeout(() => {
        const cartTotal = items.reduce((total, item) => {
          const activePrice = role === 'Restaurantes' 
            ? item.product.price
            : role === 'Micromercados' 
              ? item.product.price
              : item.product.price;
          return total + (activePrice * item.quantity);
        }, 0);

        fetch('/api/marketing/abandoned-cart/sync', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items,
            cartTotal,
            isCompleted: false
          })
        }).catch(err => console.warn('Failed to sync cart', err));
      }, 600);

      return () => clearTimeout(handler);
    }
  }, [items, isInitialized, role, isSignedIn]);

  const addToCart = (product: Product, quantity = 1) => {
    if (!isInitialized || cartRestoreError || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 1000000 || !product.isActive) return;
    setItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, product, quantity: Math.min(1000000, item.quantity + quantity) }
            : item
        );
      }
      return [...prev, { product, quantity, addedAt: Date.now() }];
    });
  };

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number | ((current: number) => number)) => {
    if (!isInitialized || cartRestoreError) return;
    setItems(prev => prev.flatMap(item => {
      if (item.product.id !== productId) return [item];
      const next = typeof quantity === 'function' ? quantity(item.quantity) : quantity;
      if (!Number.isSafeInteger(next) || next > 1000000) return [item];
      return next <= 0 ? [] : [{ ...item, quantity: next }];
    }));
  };

  const clearCart = () => {
    setItems([]);
    setCartRestoreError(null);
    setIsInitialized(true);
  };

  // Calculate totals relying on UserRole dynamic pricing
  const cartTotal = items.reduce((total, item) => {
    const activePrice = role === 'Restaurantes' 
      ? item.product.price
      : role === 'Micromercados' 
        ? item.product.price
        : item.product.price;
    return total + (activePrice * item.quantity);
  }, 0);

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  // Phase 5: Free shipping metrics
  const freeShippingThreshold = 50000;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - cartTotal);
  const progressPercent = Math.min(100, (cartTotal / freeShippingThreshold) * 100);

  // Time-frame sensitive tiered Launch Discount Calculation (15%, 25%, 35%)
  const discountInfo = useMemo<LaunchDiscountInfo>(() => {
    if (role === 'Restaurantes' || role === 'Micromercados') {
      return {
        hasDiscount: false,
        discountAmount: 0,
        discountPercent: 0,
        discountLabel: '',
        badge: '',
        finalCartTotal: cartTotal,
        nextTier: null,
        campaignName: '',
      };
    }

    if (cartTotal >= 300000) {
      const discountAmount = Math.round(cartTotal * 0.35);
      return {
        hasDiscount: true,
        discountAmount,
        discountPercent: 35,
        discountLabel: '35% Descuento Gran Lanzamiento',
        badge: '35% OFF',
        finalCartTotal: Math.max(0, cartTotal - discountAmount),
        nextTier: null,
        campaignName: '¡Gran Lanzamiento Web!',
      };
    } else if (cartTotal >= 200000) {
      const discountAmount = Math.round(cartTotal * 0.25);
      return {
        hasDiscount: true,
        discountAmount,
        discountPercent: 25,
        discountLabel: '25% Descuento Gran Lanzamiento',
        badge: '25% OFF',
        finalCartTotal: Math.max(0, cartTotal - discountAmount),
        nextTier: {
          needed: 300000 - cartTotal,
          nextPercent: 35,
          nextMinSubtotal: 300000,
        },
        campaignName: '¡Gran Lanzamiento Web!',
      };
    } else if (cartTotal >= 100000) {
      const discountAmount = Math.round(cartTotal * 0.15);
      return {
        hasDiscount: true,
        discountAmount,
        discountPercent: 15,
        discountLabel: '15% Descuento Gran Lanzamiento',
        badge: '15% OFF',
        finalCartTotal: Math.max(0, cartTotal - discountAmount),
        nextTier: {
          needed: 200000 - cartTotal,
          nextPercent: 25,
          nextMinSubtotal: 200000,
        },
        campaignName: '¡Gran Lanzamiento Web!',
      };
    } else {
      return {
        hasDiscount: false,
        discountAmount: 0,
        discountPercent: 0,
        discountLabel: '',
        badge: '',
        finalCartTotal: cartTotal,
        nextTier: {
          needed: 100000 - cartTotal,
          nextPercent: 15,
          nextMinSubtotal: 100000,
        },
        campaignName: '¡Gran Lanzamiento Web!',
      };
    }
  }, [cartTotal, role]);

  return (
    <CartContext.Provider value={{
      items, addToCart, removeFromCart, updateQuantity, clearCart,
      isCartOpen, setIsCartOpen, cartRestoreError, cartReady: isInitialized && !cartRestoreError, cartTotal, itemCount,
      freeShippingThreshold, remainingForFreeShipping, progressPercent,
      discountInfo
    }}>
      {cartRestoreError && <div role="alert" className="p-4 bg-amber-50 text-amber-900"><p>{cartRestoreError}</p><button type="button" onClick={clearCart} className="mt-2 min-h-11 rounded-lg border border-amber-700 px-3 text-sm font-bold">Vaciar carrito y empezar de nuevo</button></div>}
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
