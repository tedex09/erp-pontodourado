'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  stock: number;
  discount: number;
  discountType: 'percentage' | 'fixed';
  image?: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
  email?: string;
}

interface PaymentMethod {
  type: 'dinheiro' | 'pix' | 'pixQrCode' | 'debitoCard' | 'creditoCard' | 'fiado';
  amount: number;
  fee?: number;
  chargeAmount?: number;
}

interface PDVState {
  cart: CartItem[];
  customer: Customer | null;
  discount: number;
  discountType: 'percentage' | 'fixed';
  addition: number;
  additionType: 'percentage' | 'fixed';
  paymentMethods: PaymentMethod[];
  selectedCategory: string;
  
  // Cart actions
  addToCart: (item: Omit<CartItem, 'discount' | 'discountType'>) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  updateItemDiscount: (id: string, discount: number, discountType: 'percentage' | 'fixed') => void;
  clearCart: () => void;
  
  // Customer actions
  setCustomer: (customer: Customer | null) => void;
  
  // Discount and addition actions
  setDiscount: (discount: number, discountType: 'percentage' | 'fixed') => void;
  setAddition: (addition: number, additionType: 'percentage' | 'fixed') => void;
  
  // Payment actions
  setPaymentMethods: (methods: PaymentMethod[]) => void;
  addPaymentMethod: (method: PaymentMethod) => void;
  removePaymentMethod: (index: number) => void;
  
  // Filter actions
  setSelectedCategory: (category: string) => void;
  
  // Getters
  getSubtotal: () => number;
  getItemsTotal: () => number;
  getDiscountAmount: () => number;
  getAdditionAmount: () => number;
  getTotal: () => number;
  getTotalFees: () => number;
  getFinalAmount: () => number;
}

export const usePDVStore = create<PDVState>()(
  persist(
    (set, get) => ({
      cart: [],
      customer: null,
      discount: 0,
      discountType: 'fixed',
      addition: 0,
      additionType: 'fixed',
      paymentMethods: [],
      selectedCategory: '',
      
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
            cart: [...get().cart, { ...item, quantity: 1, discount: 0, discountType: 'fixed' }],
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
      
      updateItemDiscount: (id, discount, discountType) => {
        set({
          cart: get().cart.map(item =>
            item.id === id ? { ...item, discount, discountType } : item
          ),
        });
      },
      
      clearCart: () => {
        set({
          cart: [],
          customer: null,
          discount: 0,
          discountType: 'fixed',
          addition: 0,
          additionType: 'fixed',
          paymentMethods: [],
        });
      },
      
      setCustomer: (customer) => {
        set({ customer });
      },
      
      setDiscount: (discount, discountType) => {
        set({ discount, discountType });
      },
      
      setAddition: (addition, additionType) => {
        set({ addition, additionType });
      },
      
      setPaymentMethods: (methods) => {
        set({ paymentMethods: methods });
      },
      
      addPaymentMethod: (method) => {
        set({ paymentMethods: [...get().paymentMethods, method] });
      },
      
      removePaymentMethod: (index) => {
        set({
          paymentMethods: get().paymentMethods.filter((_, i) => i !== index)
        });
      },
      
      setSelectedCategory: (category) => {
        set({ selectedCategory: category });
      },
      
      getItemsTotal: () => {
        return get().cart.reduce((total, item) => {
          const itemTotal = item.price * item.quantity;
          let itemDiscount = 0;
          
          if (item.discountType === 'percentage') {
            itemDiscount = (itemTotal * item.discount) / 100;
          } else {
            itemDiscount = item.discount;
          }
          
          return total + (itemTotal - itemDiscount);
        }, 0);
      },
      
      getSubtotal: () => {
        return get().getItemsTotal();
      },
      
      getDiscountAmount: () => {
        const subtotal = get().getSubtotal();
        if (get().discountType === 'percentage') {
          return (subtotal * get().discount) / 100;
        }
        return get().discount;
      },
      
      getAdditionAmount: () => {
        const subtotal = get().getSubtotal();
        if (get().additionType === 'percentage') {
          return (subtotal * get().addition) / 100;
        }
        return get().addition;
      },
      
      getTotal: () => {
        const subtotal = get().getSubtotal();
        const discountAmount = get().getDiscountAmount();
        const additionAmount = get().getAdditionAmount();
        return subtotal - discountAmount + additionAmount;
      },
      
      getTotalFees: () => {
        return get().paymentMethods.reduce((total, method) => {
          return total + (method.fee || 0);
        }, 0);
      },
      
      getFinalAmount: () => {
        const total = get().getTotal();
        const fees = get().getTotalFees();
        return total + fees;
      },
    }),
    {
      name: 'pdv-store',
    }
  )
);