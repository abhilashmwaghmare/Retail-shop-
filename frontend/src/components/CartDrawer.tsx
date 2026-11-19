/**
 * Shopping Cart Drawer & Checkout Flow
 */

import React, { useState } from 'react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { placeOrder } from '../services/api';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOrderSuccess: (orderNumber: string) => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ isOpen, onClose, onOrderSuccess }) => {
  const { items, removeFromCart, updateQuantity, clearCart, totalAmount, totalItems } = useCart();
  const { user } = useAuth();

  const [customerEmail, setCustomerEmail] = useState(user?.email || '');
  const [shippingAddress, setShippingAddress] = useState('100 DevOps Blvd, Suite 400, Austin, TX');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    const emailToUse = user?.email || customerEmail.trim();

    if (!emailToUse) {
      setErrorMsg('Please enter a valid email address for order notifications.');
      return;
    }

    if (items.length === 0) {
      setErrorMsg('Your shopping cart is empty.');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderPayload = {
        customerEmail: emailToUse,
        shippingAddress: shippingAddress.trim() || 'Standard Delivery',
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
      };

      const res = await placeOrder(orderPayload);
      if (res.success && res.data) {
        clearCart();
        onClose();
        onOrderSuccess(res.data.order_number);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Checkout failed. Please verify inventory.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-900/50 backdrop-blur-sm flex justify-end">
      <div className="w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between">
        {/* Drawer Header */}
        <div className="p-4 border-b border-slate-200 flex items-center justify-between">
          <h2 className="font-bold text-lg text-slate-900 flex items-center gap-2">
            <span>🛒</span> Shopping Cart ({totalItems})
          </h2>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-500"
          >
            ✕
          </button>
        </div>

        {/* Cart Item List */}
        <div className="flex-1 overflow-y-auto p-4 divide-y divide-slate-100">
          {items.length === 0 ? (
            <div className="py-16 text-center text-slate-400">
              <span className="text-4xl block mb-2">🛍️</span>
              <p>Your cart is empty.</p>
            </div>
          ) : (
            items.map((item) => (
              <div key={item.product.id} className="py-3 flex items-center gap-3">
                <img
                  src={item.product.image_url}
                  alt={item.product.name}
                  className="w-14 h-14 rounded-lg object-cover bg-slate-100 flex-shrink-0"
                  onError={(e) => {
                    (e.target as HTMLImageElement).src =
                      'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600';
                  }}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-semibold text-slate-900 truncate">{item.product.name}</h4>
                  <div className="text-xs text-slate-500">${Number(item.product.price).toFixed(2)} each</div>
                  <div className="flex items-center gap-2 mt-1">
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                      className="w-5 h-5 rounded border border-slate-300 flex items-center justify-center text-xs hover:bg-slate-100"
                    >
                      -
                    </button>
                    <span className="text-xs font-semibold">{item.quantity}</span>
                    <button
                      onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                      className="w-5 h-5 rounded border border-slate-300 flex items-center justify-center text-xs hover:bg-slate-100"
                    >
                      +
                    </button>
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-sm text-slate-900">
                    ${(Number(item.product.price) * item.quantity).toFixed(2)}
                  </div>
                  <button
                    onClick={() => removeFromCart(item.product.id)}
                    className="text-xs text-rose-500 hover:underline mt-1"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Drawer Footer & Checkout Form */}
        {items.length > 0 && (
          <div className="p-4 bg-slate-50 border-t border-slate-200">
            <div className="flex justify-between items-center text-base font-bold text-slate-900 mb-3">
              <span>Order Subtotal:</span>
              <span className="text-blue-600 text-lg">${totalAmount.toFixed(2)}</span>
            </div>

            {errorMsg && (
              <div className="mb-3 p-2.5 rounded bg-rose-50 text-rose-700 text-xs border border-rose-200">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleCheckout} className="space-y-2">
              {!user && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">
                    Email for Order Confirmation:
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="student@retailcorp.io"
                    value={customerEmail}
                    onChange={(e) => setCustomerEmail(e.target.value)}
                    className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Shipping Address:</label>
                <input
                  type="text"
                  required
                  placeholder="Street, City, State, ZIP"
                  value={shippingAddress}
                  onChange={(e) => setShippingAddress(e.target.value)}
                  className="w-full text-xs p-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm transition shadow"
              >
                {isSubmitting ? 'Processing Transaction...' : `Complete Checkout ($${totalAmount.toFixed(2)})`}
              </button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};
