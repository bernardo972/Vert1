import React, { useState, useEffect } from 'react';
import { FileSpreadsheet, Search, Printer, AlertTriangle, Check, XCircle, RefreshCw, Layers } from 'lucide-react';
import { Invoice, User } from '../types';
import { getInvoices, cancelInvoice, subscribeToDatabase } from '../utils/database';

interface InvoicesProps {
  currentUser: User | null;
  onSetNotification: (msg: string, type: 'success' | 'error') => void;
  // If redirected from storefront checkout to auto-open specific invoice
  initialActiveInvoiceId?: string | null;
  onClearInitialActiveId?: () => void;
}

export default function Invoices({
  currentUser,
  onSetNotification,
  initialActiveInvoiceId,
  onClearInitialActiveId,
}: InvoicesProps) {
  const [invoices, setInvoices] = useState<Invoice[]>(getInvoices());
  const [search, setSearch] = useState('');
  const [activeInvoice, setActiveInvoice] = useState<Invoice | null>(() => {
    if (initialActiveInvoiceId) {
      const found = getInvoices().find(i => i.id === initialActiveInvoiceId);
      return found || null;
    }
    return null;
  });

  const handleRefresh = () => {
    setInvoices(getInvoices());
    if (activeInvoice) {
      const refreshedActive = getInvoices().find(i => i.id === activeInvoice.id);
      if (refreshedActive) {
        setActiveInvoice(refreshedActive);
      }
    }
  };

  useEffect(() => {
    handleRefresh();
    const unsubscribe = subscribeToDatabase(() => {
      handleRefresh();
    });
    return unsubscribe;
  }, []);

  const handleCancel = (invId: string) => {
    if (confirm(`Atenção: Deseja realmente CANCELAR a nota fiscal ${invId}? Esta ação é registrada na Receita Federal de Teste e não pode ser desfeita.`)) {
      cancelInvoice(invId);
      onSetNotification(`Nota Fiscal ${invId} cancelada com sucesso junto à Sefaz.`, 'success');
      handleRefresh();
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const filteredInvoices = invoices.filter((i) => {
    return (
      i.id.toLowerCase().includes(search.toLowerCase()) ||
      i.receiverName.toLowerCase().includes(search.toLowerCase()) ||
      i.accessKey.includes(search)
    );
  });

  // Calculate sum of taxes
  const totalTaxesSum = invoices
    .filter(i => i.status === 'Emitida')
    .reduce((acc, current) => acc + current.taxes.totalTaxes, 0);

  const totalInvoicedSales = invoices
    .filter(i => i.status === 'Emitida')
    .reduce((acc, current) => acc + current.total, 0);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8" id="invoices-flow-panel">
      {activeInvoice ? (
        /* Detailed Official DANFE - NF-e View */
        <div className="space-y-6" id="danfe-layout-view">
          <div className="flex justify-between items-center bg-zinc-50 border p-4 rounded-xl print:hidden">
            <button
              onClick={() => {
                setActiveInvoice(null);
                if (onClearInitialActiveId) onClearInitialActiveId();
              }}
              className="text-xs font-bold text-zinc-600 hover:text-emerald-800 transition"
              id="back-to-invoice-list"
            >
              ← Voltar para a Base de Dados
            </button>
            <div className="flex gap-2">
              <button
                onClick={handlePrint}
                className="flex items-center gap-1.5 rounded-xl bg-zinc-800 px-4 py-2 text-xs font-bold text-white hover:bg-black transition"
                id="print-danfe-button"
              >
                <Printer className="h-4 w-4" />
                <span>Imprimir / Salvar PDF</span>
              </button>
              {activeInvoice.status === 'Emitida' && (
                <button
                  onClick={() => handleCancel(activeInvoice.id)}
                  className="rounded-xl border border-rose-200 bg-rose-50 text-rose-750 px-4 py-2 text-xs font-bold hover:bg-rose-100 transition"
                  id="cancel-active-invoice"
                >
                  Cancelar Nota Fiscal
                </button>
              )}
            </div>
          </div>

          {/* DANFE layout block (Styled for standard physical page aspect) */}
          <div className="relative border-4 border-black bg-white p-6 md:p-8 font-serif leading-tight max-w-4xl mx-auto text-[11px] text-zinc-950 shadow-md print:shadow-none print:border-2" id="printable-danfe-card">
            
            {/* Watermark cancel stamp if canceled */}
            {activeInvoice.status === 'Cancelada' && (
              <div className="absolute inset-0 z-10 flex items-center justify-center pointer-events-none select-none">
                <div className="transform -rotate-12 border-8 border-rose-600/30 rounded-2xl px-12 py-6 text-center">
                  <span className="block text-4xl md:text-5xl font-black tracking-widest text-rose-600/30 uppercase">
                    Homologação Cancelada
                  </span>
                  <span className="block text-sm font-semibold tracking-wider text-rose-600/30 uppercase mt-2">
                    Sem Valor Fiscal - Sefaz Rejeitou
                  </span>
                </div>
              </div>
            )}

            {/* DANFE Header Section */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-y-2 border-b-2 border-black pb-4">
              <div className="md:col-span-5 pr-4 border-r-2 md:border-black/50">
                <span className="block text-sm font-black font-sans uppercase">VERT TECH COMÉRCIO LTDA</span>
                <span className="block text-[10px] text-zinc-600 font-sans mt-1">Av. Brigadeiro Faria Lima, 2026 - Pinheiros</span>
                <span className="block text-[10px] text-zinc-650 font-sans">São Paulo - SP | CEP: 05426-100</span>
                <span className="block text-[10px] text-zinc-650 font-sans">CNPJ: 11.111.222/0001-33 | I.E: 149.281.392.110</span>
              </div>
              <div className="md:col-span-3 text-center border-r-2 md:border-black/50 px-2 flex flex-col justify-center">
                <span className="block text-sm font-black uppercase font-sans">DANFE</span>
                <span className="block text-[9px] text-zinc-500 font-sans leading-none">Documento Auxiliar da Nota Fiscal Eletrônica</span>
                <div className="mt-2 text-left pl-3 text-[10px] font-sans">
                  <span className="block leading-none">0 - ENTRADA</span>
                  <span className="block font-bold leading-none">1 - SAÍDA: <span className="font-bold">1</span></span>
                  <span className="block mt-1">Nº: <strong className="font-bold text-zinc-950 font-mono">{activeInvoice.id.replace('NFE-', '')}</strong></span>
                  <span className="block">SÉRIE: 1</span>
                </div>
              </div>
              <div className="md:col-span-4 pl-4 font-sans flex flex-col justify-between">
                <div>
                  <span className="block text-[9px] font-bold text-zinc-400 uppercase tracking-wider">Chave de Acesso Sefaz-SP</span>
                  <span className="block font-mono text-[9px] font-bold text-zinc-800 break-all select-all">{activeInvoice.accessKey}</span>
                </div>
                <div className="border-t pt-1.5 mt-2">
                  <span className="block text-[9px] text-zinc-400 uppercase">Protocolo de Autorização</span>
                  <span className="block font-sans text-[10px] font-bold text-zinc-800">
                    135260029312839 - {new Date(activeInvoice.timestamp).toLocaleDateString('pt-BR')} {new Date(activeInvoice.timestamp).toLocaleTimeString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>

            {/* Operations Nature */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-y-2 border-b-2 border-black py-2.5 font-sans">
              <div className="md:col-span-8">
                <span className="block text-[9px] text-zinc-400 uppercase font-bold">Natureza da Operação</span>
                <span className="font-bold text-zinc-900 uppercase">Venda de Mercadorias do Estoque</span>
              </div>
              <div className="md:col-span-4">
                <span className="block text-[9px] text-zinc-400 uppercase font-bold text-right">Insc. Est. do Substituto Tributário</span>
                <span className="block text-right font-semibold text-zinc-700">Isento</span>
              </div>
            </div>

            {/* Receiver / Client Section */}
            <div className="border-b-2 border-black py-3 space-y-3 font-sans">
              <span className="block text-[10px] font-black uppercase tracking-wider">Destinatário / Remetente</span>
              <div className="grid grid-cols-1 md:grid-cols-12 gap-y-3">
                <div className="md:col-span-8">
                  <span className="block text-[9px] text-zinc-400 uppercase">Nome / Razão Social:</span>
                  <span className="font-bold text-zinc-900 text-xs uppercase">{activeInvoice.receiverName}</span>
                </div>
                <div className="md:col-span-4">
                  <span className="block text-[9px] text-zinc-400 uppercase">CPF / CNPJ:</span>
                  <span className="font-mono font-bold text-zinc-900 text-xs">{activeInvoice.receiverCPF_CNPJ}</span>
                </div>
                <div className="md:col-span-8">
                  <span className="block text-[9px] text-zinc-400 uppercase">Endereço de Faturamento / Logradouro:</span>
                  <span className="font-medium text-zinc-700">Logradouro Cadastrado pelo Cliente no Checkout Online</span>
                </div>
                <div className="md:col-span-4">
                  <span className="block text-[9px] text-zinc-400 uppercase">Data da Emissão Fiscal:</span>
                  <span className="font-bold text-zinc-800">
                    {new Date(activeInvoice.timestamp).toLocaleDateString('pt-BR')}
                  </span>
                </div>
              </div>
            </div>

            {/* Calculated Taxes Details */}
            <div className="border-b-2 border-black py-3 font-sans" id="calculated-taxes-invoice-grid">
              <span className="block text-[10px] font-black uppercase tracking-wider mb-2">Cálculo do Imposto Tributado</span>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3 bg-zinc-50 border p-3 rounded-lg font-mono">
                <div>
                  <span className="block text-[8px] text-zinc-400 uppercase font-sans">Base ICMS</span>
                  <span className="text-[11px] font-bold">R$ {activeInvoice.subtotal.toFixed(2)}</span>
                </div>
                <div>
                  <span className="block text-[8px] text-zinc-400 uppercase font-sans">Valor do ICMS (18%)</span>
                  <span className="text-[11px] font-bold text-emerald-800">R$ {activeInvoice.taxes.icms.toFixed(2)}</span>
                </div>
                <div>
                  <span className="block text-[8px] text-zinc-400 uppercase font-sans">Valor do IPI (5%)</span>
                  <span className="text-[11px] font-bold text-emerald-800">R$ {activeInvoice.taxes.ipi.toFixed(2)}</span>
                </div>
                <div>
                  <span className="block text-[8px] text-zinc-400 uppercase font-sans">PIS / COFINS</span>
                  <span className="text-[11px] font-bold text-emerald-800">R$ {(activeInvoice.taxes.pis + activeInvoice.taxes.cofins).toFixed(2)}</span>
                </div>
                <div className="col-span-2 md:col-span-1 border-l-2 pl-3 md:border-emerald-300">
                  <span className="block text-[8px] text-zinc-400 uppercase font-sans font-bold">Impostos Totais</span>
                  <span className="text-[11px] font-black text-emerald-950 font-mono">
                    R$ {activeInvoice.taxes.totalTaxes.toFixed(2)}
                  </span>
                </div>
              </div>
            </div>

            {/* List of checkout items */}
            <div className="py-4 font-sans" id="invoice-items-table-block">
              <span className="block text-[10px] font-black uppercase tracking-wider mb-2.5">Dados dos Produtos / Serviços Faturados</span>
              <div className="overflow-hidden border border-zinc-200 rounded-lg">
                <table className="min-w-full text-left font-sans text-[10px]">
                  <thead className="bg-[#fbfcfa] font-bold uppercase tracking-wider border-b">
                    <tr>
                      <th className="px-4 py-2">CÓD / SKU</th>
                      <th className="px-4 py-2">DESCRIÇÃO DOS PRODUTOS</th>
                      <th className="px-4 py-2 text-center">QTD</th>
                      <th className="px-4 py-2 text-right">VALOR UNIT</th>
                      <th className="px-4 py-2 text-right">VALOR TOTAL</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y text-zinc-800 font-sans">
                    {activeInvoice.items.map((it, idx) => (
                      <tr key={idx}>
                        <td className="px-4 py-2 font-mono text-[9px] text-zinc-500">{it.sku}</td>
                        <td className="px-4 py-2 font-bold text-zinc-950 uppercase">{it.name}</td>
                        <td className="px-4 py-2 text-center font-bold font-mono">{it.quantity}</td>
                        <td className="px-4 py-2 text-right font-mono">R$ {it.price.toFixed(2)}</td>
                        <td className="px-4 py-2 text-right font-mono font-bold">R$ {it.total.toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Bottom aggregate section total */}
            <div className="border-t-2 border-black pt-4 grid grid-cols-1 md:grid-cols-12 gap-4 font-sans">
              <div className="md:col-span-8 flex flex-col justify-end text-[9px] text-zinc-500">
                <span className="block">Inscrito no Regime Geral do Tributo SIMPLES Nacional.</span>
                <span className="block">ICMS recolhido conforme alíquota interestadual do integrador VERT.</span>
                <span className="block mt-1 text-zinc-400 font-mono">XML homologado na rede sandbox - Chave {activeInvoice.id}</span>
              </div>
              <div className="md:col-span-4 bg-emerald-50/50 p-4 border border-emerald-100 rounded-xl flex flex-col justify-center items-end text-right">
                <span className="text-[10px] font-semibold text-emerald-850 uppercase tracking-widest leading-none">Valor Total da Nota</span>
                <strong className="text-xl font-black text-emerald-950 font-mono mt-1">
                  R$ {activeInvoice.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </strong>
                <span className="text-[9px] text-zinc-400 mt-1 leading-none font-mono">Total de impostos inclusos: R$ {activeInvoice.taxes.totalTaxes.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Invoices log list */
        <div className="space-y-6" id="invoices-list-view">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-6">
            <div>
              <h1 className="text-2xl font-bold text-zinc-950 font-sans">Controle de Emissão e Notas Fiscais (NF-e)</h1>
              <p className="text-xs text-zinc-500 mt-1">
                Todas as vendas autorizadas geram uma Nota Fiscal Eletrônica instantânea com as cargas tributárias retidas.
              </p>
            </div>

            <button
              onClick={handleRefresh}
              className="flex items-center gap-1.5 self-start rounded-xl border border-zinc-200 bg-white px-3.5 py-2 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 hover:border-emerald-300 transition"
              id="refresh-invoice-btn"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Atualizar Notas</span>
            </button>
          </div>

          {/* Aggregations cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
            <div className="rounded-xl border border-emerald-50 bg-white p-5 shadow-sm">
              <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Faturamento Faturado (NF-e Ativas)</span>
              <div className="text-xl font-bold text-emerald-950 mt-2 font-mono">
                R$ {totalInvoicedSales.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[10px] text-zinc-500 mt-1.5 flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-600"></span>
                Notas ativas homologadas na Sefaz.
              </p>
            </div>

            <div className="rounded-xl border border-emerald-50 bg-white p-5 shadow-sm">
              <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Impostos Retidos Declarados</span>
              <div className="text-xl font-bold text-emerald-700 mt-2 font-mono">
                R$ {totalTaxesSum.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
              <p className="text-[10px] text-zinc-500 mt-1.5 flex items-center gap-1.5">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-500"></span>
                ICMS + IPI + PIS + COFINS gerados.
              </p>
            </div>

            <div className="rounded-xl border border-emerald-50 bg-white p-5 shadow-sm">
              <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Índice Tributário Efetivo</span>
              <div className="text-xl font-bold text-zinc-950 mt-2 font-mono">
                32.25 %
              </div>
              <p className="text-[10px] text-zinc-500 mt-1.5">Carga aproximada calculada sob o faturamento.</p>
            </div>
          </div>

          {/* Search bar filtrator */}
          <div className="relative w-full max-w-sm border bg-zinc-50/50 p-3 rounded-xl mb-6">
            <span className="absolute inset-y-0 left-6 flex items-center text-zinc-400">
              <Search className="h-4 w-4" />
            </span>
            <input
              id="search-invoice-input"
              type="text"
              placeholder="Buscar nota por ID, cliente ou chave..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-xl border border-zinc-200 bg-white py-2 pl-10 pr-4 text-xs focus:border-emerald-600 focus:outline-none"
            />
          </div>

          {/* Table list log */}
          <div className="overflow-x-auto rounded-2xl border bg-white" id="invoices-table-container">
            <table className="min-w-full divide-y divide-zinc-100 text-left">
              <thead className="bg-[#fbfcfa] text-xs font-bold text-zinc-500 uppercase tracking-widest font-mono">
                <tr>
                  <th className="px-6 py-4">Nota Fiscal ID</th>
                  <th className="px-6 py-4">Chave de Acesso</th>
                  <th className="px-6 py-4">Destinatário</th>
                  <th className="px-6 py-4 text-center">Status Sefaz</th>
                  <th className="px-6 py-4 text-right">Valor Líquido</th>
                  <th className="px-6 py-4 text-center">Visualização / DANFE</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 text-xs text-zinc-700" id="invoices-table-body">
                {filteredInvoices.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-zinc-400">
                      Nenhuma Nota Fiscal Eletrônica (NF-e) encontrada na base de dados do sandbox.
                    </td>
                  </tr>
                ) : (
                  filteredInvoices.map((inv) => (
                    <tr key={inv.id} className="hover:bg-zinc-55/10 transition-all">
                      <td className="px-6 py-4">
                        <span className="font-bold text-zinc-900 block font-mono">{inv.id}</span>
                        <span className="text-[10px] text-zinc-400">
                          {new Date(inv.timestamp).toLocaleString('pt-BR')}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="font-mono text-[10px] text-zinc-500 block max-w-xs truncate" title={inv.accessKey}>
                          {inv.accessKey}
                        </span>
                      </td>

                      <td className="px-6 py-4 font-semibold text-zinc-900 uppercase">
                        {inv.receiverName}
                      </td>

                      <td className="px-6 py-4 text-center">
                        {inv.status === 'Emitida' ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 border border-emerald-250 px-3 py-1 text-[10px] font-semibold text-emerald-850">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-600"></span>
                            Homologada (Ativa)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 border border-rose-250 px-3 py-1 text-[10px] font-semibold text-rose-750">
                            <span className="h-1.5 w-1.5 rounded-full bg-rose-600"></span>
                            Cancelamento Registrado
                          </span>
                        )}
                      </td>

                      <td className="px-6 py-4 text-right font-bold font-mono text-emerald-950 text-sm">
                        R$ {inv.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                      </td>

                      <td className="px-6 py-4 text-center">
                        <div className="flex items-center justify-center gap-3">
                          <button
                            onClick={() => setActiveInvoice(inv)}
                            className="bg-emerald-50 hover:bg-emerald-100 text-emerald-850 border border-emerald-200 px-3 py-1.5 rounded-lg font-bold text-xs"
                            title="Gerar DANFE"
                            id={`btn-danfe-${inv.id}`}
                          >
                            DANFE / Impressão
                          </button>
                          
                          {inv.status === 'Emitida' && (
                            <button
                              onClick={() => handleCancel(inv.id)}
                              className="text-xs font-bold text-rose-600 hover:text-rose-800"
                              title="Solicitar Cancelamento Sefaz"
                              id={`btn-cancel-nfe-${inv.id}`}
                            >
                              Cancelar
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
