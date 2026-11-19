/**
 * Top Navigation Bar
 */

import React from 'react';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

interface NavbarProps {
  currentView: string;
  setCurrentView: (view: string) => void;
  openAuthModal: () => void;
  openCartDrawer: () => void;
  searchQuery: string;
  setSearchQuery: (q: string) => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  setCurrentView,
  openAuthModal,
  openCartDrawer,
  searchQuery,
  setSearchQuery,
}) => {
  const { user, logout, isAdmin } = useAuth();
  const { totalItems } = useCart();

  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          {/* Brand Logo */}
          <div
            className="flex items-center gap-2 cursor-pointer flex-shrink-0"
            onClick={() => setCurrentView('catalog')}
          >
            <span className="text-2xl">☁️</span>
            <div>
              <span className="text-xl font-bold tracking-tight text-slate-900">
                Retail<span className="text-blue-600">Corp</span>
              </span>
              <span className="hidden sm:inline-block ml-2 text-xs font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                CloudStore
              </span>
            </div>
          </div>

          {/* Search Box */}
          <div className="flex-1 max-w-md mx-2">
            <div className="relative">
              <input
                type="text"
                placeholder="Search products, hardware, books..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-sm bg-slate-50 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
              />
              <span className="absolute left-3 top-2 text-slate-400 text-sm">🔍</span>
            </div>
          </div>

          {/* Navigation Links & Actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setCurrentView('catalog')}
              className={`text-sm font-medium px-3 py-1.5 rounded-md transition ${
                currentView === 'catalog' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Catalog
            </button>

            {user && (
              <button
                onClick={() => setCurrentView('orders')}
                className={`text-sm font-medium px-3 py-1.5 rounded-md transition ${
                  currentView === 'orders' ? 'text-blue-600 bg-blue-50' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Orders
              </button>
            )}

            {isAdmin && (
              <button
                onClick={() => setCurrentView('admin')}
                className={`text-sm font-medium px-3 py-1.5 rounded-md transition ${
                  currentView === 'admin'
                    ? 'text-purple-700 bg-purple-50 font-semibold border border-purple-200'
                    : 'text-purple-600 hover:text-purple-800'
                }`}
              >
                ⚙️ Admin
              </button>
            )}

            {/* Shopping Cart Button */}
            <button
              onClick={openCartDrawer}
              className="relative bg-slate-100 hover:bg-slate-200 text-slate-800 px-3.5 py-1.5 rounded-lg text-sm font-medium flex items-center gap-1.5 transition"
            >
              <span>🛒</span>
              <span className="hidden sm:inline">Cart</span>
              {totalItems > 0 && (
                <span className="bg-blue-600 text-white text-xs px-2 py-0.5 rounded-full font-bold ml-1">
                  {totalItems}
                </span>
              )}
            </button>

            {/* User Auth Section */}
            {user ? (
              <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                <span className="text-xs text-slate-500 hidden md:inline">
                  Hello, <strong className="text-slate-700">{user.fullName.split(' ')[0]}</strong>
                </span>
                <button
                  onClick={logout}
                  className="text-xs text-slate-500 hover:text-red-600 border border-slate-200 hover:border-red-200 px-2.5 py-1.5 rounded transition"
                >
                  Logout
                </button>
              </div>
            ) : (
              <button
                onClick={openAuthModal}
                className="bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-1.5 rounded-lg text-sm font-medium transition"
              >
                Sign In
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
