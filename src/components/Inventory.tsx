import React, { useState, useEffect } from 'react';
import { Package, Plus, Edit3, Trash2, Search, AlertCircle, TrendingUp, DollarSign, FileText } from 'lucide-react';
import { Product, User } from '../types';
import { getProducts, addProduct, updateProduct, deleteProduct, subscribeToDatabase } from '../utils/database';

interface InventoryProps {
  currentUser: User | null;
  onSetNotification: (msg: string, type: 'success' | 'error') => void;
}

export default function Inventory({ currentUser, onSetNotification }: InventoryProps) {
  // Database local read
  const [products, setProducts] = useState<Product[]>(getProducts());
  const [search, setSearch] = useState('');
  
  // Alert checkboxes
  const [showOnlyLowStock, setShowOnlyLowStock] = useState(false);

  // Form Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [productToDelete, setProductToDelete] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    refreshList();
    const unsubscribe = subscribeToDatabase(() => {
      refreshList();
    });
    return unsubscribe;
  }, []);
  
  // Form values
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [category, setCategory] = useState('');
  const [price, setPrice] = useState(0);
  const [costPrice, setCostPrice] = useState(0);
  const [stock, setStock] = useState(0);
  const [minStock, setMinStock] = useState(0);
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [externalUrl, setExternalUrl] = useState('');

  const refreshList = () => {
    setProducts(getProducts());
  };

  const handleOpenAddModal = () => {
    setEditingId(null);
    setName('');
    // Generate some automatic SKU to simplify
    setSku(`VERT-${Math.floor(Math.random() * 8999 + 1000)}`);
    setCategory('Móveis');
    setPrice(100);
    setCostPrice(50);
    setStock(10);
    setMinStock(3);
    setImageUrl('https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&q=80&w=600');
    setDescription('');
    setExternalUrl('https://www.google.com');
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (prod: Product) => {
    setEditingId(prod.id);
    setName(prod.name);
    setSku(prod.sku);
    setCategory(prod.category);
    setPrice(prod.price);
    setCostPrice(prod.costPrice);
    setStock(prod.stock);
    setMinStock(prod.minStock);
    setImageUrl(prod.imageUrl);
    setDescription(prod.description);
    setExternalUrl(prod.externalUrl || '');
    setIsModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !sku || !category || price <= 0 || costPrice <= 0) {
      onSetNotification('Preencha os dados e valores do produto com valores válidos.', 'error');
      return;
    }

    if (editingId) {
      // Edit
      const updated: Product = {
        id: editingId,
        name,
        sku,
        category,
        price,
        costPrice,
        stock,
        minStock,
        imageUrl,
        description,
        externalUrl
      };
      updateProduct(updated);
      onSetNotification(`Produto '${name}' atualizado com sucesso!`, 'success');
    } else {
      // Create new
      addProduct({
        name,
        sku,
        category,
        price,
        costPrice,
        stock,
        minStock,
        imageUrl,
        description,
        externalUrl
      });
      onSetNotification(`Produto '${name}' inserido no estoque!`, 'success');
    }

    setIsModalOpen(false);
    refreshList();
  };

  const handleDelete = (id: string, prodName: string) => {
    setProductToDelete({ id, name: prodName });
  };

  const confirmDelete = () => {
    if (productToDelete) {
      deleteProduct(productToDelete.id);
      onSetNotification('Produto removido do catálogo.', 'success');
      setProductToDelete(null);
      refreshList();
    }
  };

  // Compute metrics
  const totalSkuCount = products.length;
  const outOfStockItems = products.filter(p => p.stock === 0);
  const lowStockItems = products.filter(p => p.stock > 0 && p.stock <= p.minStock);
  const totalStockAssetsValue = products.reduce((acc, p) => acc + (p.stock * p.costPrice), 0);

  // Filter lists
  const filtered = products.filter((p) => {
    const matchesSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.sku.toLowerCase().includes(search.toLowerCase());
    const matchesLowStock = !showOnlyLowStock || p.stock === 0 || p.stock <= p.minStock;
    return matchesSearch && matchesLowStock;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" id="inventory-view-dashboard">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-6 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950 font-sans">Módulo de Controle de Estoque</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Gestão integrada física. Acompanhe a disponibilidade, margem operacional de margens e emita os dados corretos no ERP.
          </p>
        </div>

        {/* Create button */}
        <button
          onClick={handleOpenAddModal}
          className="flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm"
          id="add-product-trigger-btn"
        >
          <Plus className="h-4 w-4" />
          <span>Cadastrar Novo SKU</span>
        </button>
      </div>

      {/* Stock warning banner alerts if appropriate */}
      {(outOfStockItems.length > 0 || lowStockItems.length > 0) && (
        <div className="rounded-xl bg-amber-50 border border-amber-200 p-4 mb-6 flex items-start gap-3">
          <AlertCircle className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs">
            <span className="font-bold text-amber-900 block uppercase tracking-wide">Atenção ao Nível de Abastecimento:</span>
            <span className="text-amber-850 mt-1 block">
              Sua operação possui <strong>{outOfStockItems.length}</strong> produto(s) totalmente esgotados e <strong>{lowStockItems.length}</strong> em estoque crítico.
              Isso pode impactar diretamente a conversão de vendas na vitrine.
            </span>
          </div>
        </div>
      )}

      {/* Stats microcards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6" id="inventory-stats-subgrid">
        <div className="rounded-xl border border-emerald-50 bg-white p-4 shadow-sm">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Valores em Ativos</span>
          <div className="flex items-baseline space-x-1 mt-2">
            <span className="text-lg font-bold text-emerald-950 font-mono">
              R$ {totalStockAssetsValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <p className="text-[10px] text-zinc-500 mt-1">Custo de aquisição total.</p>
        </div>

        <div className="rounded-xl border border-emerald-50 bg-white p-4 shadow-sm">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase">Total SKUs Ativos</span>
          <div className="text-lg font-bold text-zinc-950 mt-2 font-mono">{totalSkuCount}</div>
          <p className="text-[10px] text-zinc-500 mt-1">Itens no catálogo.</p>
        </div>

        <div className="rounded-xl border border-emerald-50 bg-white p-4 shadow-sm">
          <span className="text-[10px] font-mono font-rose-800 font-bold text-rose-600 uppercase">Esgotados</span>
          <div className="text-lg font-bold text-rose-750 mt-2 font-mono">{outOfStockItems.length}</div>
          <p className="text-[10px] text-zinc-500 mt-1">Sem estoque.</p>
        </div>

        <div className="rounded-xl border border-emerald-50 bg-white p-4 shadow-sm">
          <span className="text-[10px] font-mono font-bold text-amber-600 uppercase">Abaixo do Mínimo</span>
          <div className="text-lg font-bold text-amber-700 mt-2 font-mono">{lowStockItems.length}</div>
          <p className="text-[10px] text-zinc-500 mt-1">Requer reposição.</p>
        </div>
      </div>

      {/* Search and filters filters for Stock */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border bg-zinc-50/50 p-4 rounded-xl mb-6">
        <div className="relative w-full max-w-sm">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
            <Search className="h-4 w-4" />
          </span>
          <input
            id="search-sku-input"
            type="text"
            placeholder="Filtrar por nome ou SKU..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-10 pr-4 text-xs font-medium focus:border-emerald-600 focus:outline-none transition"
          />
        </div>

        <label className="flex items-center space-x-2 text-xs font-semibold cursor-pointer text-zinc-700">
          <input
            type="checkbox"
            checked={showOnlyLowStock}
            onChange={(e) => setShowOnlyLowStock(e.target.checked)}
            className="h-4 w-4 rounded border-zinc-300 text-emerald-600 focus:ring-emerald-500"
          />
          <span>Exibir somente estoque crítico ou esgotado</span>
        </label>
      </div>

      {/* Main inventory table */}
      <div className="overflow-x-auto rounded-2xl border bg-white" id="inventory-table-container">
        <table className="min-w-full divide-y divide-zinc-100 text-left">
          <thead className="bg-[#fbfcfa] text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">
            <tr>
              <th className="px-6 py-4">Produto</th>
              <th className="px-6 py-4">SKU / Categoria</th>
              <th className="px-6 py-4">Estoque Atual</th>
              <th className="px-6 py-4 text-right">Compra (Custo)</th>
              <th className="px-6 py-4 text-right">Venda (Público)</th>
              <th className="px-6 py-4 text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100 text-xs text-zinc-800" id="inventory-table-body">
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                  Nenhum produto em estoque corresponde aos termos de pesquisa selecionados.
                </td>
              </tr>
            ) : (
              filtered.map((prod) => {
                const markup = ((prod.price - prod.costPrice) / prod.costPrice) * 100;
                const isCritical = prod.stock === 0 || prod.stock <= prod.minStock;

                return (
                  <tr key={prod.id} className="hover:bg-zinc-55/20 transition-all">
                    {/* Item title */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          referrerPolicy="no-referrer"
                          className="h-10 w-10 shrink-0 object-cover rounded-lg border bg-zinc-50"
                        />
                        <div>
                          <span className="font-bold text-zinc-900 block text-xs">{prod.name}</span>
                          <span className="text-[10px] text-zinc-400 line-clamp-1 max-w-xs">{prod.description}</span>
                        </div>
                      </div>
                    </td>

                    {/* Skull and category */}
                    <td className="px-6 py-4">
                      <span className="font-mono text-xs font-semibold block text-zinc-700">{prod.sku}</span>
                      <span className="text-[10px] text-zinc-400 uppercase tracking-wide">{prod.category}</span>
                    </td>

                    {/* Stock alerts */}
                    <td className="px-6 py-4">
                      <div className="flex items-center space-x-2">
                        <span className={`font-mono text-sm font-bold ${
                          prod.stock === 0 
                            ? 'text-rose-600' 
                            : prod.stock <= prod.minStock 
                            ? 'text-amber-600' 
                            : 'text-emerald-800'
                        }`}>
                          {prod.stock}
                        </span>
                        <span className="text-[10px] text-zinc-400">/ min {prod.minStock}</span>
                        
                        {isCritical && (
                          <div className={`h-2.5 w-2.5 rounded-full ${prod.stock === 0 ? 'bg-rose-600 animate-ping' : 'bg-amber-600'}`}></div>
                        )}
                      </div>
                    </td>

                    {/* Prices */}
                    <td className="px-6 py-4 text-right font-mono font-medium text-zinc-650">
                      R$ {prod.costPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </td>

                    <td className="px-6 py-4 text-right font-mono">
                      <span className="font-bold text-emerald-900 block">
                        R$ {prod.price.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </span>
                      <span className="text-[9px] text-emerald-600 font-semibold uppercase tracking-wider block">
                        +{markup.toFixed(0)}% Lucro
                      </span>
                    </td>

                    {/* Edit actions */}
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleOpenEditModal(prod)}
                          className="p-1 text-emerald-800 hover:bg-emerald-50 rounded"
                          title="Atualizar Informações"
                          id={`edit-btn-${prod.id}`}
                        >
                          <Edit3 className="h-4 w-4" />
                        </button>
                        {currentUser?.role === 'manager' && (
                          <button
                            onClick={() => handleDelete(prod.id, prod.name)}
                            className="p-1 text-rose-600 hover:bg-rose-50 rounded"
                            title="Remover Item"
                            id={`delete-btn-${prod.id}`}
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Dialog Modal form for create / update */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in" id="inventory-form-modal">
          <div className="w-full max-w-lg rounded-2xl bg-white border border-emerald-100 p-6 shadow-xl space-y-4">
            
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-sm font-bold text-zinc-950 font-sans uppercase">
                {editingId ? 'Editar Detalhes do SKU' : 'Cadastrar novo Item no Estoque'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-xs text-zinc-400 hover:text-zinc-600 font-bold"
              >
                Fechar
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label htmlFor="frm-name" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Nome do Produto</label>
                  <input
                    id="frm-name"
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2 px-3 text-xs focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label htmlFor="frm-sku" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">SKU do Integrador</label>
                  <input
                    id="frm-sku"
                    type="text"
                    required
                    value={sku}
                    onChange={(e) => setSku(e.target.value)}
                    className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2 px-3 text-xs focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label htmlFor="frm-cat" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Categoria</label>
                  <input
                    id="frm-cat"
                    type="text"
                    required
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2 px-3 text-xs focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label htmlFor="frm-cost" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Preço de Custo (R$)</label>
                  <input
                    id="frm-cost"
                    type="number"
                    step="0.01"
                    required
                    value={costPrice}
                    onChange={(e) => setCostPrice(+e.target.value)}
                    className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2 px-3 text-xs font-mono focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label htmlFor="frm-price" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Preço Venda Final (R$)</label>
                  <input
                    id="frm-price"
                    type="number"
                    step="0.01"
                    required
                    value={price}
                    onChange={(e) => setPrice(+e.target.value)}
                    className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2 px-3 text-xs font-mono focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label htmlFor="frm-stock" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Estoque Físico</label>
                  <input
                    id="frm-stock"
                    type="number"
                    required
                    value={stock}
                    onChange={(e) => setStock(+e.target.value)}
                    className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2 px-3 text-xs font-mono focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div>
                  <label htmlFor="frm-min" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Estoque Mínimo Alerta</label>
                  <input
                    id="frm-min"
                    type="number"
                    required
                    value={minStock}
                    onChange={(e) => setMinStock(+e.target.value)}
                    className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2 px-3 text-xs font-mono focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="col-span-2">
                  <label htmlFor="frm-img" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">URL da Imagem</label>
                  <input
                    id="frm-img"
                    type="text"
                    required
                    value={imageUrl}
                    onChange={(e) => setImageUrl(e.target.value)}
                    className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2 px-3 text-xs focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="col-span-2">
                  <label htmlFor="frm-exturl" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Link de Redirecionamento da Internet (Redireciona ao Clicar)</label>
                  <input
                    id="frm-exturl"
                    type="url"
                    placeholder="Ex: https://www.google.com"
                    value={externalUrl}
                    onChange={(e) => setExternalUrl(e.target.value)}
                    className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2 px-3 text-xs focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="col-span-2">
                  <label htmlFor="frm-desc" className="block text-[10px] font-bold text-zinc-500 uppercase tracking-wider mb-1">Descrição</label>
                  <textarea
                    id="frm-desc"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    rows={2}
                    className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2 px-3 text-xs focus:bg-white focus:outline-none focus:border-emerald-600"
                  />
                </div>
              </div>

              <div className="border-t pt-4 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-650 hover:bg-zinc-50"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 text-xs font-bold"
                  id="save-product-modal-submit-btn"
                >
                  {editingId ? 'Salvar Edições' : 'Criar SKU'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-zinc-900/50 p-4 backdrop-blur-xs" id="delete-confirmation-modal">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl border border-zinc-150">
            <h3 className="text-sm font-bold text-zinc-900">Remover do Estoque</h3>
            <p className="mt-2 text-xs text-zinc-500 leading-relaxed">
              Deseja realmente remover o produto <strong className="text-zinc-800">{productToDelete.name}</strong> da base de dados? Esta ação não pode ser desfeita.
            </p>
            <div className="mt-6 flex justify-end space-x-2">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-650 hover:bg-zinc-50"
                id="cancel-delete-modal-btn"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={confirmDelete}
                className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white px-4 py-2 text-xs font-bold"
                id="confirm-delete-modal-btn"
              >
                Excluir de Vez
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
