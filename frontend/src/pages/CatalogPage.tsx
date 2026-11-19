/**
 * Product Catalog Page
 */

import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { fetchProducts } from '../services/api';
import { ProductCard } from '../components/ProductCard';

interface CatalogPageProps {
  searchQuery: string;
  onSelectProduct: (product: Product) => void;
}

export const CatalogPage: React.FC<CatalogPageProps> = ({ searchQuery, onSelectProduct }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<string>('all');
  const [sort, setSort] = useState<string>('newest');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    async function loadCatalog() {
      setIsLoading(true);
      setErrorMsg('');
      try {
        const params: Record<string, string> = {};
        if (searchQuery) params.search = searchQuery;
        if (category && category !== 'all') params.category = category;
        if (sort) params.sort = sort;

        const res = await fetchProducts(params);
        if (res.success) {
          setProducts(res.products || []);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Failed to load products');
      } finally {
        setIsLoading(false);
      }
    }
    loadCatalog();
  }, [searchQuery, category, sort]);

  const categories = ['all', 'Hardware', 'Books', 'Apparel'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Category Tabs & Filter Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium capitalize whitespace-nowrap transition ${
                category === c
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-slate-600 hover:bg-slate-100 border border-slate-200'
              }`}
            >
              {c === 'all' ? 'All Products' : c}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-3">
          <label className="text-xs text-slate-500 font-medium">Sort By:</label>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            className="text-xs bg-white border border-slate-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="newest">Newest Arrivals</option>
            <option value="price-low">Price: Low to High</option>
            <option value="price-high">Price: High to Low</option>
            <option value="name">Product Name (A-Z)</option>
          </select>
        </div>
      </div>

      {/* Error Banner */}
      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-sm">
          <strong>Backend Connection Error:</strong> {errorMsg}
          <div className="text-xs mt-1 text-rose-600">
            Ensure backend service is running on port 5000 or through Nginx.
          </div>
        </div>
      )}

      {/* Product Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="bg-white rounded-xl border border-slate-200 h-72 animate-pulse p-4">
              <div className="h-40 bg-slate-200 rounded-lg mb-4"></div>
              <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
              <div className="h-4 bg-slate-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-slate-200">
          <span className="text-5xl block mb-3">🔍</span>
          <h3 className="text-lg font-bold text-slate-800">No matching products found</h3>
          <p className="text-sm text-slate-500 mt-1">Try adjusting your search terms or filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} onSelect={onSelectProduct} />
          ))}
        </div>
      )}
    </div>
  );
};
