/**
 * Central Single Page Application Root Component
 */

import React, { useState } from 'react';
import { AuthProvider } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { TelemetryBar } from './components/TelemetryBar';
import { Navbar } from './components/Navbar';
import { CatalogPage } from './pages/CatalogPage';
import { OrdersPage } from './pages/OrdersPage';
import { AdminDashboard } from './pages/AdminDashboard';
import { CartDrawer } from './components/CartDrawer';
import { AuthModal } from './pages/AuthModal';
import { ProductDetailsModal } from './components/ProductDetailsModal';
import { Product } from './types';

export const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = useState<string>('catalog');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAuthModalOpen, setIsAuthModalOpen] = useState<boolean>(false);
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState<boolean>(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [orderConfirmation, setOrderConfirmation] = useState<string | null>(null);

  const handleOrderSuccess = (orderNumber: string) => {
    setOrderConfirmation(orderNumber);
    setCurrentView('orders');
    setTimeout(() => setOrderConfirmation(null), 8000);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
      <TelemetryBar />
      <Navbar
        currentView={currentView}
        setCurrentView={setCurrentView}
        openAuthModal={() => setIsAuthModalOpen(true)}
        openCartDrawer={() => setIsCartDrawerOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
      />

      {/* Order Confirmation Alert */}
      {orderConfirmation && (
        <div className="bg-emerald-600 text-white text-sm py-3 px-4 text-center font-medium shadow-md">
          🎉 Order Confirmed! Reference ID:{' '}
          <span className="font-mono font-bold bg-emerald-700 px-2 py-0.5 rounded">{orderConfirmation}</span>.
          Track your package status below.
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1">
        {currentView === 'catalog' && (
          <CatalogPage
            searchQuery={searchQuery}
            onSelectProduct={(p) => setSelectedProduct(p)}
          />
        )}
        {currentView === 'orders' && <OrdersPage />}
        {currentView === 'admin' && <AdminDashboard />}
      </main>

      {/* Modals & Slide-Overs */}
      <CartDrawer
        isOpen={isCartDrawerOpen}
        onClose={() => setIsCartDrawerOpen(false)}
        onOrderSuccess={handleOrderSuccess}
      />
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
      />
      <ProductDetailsModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-2">
          <span>&copy; 2026 RetailCorp CloudStore &bull; DevOps & SRE Production Capstone</span>
          <div className="flex gap-4 font-mono text-[11px]">
            <a href="/healthz" target="_blank" className="hover:text-blue-600">/healthz</a>
            <a href="/ready" target="_blank" className="hover:text-blue-600">/ready</a>
            <a href="/metrics" target="_blank" className="hover:text-blue-600">/metrics</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <CartProvider>
        <AppContent />
      </CartProvider>
    </AuthProvider>
  );
};

export default App;
