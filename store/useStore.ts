'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
}

interface StoreState {
  cart: CartItem[];
  customer: {
    id?: string;
    name?: string;
    phone?: string;
  } | null;
  discount: number;
  paymentMethod: 'dinheiro' | 'pix' | 'cartao' | 'fiado';
  
  // Cart actions
  addToCart: (item: CartItem) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  
  // Customer actions
  setCustomer: (customer: any) => void;
  clearCustomer: () => void;
  
  // Sale actions
  setDiscount: (discount: number) => void;
  setPaymentMethod: (method: 'dinheiro' | 'pix' | 'cartao' | 'fiado') => void;
  
  // Getters
  getSubtotal: () => number;
  getTotal: () => number;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      cart: [],
      customer: null,
      discount: 0,
      paymentMethod: 'dinheiro',
      
      addToCart: (item) => {
        const existingItem = get().cart.find(cartItem => cartItem.id === item.id);
        
        if (existingItem) {
          set({
            cart: get().cart.map(cartItem =>
              cartItem.id === item.id
                ? { ...cartItem, quantity: Math.min(cartItem.quantity + 1, item.stock) }
                : cartItem
            ),
          });
        } else {
          set({
            cart: [...get().cart, { ...item, quantity: 1 }],
          });
        }
      },
      
      removeFromCart: (id) => {
        set({
          cart: get().cart.filter(item => item.id !== id),
        });
      },
      
      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeFromCart(id);
          return;
        }
        
        set({
          cart: get().cart.map(item =>
            item.id === id ? { ...item, quantity } : item
          ),
        });
      },
      
      clearCart: () => {
        set({
          cart: [],
          customer: null,
          discount: 0,
          paymentMethod: 'dinheiro',
        });
      },
      
      setCustomer: (customer) => {
        set({ customer });
      },
      
      clearCustomer: () => {
        set({ customer: null });
      },
      
      setDiscount: (discount) => {
        set({ discount });
      },
      
      setPaymentMethod: (method) => {
        set({ paymentMethod: method });
      },
      
      getSubtotal: () => {
        return get().cart.reduce((total, item) => total + item.price * item.quantity, 0);
      },
      
      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discount = get().discount;
        return subtotal - discount;
      },
    }),
    {
      name: 'jewelry-store',
    }
  )
);