import React from 'react';
import { ShoppingBag, User, LogOut, ShieldAlert, CheckCircle } from 'lucide-react';
import { User as UserType } from '../types';

interface HeaderProps {
  currentUser: UserType | null;
  onNavigate: (view: string) => void;
  currentView: string;
  cartCount: number;
  onOpenCart: () => void;
  onLogout: () => void;
}

export default function Header({
  currentUser,
  onNavigate,
  currentView,
  cartCount,
  onOpenCart,
  onLogout,
}: HeaderProps) {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-emerald-100 bg-white/95 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        
        {/* Brand Logo */}
        <div 
          onClick={() => onNavigate('store')} 
          className="flex cursor-pointer items-center space-x-2 text-emerald-800"
          id="brand-logo"
        >
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 font-mono text-xl font-bold text-white shadow-sm ring-2 ring-emerald-100">
            V
          </div>
          <div className="flex flex-col">
            <span className="font-sans text-lg font-semibold tracking-tight text-emerald-950">VERT</span>
            <span className="font-mono text-[9px] font-medium tracking-widest text-emerald-600 -mt-1 uppercase">Sistemas</span>
          </div>
        </div>

        {/* Dynamic Navigation Roles System */}
        <nav className="hidden md:flex items-center space-x-1" id="main-nav">
          <button
            onClick={() => onNavigate('store')}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
              currentView === 'store'
                ? 'bg-emerald-50 text-emerald-800'
                : 'text-zinc-600 hover:bg-zinc-50 hover:text-emerald-800'
            }`}
          >
            Vitrine / Loja
          </button>

          {/* Access-Controlled Nav Links */}
          {currentUser && (currentUser.role === 'seller' || currentUser.role === 'manager') && (
            <>
              <button
                onClick={() => onNavigate('inventory')}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all duration-200 ${
                  currentView === 'inventory'
                    ? 'bg-emerald-50 text-emerald-800'
                    : 'text-zinc-600 hover:bg-zinc-50 hover:text-emerald-800'
                }`}
              >
                Gerenciar Estoque
              </button>
            </>
          )}
        </nav>

        {/* User Badges, Profile and Cart Actions */}
        <div className="flex items-center space-x-4">
          
          {/* Active Cart */}
          <button
            onClick={onOpenCart}
            className="group relative flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50/50 hover:bg-emerald-50 text-emerald-800 transition-all border border-emerald-100/50"
            aria-label="Abrir Carrinho"
            id="cart-trigger-button"
          >
            <ShoppingBag className="h-5 w-5 stroke-[1.8]" />
            {cartCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-[10px] font-bold text-white animate-bounce-short">
                {cartCount}
              </span>
            )}
          </button>

          {/* User Status / Area */}
          {currentUser ? (
            <div className="flex items-center space-x-2 border-l border-emerald-100 pl-4">
              <div 
                onClick={() => onNavigate('profile')}
                className="flex cursor-pointer items-center space-x-2 group"
                title="Acessar painel do usuário e 2FA"
              >
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-100 text-emerald-800 transition-colors group-hover:bg-emerald-600 group-hover:text-white">
                  <User className="h-4.5 w-4.5" />
                </div>
                <div className="hidden lg:flex flex-col text-left">
                  <span className="text-xs font-semibold text-zinc-800 group-hover:text-emerald-700 transition-colors">{currentUser.name}</span>
                  <span className="flex items-center gap-1 text-[9px] font-mono font-semibold tracking-wider text-emerald-600 uppercase">
                    {currentUser.role === 'manager' ? 'Gerente' : currentUser.role === 'seller' ? 'Vendedor' : 'Cliente'}
                    {currentUser.isTwoFactorEnabled && (
                      <span className="text-emerald-500 font-bold" title="2FA Ativado">● 2FA</span>
                    )}
                  </span>
                </div>
              </div>
              
              <button
                onClick={onLogout}
                className="flex h-9 w-9 items-center justify-center rounded-xl text-zinc-400 hover:bg-rose-50 hover:text-rose-600 transition-all"
                title="Sair da Conta"
                id="logout-button"
              >
                <LogOut className="h-4.5 w-4.5" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => onNavigate('auth')}
              className="flex items-center space-x-2 rounded-xl bg-emerald-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-emerald-700 transition-all"
              id="login-button"
            >
              <User className="h-4 w-4" />
              <span>Entrar / Cadastro</span>
            </button>
          )}
        </div>
      </div>

      {/* Mobile Navigation Indicator Bar */}
      <div className="flex md:hidden border-t border-emerald-50 bg-emerald-50/20 px-4 py-2 overflow-x-auto gap-2">
        <button
          onClick={() => onNavigate('store')}
          className={`px-3 py-1 text-xs rounded-full whitespace-nowrap font-medium transition ${
            currentView === 'store' ? 'bg-emerald-600 text-white' : 'text-emerald-800'
          }`}
        >
          Loja
        </button>
        {currentUser && (currentUser.role === 'seller' || currentUser.role === 'manager') && (
          <>
            <button
              onClick={() => onNavigate('inventory')}
              className={`px-3 py-1 text-xs rounded-full whitespace-nowrap font-medium transition ${
                currentView === 'inventory' ? 'bg-emerald-600 text-white' : 'text-emerald-800'
              }`}
            >
              Estoque
            </button>
          </>
        )}
        {currentUser && (
          <button
            onClick={() => onNavigate('profile')}
            className={`px-3 py-1 text-xs rounded-full whitespace-nowrap font-medium transition ${
              currentView === 'profile' ? 'bg-emerald-600 text-white' : 'text-emerald-100'
            }`}
          >
            Minha Conta {currentUser.isTwoFactorEnabled && '🔒'}
          </button>
        )}
      </div>
    </header>
  );
}
