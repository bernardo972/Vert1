import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, CheckCircle, ShoppingCart } from 'lucide-react';

import Header from './components/Header';
import Auth from './components/Auth';
import Storefront from './components/Storefront';
import Inventory from './components/Inventory';
import UserProfile from './components/UserProfile';

import { User, CartItem, Product, Invoice } from './types';
import { getLoggedInUser, setLoggedInUser, dbInit, subscribeToDatabase } from './utils/database';

export default function App() {
  const [, setDbTick] = useState(0);

  // 1. Initial Local DB Setup and Firestore Realtime Synchronizer
  useEffect(() => {
    dbInit();
    const unsubscribe = subscribeToDatabase(() => {
      setDbTick(prev => prev + 1);
      const logged = getLoggedInUser();
      setCurrentUser(logged);
    });
    return unsubscribe;
  }, []);

  // 2. Global application state
  const [currentUser, setCurrentUser] = useState<User | null>(getLoggedInUser());
  const [currentView, setCurrentView] = useState<string>(() => {
    return getLoggedInUser() ? 'store' : 'auth';
  });
  
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
  
  // To handle redirect views on invoice generated
  const [activeInvoiceIdRedirect, setActiveInvoiceIdRedirect] = useState<string | null>(null);

  // Auto clean notifications
  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => {
        setNotification(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  const handleSetNotification = (msg: string, type: 'success' | 'error') => {
    setNotification({ message: msg, type });
  };

  // Auth logins handler
  const handleLoginSuccess = (user: User) => {
    setLoggedInUser(user);
    setCurrentUser(user);
    setCurrentView('store');
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setCurrentUser(null);
    setCartItems([]);
    setCurrentView('auth');
    handleSetNotification('Sessão encerrada com segurança.', 'success');
  };

  // Access control guards during navigation click
  const handleNavigate = (view: string) => {
    // Auth Guard
    if (!currentUser && view !== 'auth' && view !== 'store') {
      setCurrentView('auth');
      handleSetNotification('Efetue login para acessar essa área de controle.', 'error');
      return;
    }

    // Role Restricted: Seller and Manager only can view inventory
    if (currentUser && view === 'inventory') {
      if (currentUser.role !== 'seller' && currentUser.role !== 'manager') {
        setCurrentView('store');
        handleSetNotification('Acesso negado: Perfil sem privilégios de vendas/estoque.', 'error');
        return;
      }
    }

    setCurrentView(view);
    setIsCartOpen(false); // Close cart sidebar on view transfer
  };

  // Cart operations
  const handleAddToCart = (product: Product) => {
    setCartItems((prev) => {
      const found = prev.find((item) => item.product.id === product.id);
      if (found) {
        if (found.quantity >= product.stock) {
          handleSetNotification(`Não há mais unidades de ${product.name} disponíveis no estoque.`, 'error');
          return prev;
        }
        handleSetNotification(`Unidade adicional de ${product.name} somada ao carrinho!`, 'success');
        return prev.map((item) =>
          item.product.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      handleSetNotification(`${product.name} adicionado ao carrinho!`, 'success');
      return [...prev, { product, quantity: 1 }];
    });
  };

  const handleUpdateCartQuantity = (productId: string, qty: number) => {
    if (qty <= 0) {
      setCartItems((prev) => prev.filter((item) => item.product.id !== productId));
      handleSetNotification('Item removido do carrinho.', 'success');
    } else {
      setCartItems((prev) =>
        prev.map((item) => (item.product.id === productId ? { ...item, quantity: qty } : item))
      );
    }
  };

  const handleClearCart = () => {
    setCartItems([]);
  };

  // Redirect from checkout success
  const handleViewInvoiceDirectly = (invoiceId: string) => {
    handleNavigate('store');
  };

  const handleClearRedirectId = () => {
    setActiveInvoiceIdRedirect(null);
  };

  // Render view engine
  const renderCurrentView = () => {
    switch (currentView) {
      case 'store':
        return (
          <Storefront
            currentUser={currentUser}
            onSetNotification={handleSetNotification}
            cartItems={cartItems}
            onAddToCart={handleAddToCart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
            onClearCart={handleClearCart}
            onViewInvoice={handleViewInvoiceDirectly}
          />
        );
      case 'auth':
        return (
          <Auth
            onLoginSuccess={handleLoginSuccess}
            onSetNotification={handleSetNotification}
          />
        );
      case 'inventory':
        return (
          <Inventory
            currentUser={currentUser}
            onSetNotification={handleSetNotification}
          />
        );
      case 'profile':
        return (
          <UserProfile
            currentUser={currentUser}
            onSetNotification={handleSetNotification}
            onViewInvoice={handleViewInvoiceDirectly}
          />
        );
      default:
        return (
          <Storefront
            currentUser={currentUser}
            onSetNotification={handleSetNotification}
            cartItems={cartItems}
            onAddToCart={handleAddToCart}
            onUpdateCartQuantity={handleUpdateCartQuantity}
            onClearCart={handleClearCart}
            onViewInvoice={handleViewInvoiceDirectly}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50/50 text-zinc-900 transition-all duration-300 antialiased selection:bg-emerald-100 selection:text-emerald-900" id="main-app-container">
      
      {/* Header component */}
      <Header
        currentUser={currentUser}
        onNavigate={handleNavigate}
        currentView={currentView}
        cartCount={cartItems.reduce((acc, item) => acc + item.quantity, 0)}
        onOpenCart={() => setIsCartOpen(!isCartOpen)}
        onLogout={handleLogout}
      />

      {/* Main app viewport */}
      <main className="mx-auto max-w-7xl px-0 py-4 sm:px-4">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
          >
            {renderCurrentView()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Floated state-driven toast notification center */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className={`fixed bottom-6 right-6 z-50 flex items-center space-x-3 rounded-2xl p-4 shadow-xl border ${
              notification.type === 'success'
                ? 'bg-emerald-950 border-emerald-800 text-emerald-50'
                : 'bg-rose-950 border-rose-800 text-rose-50'
            }`}
            id="applet-notification-toast"
          >
            {notification.type === 'success' ? (
              <CheckCircle className="h-5 w-5 text-emerald-400 shrink-0" />
            ) : (
              <AlertCircle className="h-5 w-5 text-rose-400 shrink-0" />
            )}
            <span className="text-xs font-semibold leading-relaxed tracking-wide pr-2">{notification.message}</span>
            <button 
              onClick={() => setNotification(null)}
              className="text-[10px] font-bold text-zinc-400 hover:text-white pl-2 border-l"
            >
              OK
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Quick Status / Credit Footer bar */}
      <footer className="mt-20 border-t border-emerald-100 bg-white/70 py-6 text-center text-[10px] text-zinc-400 font-mono tracking-wider print:hidden">
        <div>VERT SYSTEMS ERP — PLATAFORMA DE GESTÃO INTEGRADA</div>
        <div className="mt-1 font-sans text-zinc-400">Compliance Fiscal & Proteção de Dados com 2-Factor Authentication</div>
      </footer>
    </div>
  );
}
