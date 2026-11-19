/**
 * Product Details Modal
 */

import React, { useState } from 'react';
import { Product } from '../types';
import { useCart } from '../context/CartContext';

interface ProductDetailsModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductDetailsModal: React.FC<ProductDetailsModalProps> = ({ product, onClose }) => {
  const { addToCart } = useCart();
  const [quantity, setQuantity] = useState(1);

  if (!product) return null;

  const isOutOfStock = product.stock_quantity <= 0;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl relative flex flex-col md:flex-row">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-white/80 hover:bg-white text-slate-600 flex items-center justify-center shadow"
        >
          ✕
        </button>

        <div className="md:w-1/2 h-64 md:h-auto bg-slate-100 relative">
          <img
            src={product.image_url}
            alt={product.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              (e.target as HTMLImageElement).src =
                'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600';
            }}
          />
          <span className="absolute top-4 left-4 bg-white/90 text-xs font-semibold px-2.5 py-1 rounded-md text-slate-800">
            {product.category}
          </span>
        </div>

        <div className="p-6 md:w-1/2 flex flex-col justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-900 mb-2">{product.name}</h2>
            <div className="text-2xl font-extrabold text-blue-600 mb-3">
              ${Number(product.price).toFixed(2)}
            </div>
            <p className="text-sm text-slate-600 mb-6 leading-relaxed">{product.description}</p>

            <div className="text-xs text-slate-500 space-y-1 mb-6">
              <div>
                <strong>Availability:</strong>{' '}
                {isOutOfStock ? (
                  <span className="text-rose-500 font-semibold">Out of Stock</span>
                ) : (
                  <span className="text-emerald-600 font-semibold">
                    {product.stock_quantity} units ready to ship
                  </span>
                )}
              </div>
              <div>
                <strong>SKU / Slug:</strong> <code>{product.slug}</code>
              </div>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-100 flex items-center gap-3">
            <div className="flex items-center border border-slate-200 rounded-lg">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-l-lg"
              >
                -
              </button>
              <span className="px-3 py-1.5 font-semibold text-sm">{quantity}</span>
              <button
                onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))}
                className="px-3 py-1.5 text-slate-600 hover:bg-slate-100 rounded-r-lg"
              >
                +
              </button>
            </div>

            <button
              onClick={() => {
                addToCart(product, quantity);
                onClose();
              }}
              disabled={isOutOfStock}
              className={`flex-1 py-2 rounded-lg font-semibold text-sm transition ${
                isOutOfStock
                  ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                  : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            >
              Add {quantity} to Cart
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
