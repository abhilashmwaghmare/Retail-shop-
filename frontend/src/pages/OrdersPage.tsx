/**
 * User Order History Page
 */

import React, { useState, useEffect } from 'react';
import { Order } from '../types';
import { fetchMyOrders } from '../services/api';

export const OrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await fetchMyOrders();
        if (res.success) {
          setOrders(res.data || []);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to retrieve order history');
      } finally {
        setIsLoading(false);
      }
    }
    loadOrders();
  }, []);

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-6 flex items-center gap-2">
        <span>📦</span> Your Order History
      </h1>

      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          {errorMsg}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white p-6 rounded-xl border border-slate-200 animate-pulse h-28" />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white p-12 text-center rounded-2xl border border-slate-200">
          <span className="text-4xl block mb-2">🛒</span>
          <h3 className="font-bold text-slate-800">No orders placed yet</h3>
          <p className="text-sm text-slate-500 mt-1">Browse our product catalog to place your first order.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((o) => (
            <div key={o.id} className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-3">
                  <span className="font-bold text-slate-900 font-mono text-sm">{o.order_number}</span>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold bg-blue-50 text-blue-700 border border-blue-200">
                    {o.status}
                  </span>
                </div>
                <div className="text-xs text-slate-500 mt-1">
                  Placed on {new Date(o.created_at).toLocaleDateString()} at {new Date(o.created_at).toLocaleTimeString()}
                </div>
                <div className="text-xs text-slate-600 mt-1">
                  Ship to: <span className="font-medium text-slate-700">{o.shipping_address}</span>
                </div>
              </div>

              <div className="text-right">
                <div className="text-xl font-bold text-slate-900">
                  ${Number(o.total_amount).toFixed(2)}
                </div>
                <div className="text-xs text-emerald-600 font-medium">Payment Verified</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
