/**
 * Product Card Component
 */

import React from 'react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const { addToCart } = useCart();
  const isOutOfStock = product.stock_quantity <= 0;
  const isLowStock = product.stock_quantity > 0 && product.stock_quantity <= 10;

  return (
    <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col group">
      <div
        className="h-48 overflow-hidden bg-slate-100 cursor-pointer relative"
        onClick={() => onSelect(product)}
      >
        <img
          src={product.image_url}
          alt={product.name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          onError={(e) => {
            (e.target as HTMLImageElement).src =
              'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600';
          }}
        />
        <span className="absolute top-3 left-3 bg-white/90 backdrop-blur-sm text-xs font-semibold px-2.5 py-1 rounded-md text-slate-700 shadow-sm">
          {product.category}
        </span>
      </div>

      <div className="p-4 flex flex-col flex-1">
        <h3
          className="font-semibold text-slate-900 text-base mb-1 line-clamp-1 hover:text-blue-600 cursor-pointer"
          onClick={() => onSelect(product)}
        >
          {product.name}
        </h3>
        <p className="text-xs text-slate-500 line-clamp-2 mb-3 flex-1">{product.description}</p>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-auto">
          <div>
            <span className="text-lg font-bold text-slate-900">${Number(product.price).toFixed(2)}</span>
            <div className="text-[11px]">
              {isOutOfStock ? (
                <span className="text-rose-500 font-semibold">Out of Stock</span>
              ) : isLowStock ? (
                <span className="text-amber-600 font-medium">Only {product.stock_quantity} left</span>
              ) : (
                <span className="text-emerald-600">In Stock ({product.stock_quantity})</span>
              )}
            </div>
          </div>

          <button
            onClick={() => addToCart(product, 1)}
            disabled={isOutOfStock}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              isOutOfStock
                ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow'
            }`}
          >
            + Add
          </button>
        </div>
      </div>
    </div>
  );
};
