import React, { useState } from 'react';
import { Search, ShoppingCart, Plus, Minus, CreditCard, ChevronRight, CheckCircle2, Ticket, QrCode, FileSpreadsheet, Percent, ExternalLink } from 'lucide-react';
import { Product, CartItem, User, Sale, Invoice } from '../types';
import { getProducts, performCheckout } from '../utils/database';

interface StorefrontProps {
  currentUser: User | null;
  onSetNotification: (msg: string, type: 'success' | 'error') => void;
  cartItems: CartItem[];
  onAddToCart: (product: Product) => void;
  onUpdateCartQuantity: (productId: string, qty: number) => void;
  onClearCart: () => void;
  onViewInvoice: (invoiceId: string) => void;
}

export default function Storefront({
  currentUser,
  onSetNotification,
  cartItems,
  onAddToCart,
  onUpdateCartQuantity,
  onClearCart,
  onViewInvoice,
}: StorefrontProps) {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todos');
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [paymentSuccessData, setPaymentSuccessData] = useState<{ sale: Sale; invoice: Invoice } | null>(null);

  // Checkout inputs
  const [fullName, setFullName] = useState(currentUser?.name || '');
  const [email, setEmail] = useState(currentUser?.email || '');
  const [cpfOrCnpj, setCpfOrCnpj] = useState(currentUser?.cpfOrCnpj || '');
  const [paymentMethod, setPaymentMethod] = useState<'Pix' | 'Cartão de Crédito' | 'Boleto'>('Pix');
  
  // Card inputs
  const [cardNumber, setCardNumber] = useState('');
  const [cardExpiry, setCardExpiry] = useState('');
  const [cardCvv, setCardCvv] = useState('');

  const products = getProducts();

  // Extract unique categories
  const categories = ['Todos', ...Array.from(new Set(products.map((p) => p.category)))];

  // Filter products
  const filteredProducts = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.description.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'Todos' || p.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const cartTotal = cartItems.reduce((acc, item) => acc + item.product.price * item.quantity, 0);

  const handleStartCheckout = () => {
    if (cartItems.length === 0) {
      onSetNotification('Seu carrinho está vazio.', 'error');
      return;
    }
    setFullName(currentUser?.name || '');
    setEmail(currentUser?.email || '');
    setCpfOrCnpj(currentUser?.cpfOrCnpj || '');
    setIsCheckoutOpen(true);
    setPaymentSuccessData(null);
  };

  const handleProcessPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName || !email || !cpfOrCnpj) {
      onSetNotification('Preencha os dados do cliente para a Nota Fiscal.', 'error');
      return;
    }

    if (paymentMethod === 'Cartão de Crédito' && (!cardNumber || !cardExpiry || !cardCvv)) {
      onSetNotification('Preencha os dados corretos do cartão.', 'error');
      return;
    }

    setIsProcessing(true);

    // Simulate online gateway processing latency
    setTimeout(() => {
      try {
        const checkoutResult = performCheckout(
          currentUser?.id || 'guest-user',
          fullName,
          email,
          cpfOrCnpj,
          cartItems,
          paymentMethod
        );

        setPaymentSuccessData(checkoutResult);
        setIsProcessing(false);
        onClearCart();
        onSetNotification('Pagamento confirmado e Nota Fiscal emitida em tempo real!', 'success');
      } catch (err: any) {
        setIsProcessing(false);
        onSetNotification(err.message || 'Erro durante a finalização do pedido.', 'error');
      }
    }, 2000);
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {paymentSuccessData ? (
        /* Checkout Success Notification Panel */
        <div className="mx-auto max-w-2xl text-center border-2 border-emerald-500 bg-emerald-50/10 rounded-2xl p-8" id="checkout-success-view">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-700">
            <CheckCircle2 className="h-10 w-10" />
          </div>
          <h2 className="mt-4 text-2xl font-bold text-zinc-950 font-sans">Pedido Realizado com Sucesso!</h2>
          <p className="mt-2 text-sm text-zinc-600">
            O pagamento via <strong>{paymentSuccessData.sale.paymentMethod}</strong> totalizando <strong>R$ {paymentSuccessData.sale.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</strong> foi processado com segurança.
          </p>

          <div className="mt-6 rounded-xl border border-emerald-100 bg-white p-6 text-left space-y-3">
            <div className="flex justify-between items-center border-b border-zinc-100 pb-2">
              <span className="text-xs font-semibold text-zinc-400 uppercase">Resumo da Nota Fiscal Eletrônica</span>
              <span className="text-xs font-mono font-bold text-emerald-800 bg-emerald-100/50 px-2.5 py-1 rounded">
                {paymentSuccessData.invoice.id}
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 text-xs">
              <div>
                <span className="block text-zinc-400 font-medium">Destinatário:</span>
                <span className="font-semibold text-zinc-800">{paymentSuccessData.sale.customerName}</span>
              </div>
              <div>
                <span className="block text-zinc-400 font-medium font-mono">Chave de Acesso (44 dígitos):</span>
                <span className="font-mono text-[10px] text-zinc-600 break-all">{paymentSuccessData.invoice.accessKey}</span>
              </div>
            </div>

            <div className="bg-emerald-50/20 p-3 rounded-lg border border-emerald-100/20 flex items-center justify-between mt-3 text-xs">
              <span className="flex items-center gap-1.5 text-emerald-950 font-medium">
                <Percent className="h-4 w-4 text-emerald-700" />
                Impostos Federais & Estaduais Integrados:
              </span>
              <strong className="text-emerald-900 font-mono">
                R$ {paymentSuccessData.invoice.taxes.totalTaxes.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} (ICMS/IPI/PIS/COFINS)
              </strong>
            </div>
          </div>

          <div className="mt-8 flex justify-center">
            <button
              onClick={() => setPaymentSuccessData(null)}
              className="rounded-xl bg-emerald-850 px-8 py-3 text-sm font-semibold text-white hover:bg-emerald-900 transition-all font-sans"
              id="return-store-button"
            >
              Voltar para a Vitrine
            </button>
          </div>
        </div>
      ) : isCheckoutOpen ? (
        /* Online Payment Simulation Flow */
        <div className="mx-auto max-w-xl bg-white border border-emerald-100 rounded-2xl shadow-sm p-8" id="checkout-form-view">
          <div className="flex items-center justify-between border-b border-zinc-100 pb-4 mb-6">
            <h2 className="text-lg font-bold text-zinc-950 font-sans">Finalização de Compra Segura</h2>
            <button 
              onClick={() => setIsCheckoutOpen(false)}
              className="text-xs text-zinc-500 hover:text-zinc-700 transition"
              id="cancel-checkout"
            >
              Voltar ao Carrinho
            </button>
          </div>

          {isProcessing ? (
            /* Gateway Load Screen */
            <div className="py-12 text-center" id="payment-processing-spinner">
              <div className="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-emerald-200 border-t-emerald-800 mb-4"></div>
              <p className="text-sm font-semibold text-zinc-800">Conectando com o gateway de pagamento...</p>
              <p className="text-xs text-zinc-400 mt-1">Garantindo autenticação de criptografia SSL & dados fiscais.</p>
            </div>
          ) : (
            <form onSubmit={handleProcessPayment} className="space-y-6">
              {/* NF-e Receiver Info */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  1. Dados Pessoais (Obrigatório para NF-e)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="chk-name" className="block text-xs font-medium text-zinc-600 mb-1">Nome Completo</label>
                    <input
                      id="chk-name"
                      type="text"
                      required
                      placeholder="Ex: Mariana De Souza"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2 px-3 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                  <div>
                    <label htmlFor="chk-email" className="block text-xs font-medium text-zinc-600 mb-1">E-mail</label>
                    <input
                      id="chk-email"
                      type="email"
                      required
                      placeholder="mariana@email.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2 px-3 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none transition-all"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="chk-cpf" className="block text-xs font-medium text-zinc-600 mb-1">CPF ou CNPJ do Destinatário</label>
                  <input
                    id="chk-cpf"
                    type="text"
                    required
                    placeholder="Ex: 111.222.333-44"
                    value={cpfOrCnpj}
                    onChange={(e) => setCpfOrCnpj(e.target.value)}
                    className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2 px-3 text-xs focus:border-emerald-600 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              {/* Payment Method Selector */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-emerald-800 uppercase tracking-wider">
                  2. Método de Pagamento Online
                </h3>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Pix')}
                    className={`flex flex-col items-center justify-center rounded-xl p-3 border font-medium text-xs transition ${
                      paymentMethod === 'Pix'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600'
                        : 'border-zinc-250 bg-white text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    <QrCode className="h-5 w-5 text-emerald-700 mb-1" />
                    <span>Pix (Confirm. Inst)</span>
                  </button>
                  
                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Cartão de Crédito')}
                    className={`flex flex-col items-center justify-center rounded-xl p-3 border font-medium text-xs transition ${
                      paymentMethod === 'Cartão de Crédito'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600'
                        : 'border-zinc-250 bg-white text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    <CreditCard className="h-5 w-5 text-emerald-700 mb-1" />
                    <span>Cartão Crédito</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setPaymentMethod('Boleto')}
                    className={`flex flex-col items-center justify-center rounded-xl p-3 border font-medium text-xs transition ${
                      paymentMethod === 'Boleto'
                        ? 'border-emerald-600 bg-emerald-50 text-emerald-950 ring-1 ring-emerald-600'
                        : 'border-zinc-250 bg-white text-zinc-600 hover:bg-zinc-50'
                    }`}
                  >
                    <Ticket className="h-5 w-5 text-emerald-700 mb-1" />
                    <span>Boleto Bancário</span>
                  </button>
                </div>
              </div>

              {/* Conditional Payment Sub-Forms */}
              {paymentMethod === 'Pix' && (
                <div className="bg-emerald-50/35 border border-emerald-100 p-4 rounded-xl text-center space-y-2">
                  <span className="inline-block text-[10px] font-bold text-emerald-900 bg-emerald-100 border border-emerald-300 px-3 py-1 rounded-full uppercase tracking-wider">
                    ⚡ Desconto de 3% no Pix Ativo
                  </span>
                  <p className="text-xs text-zinc-600">
                    O QR-Code e a chave copia-cola do Pix serão exibidos instantaneamente e validados pelo nosso sistema.
                  </p>
                </div>
              )}

              {paymentMethod === 'Boleto' && (
                <div className="bg-zinc-50 border p-4 rounded-xl text-center text-xs text-zinc-500">
                  O boleto PDF será gerado com vencimento de 2 dias úteis. A confirmação bancária ocorre em até 24 horas.
                </div>
              )}

              {paymentMethod === 'Cartão de Crédito' && (
                <div className="space-y-3 bg-zinc-50/50 p-4 rounded-xl border">
                  <div>
                    <label htmlFor="chk-cardnum" className="block text-xs font-medium text-zinc-600 mb-1">Número do Cartão</label>
                    <input
                      id="chk-cardnum"
                      type="text"
                      maxLength={19}
                      placeholder="4000 1234 5678 9010"
                      value={cardNumber}
                      onChange={(e) => setCardNumber(e.target.value.replace(/\s?/g, '').replace(/(\d{4})/g, '$1 ').trim())}
                      className="block w-full rounded-xl border border-zinc-200 bg-white py-2 px-3 text-xs focus:border-emerald-600 focus:outline-none"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label htmlFor="chk-expiry" className="block text-xs font-medium text-zinc-600 mb-1">Validade (MM/AA)</label>
                      <input
                        id="chk-expiry"
                        type="text"
                        maxLength={5}
                        placeholder="11/29"
                        value={cardExpiry}
                        onChange={(e) => setCardExpiry(e.target.value)}
                        className="block w-full rounded-xl border border-zinc-200 bg-white py-2 px-3 text-xs focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                    <div>
                      <label htmlFor="chk-cvv" className="block text-xs font-medium text-zinc-600 mb-1">CVC / CVV</label>
                      <input
                        id="chk-cvv"
                        type="password"
                        maxLength={4}
                        placeholder="123"
                        value={cardCvv}
                        onChange={(e) => setCardCvv(e.target.value)}
                        className="block w-full rounded-xl border border-zinc-200 bg-white py-2 px-3 text-xs focus:border-emerald-600 focus:outline-none"
                      />
                    </div>
                  </div>
                </div>
              )}

              {/* Summary and pay button */}
              <div className="border-t pt-4">
                <div className="flex justify-between items-center text-sm font-semibold text-zinc-800 mb-4 px-1">
                  <span>Total a Pagar:</span>
                  <span className="text-lg font-bold text-emerald-900 font-mono">
                    R$ {cartTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>

                <button
                  type="submit"
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white hover:bg-emerald-700 transition"
                  id="pay-submit-button"
                >
                  <CreditCard className="h-4.5 w-4.5" />
                  <span>Pagar Agora & Emitir Nota Fiscal</span>
                </button>
              </div>
            </form>
          )}
        </div>
      ) : (
        /* Standard Storefront and Product Catalogue Grid */
        <div className="space-y-8" id="store-browsing-view">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-zinc-100 pb-6">
            <div>
              <h1 className="text-2xl font-bold text-zinc-950 tracking-tight font-sans">Vitrine de Produtos Premium</h1>
              <p className="text-xs text-zinc-500 mt-1">Selecione objetos minimalistas com designs ecológicos, refinados e sustentáveis.</p>
            </div>

            {/* Catalog search bar */}
            <div className="relative w-full max-w-sm">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                <Search className="h-4.5 w-4.5" />
              </span>
              <input
                id="product-search-input"
                type="text"
                placeholder="Buscar produto ou categoria..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2.5 pl-10 pr-4 text-xs text-zinc-800 placeholder-zinc-400 focus:border-emerald-600 focus:bg-white focus:outline-none transition-all"
              />
            </div>
          </div>

          {/* Chips Filter Category */}
          <div className="flex flex-wrap gap-2" id="category-filter-chips">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold transition ${
                  selectedCategory === cat
                    ? 'bg-emerald-600 text-white shadow-sm font-bold'
                    : 'bg-zinc-50 text-zinc-650 hover:bg-zinc-100 border'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Product cards grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" id="products-catalog-grid">
            {filteredProducts.length === 0 ? (
              <div className="col-span-full py-12 text-center rounded-2xl border border-dashed text-zinc-400">
                Infelizmente nenhum produto ecológico corresponde ao filtro inserido.
              </div>
            ) : (
              filteredProducts.map((prod) => (
                <div
                  key={prod.id}
                  className="group relative flex flex-col overflow-hidden rounded-2xl border border-emerald-50/70 bg-white transition-all hover:shadow-md hover:border-emerald-200"
                  id={`product-card-${prod.id}`}
                >
                  {/* Stock Alert Badge */}
                  <div className="absolute top-3 right-3 z-10">
                    {prod.stock === 0 ? (
                      <span className="rounded-full bg-rose-100 border border-rose-300 px-2.5 py-0.5 text-[9px] font-bold text-rose-800 uppercase tracking-wider">
                        Esgotado
                      </span>
                    ) : prod.stock <= prod.minStock ? (
                      <span className="rounded-full bg-amber-100 border border-amber-305 px-2.5 py-0.5 text-[9px] font-bold text-amber-800 uppercase tracking-wider animate-pulse">
                        Baixo Estoque ({prod.stock})
                      </span>
                    ) : (
                      <span className="rounded-full bg-emerald-50 border border-emerald-200 px-2.5 py-0.5 text-[9px] font-medium text-emerald-800">
                        {prod.stock} un. restantes
                      </span>
                    )}
                  </div>

                  {/* Image container */}
                  <div 
                    onClick={() => {
                      if (prod.externalUrl) {
                        window.open(prod.externalUrl, '_blank', 'noopener,noreferrer');
                      }
                    }}
                    className={`aspect-[4/3] w-full overflow-hidden bg-zinc-100 ${prod.externalUrl ? 'cursor-pointer' : ''}`}
                  >
                    <img
                      src={prod.imageUrl}
                      alt={prod.name}
                      referrerPolicy="no-referrer"
                      className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>

                  {/* Info details */}
                  <div className="flex flex-1 flex-col p-5">
                    <span className="text-[10px] font-mono font-bold text-emerald-700 uppercase tracking-widest">{prod.category}</span>
                    <h3 
                      onClick={() => {
                        if (prod.externalUrl) {
                          window.open(prod.externalUrl, '_blank', 'noopener,noreferrer');
                        }
                      }}
                      className={`mt-1 text-sm font-bold text-zinc-900 line-clamp-1 ${prod.externalUrl ? 'cursor-pointer hover:text-emerald-700 hover:underline transition-all' : ''}`}
                    >
                      {prod.name}
                    </h3>
                    <p className="mt-1 text-[11px] text-zinc-500 leading-relaxed line-clamp-2 h-8">{prod.description}</p>
                    <span className="mt-2 text-xs font-mono font-medium text-zinc-400">SKU: {prod.sku}</span>
                    
                    <div className="mt-5 flex items-center justify-between border-t border-zinc-50 pt-4">
                      <span className="text-md font-bold text-emerald-900 font-mono">
                        R$ {prod.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      
                      <button
                        onClick={() => {
                          const url = prod.externalUrl || 'https://www.google.com';
                          window.open(url, '_blank', 'noopener,noreferrer');
                        }}
                        className="rounded-xl px-3.5 py-2 text-xs font-bold transition flex items-center gap-1.5 bg-emerald-600 text-white hover:bg-emerald-700"
                        id={`btn-add-to-cart-${prod.id}`}
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        <span>Link</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Cart Drawer Overlay Sidebar if items in cart are active */}
      {cartItems.length > 0 && !isCheckoutOpen && !paymentSuccessData && (
        <div className="fixed bottom-6 right-6 z-30" id="cart-drawer-summary">
          <div className="rounded-2xl border border-emerald-300 bg-white p-5 shadow-lg max-w-sm ring-1 ring-emerald-500/10">
            <div className="flex items-center justify-between border-b pb-2 mb-3">
              <span className="flex items-center gap-2 text-xs font-bold text-zinc-900 uppercase">
                <ShoppingCart className="h-4 w-4 text-emerald-700" />
                Carrinho ({cartItems.reduce((a,c) => a+c.quantity, 0)})
              </span>
              <button 
                onClick={onClearCart}
                className="text-[10px] text-zinc-400 hover:text-rose-600 transition"
              >
                Esvaziar
              </button>
            </div>

            <div className="space-y-2.5 max-h-40 overflow-y-auto mb-3 pr-1">
              {cartItems.map((item) => (
                <div key={item.product.id} className="flex justify-between items-center text-xs">
                  <div className="flex-1 min-w-0 pr-2">
                    <span className="block font-semibold text-zinc-800 truncate">{item.product.name}</span>
                    <span className="text-[10px] text-zinc-400 font-mono">
                      {item.quantity}x R$ {item.product.price.toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <button
                      onClick={() => onUpdateCartQuantity(item.product.id, item.quantity - 1)}
                      className="h-5 w-5 bg-zinc-100 rounded flex items-center justify-center text-zinc-600 hover:bg-zinc-200 transition"
                    >
                      -
                    </button>
                    <span className="text-[11px] font-bold font-mono text-zinc-900 w-4 text-center">{item.quantity}</span>
                    <button
                      onClick={() => onUpdateCartQuantity(item.product.id, item.quantity + 1)}
                      disabled={item.quantity >= item.product.stock}
                      className="h-5 w-5 bg-zinc-100 rounded flex items-center justify-center text-zinc-600 hover:bg-zinc-200 transition disabled:opacity-30"
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t pt-3 flex items-center justify-between mb-3 text-xs">
              <span className="font-semibold text-zinc-500">Valor Total:</span>
              <span className="font-bold text-emerald-950 font-mono">
                R$ {cartTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </span>
            </div>

            <button
              onClick={handleStartCheckout}
              className="w-full flex items-center justify-center gap-1 bg-emerald-600 text-white rounded-xl py-2 text-xs font-bold hover:bg-emerald-700 transition"
              id="goto-checkout-button"
            >
              <span>Finalizar Compra</span>
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
