import React, { useState } from 'react';
import { TrendingUp, DollarSign, ArrowUpRight, BarChart3, PieChart, ShoppingBasket, Award, PackageCheck, AlertTriangle } from 'lucide-react';
import { Sale, Product } from '../types';
import { getSales, getProducts } from '../utils/database';

interface ReportsProps {
  onSetNotification: (msg: string, type: 'success' | 'error') => void;
  onNavigate: (view: string) => void;
}

export default function Reports({ onSetNotification, onNavigate }: ReportsProps) {
  const [selectedMonth, setSelectedMonth] = useState<string>('todos'); // 'todos', '0', '1', '2', '3', '4', '5' representing 2026 months

  const sales = getSales();
  const products = getProducts();

  const monthNames = [
    'Janeiro',
    'Fevereiro',
    'Março',
    'Abril',
    'Maio',
    'Junho',
    'Julho',
    'Agosto',
    'Setembro',
    'Outubro',
    'Novembro',
    'Dezembro'
  ];

  // Helper to parse months from timestamps
  const getSaleMonthInt = (isoString: string) => {
    return new Date(isoString).getMonth(); // returns 0-11
  };

  // Filter sales depending on selectedMonth
  const filteredSales = sales.filter((sale) => {
    if (selectedMonth === 'todos') return true;
    const m = getSaleMonthInt(sale.timestamp);
    return m.toString() === selectedMonth;
  });

  // Calculate stats
  const totalRevenue = filteredSales.reduce((acc, s) => acc + s.total, 0);
  const totalCosts = filteredSales.reduce((acc, s) => acc + s.costTotal, 0);
  const totalProfit = filteredSales.reduce((acc, s) => acc + s.profit, 0);
  const totalTransactionsCount = filteredSales.length;
  
  const averageTicket = totalTransactionsCount > 0 ? +(totalRevenue / totalTransactionsCount).toFixed(2) : 0;
  const markupPercent = totalCosts > 0 ? +(((totalRevenue - totalCosts) / totalCosts) * 100).toFixed(1) : 0;

  // Best Selling Products Aggregator
  const productQtyMap: { [prodName: string]: { qty: number; revenue: number } } = {};
  filteredSales.forEach((sale) => {
    sale.items.forEach((item) => {
      if (!productQtyMap[item.productName]) {
        productQtyMap[item.productName] = { qty: 0, revenue: 0 };
      }
      productQtyMap[item.productName].qty += item.quantity;
      productQtyMap[item.productName].revenue += item.price * item.quantity;
    });
  });

  const productLeaderboard = Object.entries(productQtyMap)
    .map(([name, stat]) => ({ name, qty: stat.qty, revenue: stat.revenue }))
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  // Group performance data for monthly chart (Jan to Jun 2026)
  const chartMonths = [0, 1, 2, 3, 4, 5]; // first half of 2026
  const monthlyAggregatedData = chartMonths.map((mIndex) => {
    const monthSales = sales.filter(s => getSaleMonthInt(s.timestamp) === mIndex);
    const rev = monthSales.reduce((acc, s) => acc + s.total, 0);
    const profit = monthSales.reduce((acc, s) => acc + s.profit, 0);
    return {
      monthLabel: monthNames[mIndex].slice(0, 3) + '/26',
      revenue: +rev.toFixed(0),
      profit: +profit.toFixed(0)
    };
  });

  // Maximum value for scaling the SVG chart bars proportionally
  const maxChartValue = Math.max(...monthlyAggregatedData.map(d => d.revenue), 1000);

  // Low stock alert summary
  const lowStockProducts = products.filter(p => p.stock <= p.minStock);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 font-sans" id="financial-reports-panel">
      {/* Top filter select bar */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b pb-6 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-zinc-950 font-sans tracking-tight">Performance Financeira do Negócio</h1>
          <p className="text-xs text-zinc-500 mt-1">
            Análise consolidada em tempo real da margem operacional, custos de aquisição faturados e faturamento consolidado.
          </p>
        </div>

        {/* Dropdown Selector */}
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-xs font-semibold text-zinc-650 uppercase">Período Fiscal:</span>
          <select
            id="period-selector"
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="rounded-xl border border-zinc-200 bg-white py-2 px-3 text-xs font-semibold text-emerald-850 focus:border-emerald-600 focus:outline-none transition-all shadow-sm"
          >
            <option value="todos">Todo o Ano (Acumulado 2026)</option>
            <option value="0">Janeiro 2026</option>
            <option value="1">Fevereiro 2026</option>
            <option value="2">Março 2026</option>
            <option value="3">Abril 2026</option>
            <option value="4">Maio 2026</option>
            <option value="5">Junho 2026 (Mês Atual)</option>
          </select>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8" id="financial-kpis-grid">
        {/* KPI 1 */}
        <div className="rounded-xl border border-emerald-50 bg-white p-5 shadow-sm space-y-1 relative overflow-hidden group hover:border-emerald-250 transition-all">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Faturamento Líquido</span>
          <div className="text-xl font-bold text-emerald-950 font-mono mt-1">
            R$ {totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-zinc-400">Total faturado no período selecionado.</p>
          <div className="absolute right-3 bottom-3 bg-emerald-50 h-8 w-8 rounded-full flex items-center justify-center text-emerald-700">
            <DollarSign className="h-4 w-4" />
          </div>
        </div>

        {/* KPI 2 */}
        <div className="rounded-xl border border-emerald-50 bg-white p-5 shadow-sm space-y-1 relative overflow-hidden group hover:border-emerald-250 transition-all">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Margem Lucro Média</span>
          <div className="text-xl font-bold text-emerald-700 font-mono mt-1">
            {markupPercent}%
          </div>
          <p className="text-[10px] text-zinc-400">Mark-up ponderado por custos.</p>
          <div className="absolute right-3 bottom-3 bg-emerald-50 h-8 w-8 rounded-full flex items-center justify-center text-emerald-750">
            <TrendingUp className="h-4 w-4" />
          </div>
        </div>

        {/* KPI 3 */}
        <div className="rounded-xl border border-emerald-50 bg-white p-5 shadow-sm space-y-1 relative overflow-hidden group hover:border-emerald-250 transition-all">
          <span className="text-[10px] font-mono font-bold text-zinc-500 uppercase tracking-widest">Lucro Líquido Real</span>
          <div className="text-xl font-bold text-emerald-950 font-mono mt-1">
            R$ {totalProfit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-zinc-500 font-medium">Margem líquida de lucro gerada.</p>
          <div className="absolute right-3 bottom-3 bg-emerald-600 h-8 w-8 rounded-full flex items-center justify-center text-white">
            <ArrowUpRight className="h-4 w-4" />
          </div>
        </div>

        {/* KPI 4 */}
        <div className="rounded-xl border border-emerald-50 bg-white p-5 shadow-sm space-y-1 relative overflow-hidden group hover:border-emerald-250 transition-all">
          <span className="text-[10px] font-mono font-bold text-zinc-400 uppercase tracking-widest">Ticket Médio / Venda</span>
          <div className="text-xl font-bold text-zinc-900 font-mono mt-1">
            R$ {averageTicket.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <p className="text-[10px] text-zinc-400">{totalTransactionsCount} transações registradas.</p>
          <div className="absolute right-3 bottom-3 bg-zinc-50 h-8 w-8 rounded-full flex items-center justify-center text-zinc-650">
            <ShoppingBasket className="h-4 w-4" />
          </div>
        </div>
      </div>

      {/* Dynamic Graph and Leaderboards */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-8" id="financial-graphs-layout">
        
        {/* Graph Render Box (Custom SVG pure React) */}
        <div className="lg:col-span-8 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm flex flex-col justify-between" id="monthly-chart-box">
          <div className="flex justify-between items-center border-b pb-4 mb-6">
            <div>
              <span className="text-[10px] font-bold text-emerald-950 font-mono uppercase tracking-widest flex items-center gap-1.5">
                <BarChart3 className="h-4 w-4 text-emerald-700" />
                Desempenho Semestral (R$ x Mês) - Ano de 2026
              </span>
              <p className="text-[10px] text-zinc-400 mt-1">Comparativo de faturamento bruto vs. lucro líquido real gerado.</p>
            </div>
            
            <div className="flex items-center space-x-4 text-[10px] font-semibold text-zinc-600">
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 bg-emerald-600 rounded"></span>
                Faturamento
              </span>
              <span className="flex items-center gap-1">
                <span className="h-3 w-3 bg-emerald-100 border border-emerald-400 rounded"></span>
                Lucro Real
              </span>
            </div>
          </div>

          {/* SVG Custom Responsive Graph Container */}
          <div className="relative w-full h-64 md:h-72 mt-2">
            <div className="absolute inset-0 flex flex-col justify-between pointer-events-none text-[9px] font-mono text-zinc-400 font-medium">
              <div className="border-b w-full pb-0.5">R$ {maxChartValue.toLocaleString('pt-BR')}</div>
              <div className="border-b w-full pb-0.5">R$ {(maxChartValue * 0.75).toLocaleString('pt-BR')}</div>
              <div className="border-b w-full pb-0.5">R$ {(maxChartValue * 0.5).toLocaleString('pt-BR')}</div>
              <div className="border-b w-full pb-0.5">R$ {(maxChartValue * 0.25).toLocaleString('pt-BR')}</div>
              <div className="border-b w-full">R$ 0</div>
            </div>

            {/* Vertical Bars container */}
            <div className="absolute inset-0 pt-6 flex justify-around items-end">
              {monthlyAggregatedData.map((d, index) => {
                // Calculate height ratios safely
                const revHeightPercent = (d.revenue / maxChartValue) * 100;
                const profitHeightPercent = (d.profit / maxChartValue) * 100;

                return (
                  <div key={index} className="flex flex-col items-center group relative w-16 text-center">
                    {/* Tooltip on Hover */}
                    <div className="absolute -top-12 z-20 hidden group-hover:block bg-zinc-900 text-white rounded px-2.5 py-1 text-[9px] font-mono leading-none shadow shadow-emerald-500/10 pointer-events-none">
                      <span className="block text-emerald-400 font-bold">Fat: R$ {d.revenue}</span>
                      <span className="block text-white mt-0.5">Luc: R$ {d.profit}</span>
                    </div>

                    {/* Both bars container */}
                    <div className="flex items-end space-x-1 h-44 w-full justify-center">
                      <div 
                        style={{ height: `${Math.max(revHeightPercent, 2)}%` }}
                        className="w-4 bg-emerald-600 rounded-t transform transition-all duration-300 group-hover:scale-x-110"
                      ></div>
                      <div 
                        style={{ height: `${Math.max(profitHeightPercent, 2)}%` }}
                        className="w-4 bg-emerald-100 border border-emerald-400 rounded-t transform transition-all duration-300 group-hover:bg-emerald-250"
                      ></div>
                    </div>

                    <span className="text-[10px] font-bold text-zinc-650 font-mono mt-2">{d.monthLabel}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Leadboard Panel Best Selling */}
        <div className="lg:col-span-4 rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm flex flex-col justify-between" id="financial-leaderboards-panel">
          <div>
            <span className="text-[10px] font-bold text-emerald-950 font-mono uppercase tracking-widest flex items-center gap-1.5 mb-1">
              <Award className="h-4 w-4 text-emerald-700" />
              TOP 5 - Campeões de Venda
            </span>
            <p className="text-[10px] text-zinc-400 mb-5">Produtos mais procurados ordenados por unidades vendidas.</p>

            <div className="space-y-3.5">
              {productLeaderboard.length === 0 ? (
                <p className="text-xs text-zinc-400 py-6 text-center">Nenhuma venda registrada no período filtrado.</p>
              ) : (
                productLeaderboard.map((prod, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <div className="flex items-center space-x-2.5 min-w-0 flex-1 pr-2">
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-50 text-[10px] font-bold font-mono text-emerald-800">
                        {idx + 1}
                      </div>
                      <span className="font-semibold text-zinc-800 truncate" title={prod.name}>
                        {prod.name}
                      </span>
                    </div>
                    <div className="text-right font-mono text-xs">
                      <strong className="text-zinc-900 block font-bold">{prod.qty} un.</strong>
                      <span className="text-[9px] text-zinc-400 block font-normal">
                        R$ {prod.revenue.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="border-t pt-4 mt-6">
            <span className="text-[9px] text-zinc-400 leading-tight block">Faturamento e desempenho atualizados instantaneamente conforme checkouts online sandbox.</span>
          </div>
        </div>
      </div>

      {/* Operational Alignment - Alerts block */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6" id="reports-bottom-alignment-row">
        
        {/* Restock Alerts List */}
        <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
          <span className="text-[10px] font-bold text-emerald-950 font-mono uppercase tracking-widest flex items-center gap-1.5 mb-1">
            <AlertTriangle className="h-4.5 w-4.5 text-amber-600" />
            Alerta de Cobertura Física (Operacional)
          </span>
          <p className="text-[10px] text-zinc-400 mb-4">SKUs críticos que exigem compra de urgência para reposição.</p>
          
          <div className="space-y-2 max-h-44 overflow-y-auto pr-1">
            {lowStockProducts.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-emerald-800 bg-emerald-50 border border-emerald-100 p-3 rounded-lg">
                <PackageCheck className="h-4 w-4 shrink-0" />
                <span>Todos os SKUs estão acima do limite mínimo de segurança operacional!</span>
              </div>
            ) : (
              lowStockProducts.map((p) => (
                <div key={p.id} className="flex justify-between items-center text-xs p-2 rounded bg-zinc-50 border border-zinc-100 hover:bg-zinc-100/55 transition-all">
                  <div className="min-w-0 pr-2">
                    <span className="font-bold text-zinc-900 block truncate">{p.name}</span>
                    <span className="text-[9px] text-zinc-400 font-mono block">SKU: {p.sku} | Mínimo indicado: {p.minStock} un.</span>
                  </div>
                  <div className="text-right">
                    <span className={`font-mono font-bold text-sm block ${p.stock === 0 ? 'text-rose-600' : 'text-amber-600'}`}>
                      {p.stock === 0 ? 'Esgotado' : `${p.stock} un.`}
                    </span>
                    <button
                      onClick={() => onNavigate('inventory')}
                      className="text-[9px] font-bold text-emerald-800 hover:underline block"
                    >
                      Repor Estoque
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Sales channel review */}
        <div className="rounded-2xl border bg-emerald-50/15 p-6 shadow-sm flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-bold text-emerald-950 font-mono uppercase tracking-widest block mb-1">
              📈 Metas de Conversão do Semestre
            </span>
            <p className="text-[10px] text-zinc-500 mb-4">Métricas consolidadas de vendas agregadas pelo time.</p>

            <div className="space-y-3 font-sans text-xs">
              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-zinc-650">Meta de Faturamento Mensal (Junho)</span>
                  <span className="text-emerald-950 font-mono">60% Concluída</span>
                </div>
                <div className="h-2 w-full bg-zinc-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: '60%' }}></div>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between font-semibold">
                  <span className="text-zinc-650">Taxa de Conversão de Clientes</span>
                  <span className="text-emerald-950 font-mono">12.5% vs Meta (8.0%)</span>
                </div>
                <div className="h-2 w-full bg-zinc-200 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-600 rounded-full" style={{ width: '80%' }}></div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-4 pt-3 border-t">
            <span className="text-[10px] text-zinc-400">Canal de auditoria e conformidade fiscal ativo. VERT S.A ERP.</span>
          </div>
        </div>
      </div>
    </div>
  );
}
