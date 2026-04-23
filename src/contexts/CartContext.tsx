'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import { Product } from '@/src/data/products';
import { useUserRole } from './UserRoleContext';

export interface CartItem {
  product: Product;
  quantity: number;
  addedAt: number;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (product: Product, quantity?: number) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  isCartOpen: boolean;
  setIsCartOpen: (isOpen: boolean) => void;
  cartTotal: number;
  itemCount: number;
  freeShippingThreshold: number;
  remainingForFreeShipping: number;
  progressPercent: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);
  const { role } = useUserRole();

  useEffect(() => {
    // Load from local storage
    const saved = localStorage.getItem('gaviota_cart');
    if (saved) {
      try {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setItems(JSON.parse(saved));
      } catch (e) {
        console.error('Failed to parse cart');
      }
    }
    setIsInitialized(true);
  }, []);

  useEffect(() => {
    if (isInitialized) {
      localStorage.setItem('gaviota_cart', JSON.stringify(items));
    }
  }, [items, isInitialized]);

  const addToCart = (product: Product, quantity = 1) => {
    setItems(prev => {
      const existing = prev.find(item => item.product.id === product.id);
      if (existing) {
        return prev.map(item => 
          item.product.id === product.id 
            ? { ...item, quantity: item.quantity + quantity } 
            : item
        );
      }
      return [...prev, { product, quantity, addedAt: Date.now() }];
    });
    setIsCartOpen(true);
  };

  const removeFromCart = (productId: string) => {
    setItems(prev => prev.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, quantity: number) => {
    if (quantity < 1) return;
    setItems(prev => prev.map(item => 
      item.product.id === productId ? { ...item, quantity } : item
    ));
  };

  const clearCart = () => setItems([]);

  // Calculate totals relying on UserRole dynamic pricing
  const cartTotal = items.reduce((total, item) => {
    const activePrice = role === 'Restaurantes' 
      ? item.product.priceRestaurant 
      : role === 'Micromercados' 
        ? item.product.priceMicro 
        : item.product.priceRetail;
    return total + (activePrice * item.quantity);
  }, 0);

  const itemCount = items.reduce((total, item) => total + item.quantity, 0);

  // Phase 5: Free shipping metrics
  const freeShippingThreshold = 150000;
  const remainingForFreeShipping = Math.max(0, freeShippingThreshold - cartTotal);
  const progressPercent = Math.min(100, (cartTotal / freeShippingThreshold) * 100);

  return (
    <CartContext.Provider value={{
      items, addToCart, removeFromCart, updateQuantity, clearCart,
      isCartOpen, setIsCartOpen, cartTotal, itemCount,
      freeShippingThreshold, remainingForFreeShipping, progressPercent
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within a CartProvider');
  return context;
}
