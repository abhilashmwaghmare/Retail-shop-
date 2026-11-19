/**
 * Admin Operations & Inventory Dashboard
 */

import React, { useState, useEffect } from 'react';
import { Product, Order, DashboardMetrics } from '../types';
import { fetchAdminDashboard, createProduct, deleteProduct } from '../services/api';

export const AdminDashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [lowStock, setLowStock] = useState<Product[]>([]);
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);

  // New product form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Hardware');
  const [price, setPrice] = useState('99.99');
  const [stock, setStock] = useState('50');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [msg, setMsg] = useState('');

  async function loadData() {
    setIsLoading(true);
    try {
      const res = await fetchAdminDashboard();
      if (res.success && res.data) {
        setMetrics(res.data.metrics);
        setLowStock(res.data.lowStockProducts);
        setRecentOrders(res.data.recentOrders);
      }
    } catch (e: any) {
      setMsg(`Error: ${e.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createProduct({
        name,
        category,
        price: parseFloat(price),
        stock_quantity: parseInt(stock, 10),
        description,
        image_url: imageUrl || 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600'
      });
      setShowAddModal(false);
      setName('');
      setDescription('');
      setMsg('Product created successfully!');
      loadData();
    } catch (e: any) {
      alert(`Error creating product: ${e.message}`);
    }
  };

  const handleDeleteProduct = async (id: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteProduct(id);
      loadData();
    } catch (e: any) {
      alert(`Failed to delete: ${e.message}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
            <span>⚙️</span> Enterprise Operations & Inventory Dashboard
          </h1>
          <p className="text-xs text-slate-500 mt-1">Real-time telemetry, order fulfillment, and catalog management.</p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-4 py-2 rounded-lg text-sm transition shadow"
        >
          + Add New Product
        </button>
      </div>

      {msg && (
        <div className="mb-6 p-3 rounded-lg bg-emerald-50 text-emerald-800 text-xs border border-emerald-200">
          {msg}
        </div>
      )}

      {/* KPI Cards */}
      {metrics && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium">Total Revenue</span>
            <div className="text-2xl font-extrabold text-slate-900 mt-1">${metrics.totalRevenue}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium">Total Orders</span>
            <div className="text-2xl font-extrabold text-blue-600 mt-1">{metrics.totalOrders}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium">Active Products</span>
            <div className="text-2xl font-extrabold text-emerald-600 mt-1">{metrics.totalProducts}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium">Registered Users</span>
            <div className="text-2xl font-extrabold text-purple-600 mt-1">{metrics.totalUsers}</div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
            <span className="text-xs text-slate-500 font-medium">Low Stock Alerts</span>
            <div className="text-2xl font-extrabold text-rose-500 mt-1">{metrics.lowStockCount}</div>
          </div>
        </div>
      )}

      {/* Low Stock Warning Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span className="text-rose-500">⚠️</span> Low Inventory Watchlist (&lt; 20 units)
          </h3>
          {lowStock.length === 0 ? (
            <p className="text-xs text-slate-400">All inventory levels healthy.</p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {lowStock.map((p) => (
                <div key={p.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-slate-800">{p.name}</span>
                    <span className="text-slate-400 ml-2">({p.category})</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                      {p.stock_quantity} left
                    </span>
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="text-rose-500 hover:text-rose-700"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Orders Overview */}
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="font-bold text-slate-900 mb-4 flex items-center gap-2">
            <span>📑</span> Recent Customer Orders
          </h3>
          {recentOrders.length === 0 ? (
            <p className="text-xs text-slate-400">No orders logged yet.</p>
          ) : (
            <div className="divide-y divide-slate-100 text-xs">
              {recentOrders.map((o) => (
                <div key={o.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <span className="font-mono font-bold text-slate-800">{o.order_number}</span>
                    <div className="text-slate-400 text-[11px]">{o.customer_email}</div>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-slate-900">${Number(o.total_amount).toFixed(2)}</span>
                    <div className="text-blue-600 font-semibold text-[11px]">{o.status}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 text-lg"
            >
              ✕
            </button>
            <h2 className="text-lg font-bold text-slate-900 mb-4">Add Catalog Product</h2>

            <form onSubmit={handleCreateProduct} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-slate-700 mb-1">Product Name</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="AWS Cloud Architecture Manual"
                  className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Category</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="Hardware">Hardware</option>
                    <option value="Books">Books</option>
                    <option value="Apparel">Apparel</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-slate-700 mb-1">Price ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    className="w-full p-2 border border-slate-300 rounded-lg"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Initial Stock Quantity</label>
                <input
                  type="number"
                  required
                  value={stock}
                  onChange={(e) => setStock(e.target.value)}
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Description</label>
                <textarea
                  rows={2}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Product specifications and features..."
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-700 mb-1">Image URL (Optional)</label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  placeholder="https://images.unsplash.com/..."
                  className="w-full p-2 border border-slate-300 rounded-lg"
                />
              </div>

              <button
                type="submit"
                className="w-full mt-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 rounded-lg text-sm transition"
              >
                Create Product
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
