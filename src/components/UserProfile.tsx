import React, { useState } from 'react';
import { User, ShieldCheck, KeyRound, Copy, Check, ShoppingBag, FileText, Lock, ShieldAlert } from 'lucide-react';
import { User as UserType, Sale, Invoice } from '../types';
import { updateUserProfile, getSales } from '../utils/database';

interface UserProfileProps {
  currentUser: UserType | null;
  onSetNotification: (msg: string, type: 'success' | 'error') => void;
  onViewInvoice: (invoiceId: string) => void;
}

export default function UserProfile({ currentUser, onSetNotification, onViewInvoice }: UserProfileProps) {
  // 2FA setups state
  const [isSettingUpMfa, setIsSettingUpMfa] = useState(false);
  const [mfaInputCode, setMfaInputCode] = useState('');
  const [copiedKey, setCopiedKey] = useState(false);

  // Profile data update state
  const [updatedName, setUpdatedName] = useState(currentUser?.name || '');

  if (!currentUser) {
    return (
      <div className="mx-auto max-w-md px-4 py-12 text-center text-zinc-500">
        Nenhum usuário logado. Por favor, acesse a página de Login.
      </div>
    );
  }

  // Read associated customer purchases
  const allSales = getSales();
  const customerSales = allSales.filter((s) => s.customerEmail.toLowerCase() === currentUser.email.toLowerCase());

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!updatedName) {
      onSetNotification('O nome não pode ficar em branco.', 'error');
      return;
    }
    const updatedUser: UserType = {
      ...currentUser,
      name: updatedName
    };
    updateUserProfile(updatedUser);
    onSetNotification('Cadastro atualizado com sucesso!', 'success');
  };

  const handleCopyKey = () => {
    navigator.clipboard.writeText(currentUser.twoFactorSecret || 'VERT-MFA-SETUP-KEY-2026');
    setCopiedKey(true);
    onSetNotification('Chave secreta copiada para a área de transferência.', 'success');
    setTimeout(() => setCopiedKey(false), 2000);
  };

  const handleActivateMfa = (e: React.FormEvent) => {
    e.preventDefault();
    // Simulate check. Any 6-digit numeric code validates. Let's suggest 123456
    const isValid = mfaInputCode.trim() === '123456' || (mfaInputCode.length === 6 && !isNaN(Number(mfaInputCode)));

    if (isValid) {
      const updatedUser: UserType = {
        ...currentUser,
        isTwoFactorEnabled: true,
        twoFactorSecret: currentUser.twoFactorSecret || `VERT-MFA-${currentUser.name.toUpperCase().replace(/\s/g, '')}-2026`
      };
      updateUserProfile(updatedUser);
      onSetNotification('Autenticação de Dois Fatores (2FA) ATIVADA com sucesso!', 'success');
      setIsSettingUpMfa(false);
      setMfaInputCode('');
    } else {
      onSetNotification('Código 2FA incorreto para homologação. Tente usar "123456" para testar.', 'error');
    }
  };

  const handleDeactivateMfa = () => {
    if (confirm('Atenção: Ao desativar o 2FA, sua conta voltará a ser protegida apenas pela sua senha estática. Tem certeza?')) {
      const updatedUser: UserType = {
        ...currentUser,
        isTwoFactorEnabled: false
      };
      updateUserProfile(updatedUser);
      onSetNotification('A autenticação em duas etapas foi suspensa.', 'success');
    }
  };

  const handleStartSetupMfa = () => {
    setIsSettingUpMfa(true);
    setMfaInputCode('');
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 font-sans" id="user-profile-layout">
      <div className="border-b pb-6 mb-8">
        <h1 className="text-2xl font-bold text-zinc-950 font-sans">Minha Conta & Central de Segurança</h1>
        <p className="text-xs text-zinc-500 mt-1">
          Gerencie suas preferências de cadastro corporativo e habilite a proteção de dados em duas etapas (2FA).
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Profile Details (Left half) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm">
            <h2 className="text-xs font-bold text-emerald-950 uppercase tracking-widest border-b pb-2 mb-4">
              Informações Cadastrais
            </h2>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">E-mail de Acesso (Imutável)</label>
                <div className="text-xs font-semibold text-zinc-700 bg-zinc-50 p-2.5 rounded-xl border border-dashed font-mono">
                  {currentUser.email}
                </div>
              </div>

              <div>
                <label htmlFor="prof-name" className="block text-[10px] font-bold text-zinc-400 uppercase tracking-wider mb-1">Nome Completo</label>
                <input
                  id="prof-name"
                  type="text"
                  required
                  value={updatedName}
                  onChange={(e) => setUpdatedName(e.target.value)}
                  className="block w-full rounded-xl border border-zinc-200 py-2 px-3 text-xs focus:border-emerald-600 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full rounded-xl bg-emerald-800 hover:bg-emerald-900 text-white font-bold py-2.5 text-xs transition"
                id="update-profile-submit"
              >
                Salvar Alterações de Cadastro
              </button>
            </form>
          </div>
        </div>

        {/* Security & Multi-Factor Setup (Right half) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Two-Factor Authentication Console Section */}
          <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm" id="two-factor-mfa-console">
            <h2 className="text-xs font-bold text-emerald-950 uppercase tracking-widest border-b pb-2 mb-4 flex items-center gap-1.5_">
              <Lock className="h-4 w-4 text-emerald-700" />
              Autenticação de Dois Fatores (2FA) da VERT
            </h2>

            {currentUser.isTwoFactorEnabled ? (
              /* If 2FA is active */
              <div className="space-y-4">
                <div className="bg-emerald-50/50 border-2 border-emerald-500/25 p-5 rounded-2xl flex items-start space-x-3">
                  <ShieldCheck className="h-6 w-6 text-emerald-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-emerald-950">
                    <span className="font-bold block uppercase text-emerald-900 tracking-wide">Conta Totalmente Protegida (2FA Ativo)</span>
                    <p className="mt-1 leading-relaxed text-zinc-650">
                      Sempre que tentar realizar login com e-mail e senha, avaliaremos um token dinâmico de 6 dígitos gerado no seu dispositivo móvel associado, assegurando o compliance corporativo da VERT para faturamento.
                    </p>
                  </div>
                </div>

                <div className="flex justify-between items-center bg-zinc-50 border p-4 rounded-xl">
                  <div className="text-xs">
                    <span className="block font-bold">Chave de Auditoria Ativa:</span>
                    <span className="font-mono text-zinc-500">{currentUser.twoFactorSecret || 'VERT-MFA'}</span>
                  </div>
                  <button
                    onClick={handleDeactivateMfa}
                    className="text-xs font-bold text-rose-600 hover:text-rose-800 hover:underline"
                    id="deactivate-2fa-button"
                  >
                    Desativar 2FA
                  </button>
                </div>
              </div>
            ) : isSettingUpMfa ? (
              /* If in Wizard Setup screen */
              <form onSubmit={handleActivateMfa} className="space-y-4">
                <div className="bg-zinc-50 border p-4 rounded-xl text-xs space-y-4">
                  <h3 className="font-black text-zinc-900 uppercase">Instruções de Configuração no Autenticador</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-center">
                    {/* Simulated QR Code with pure clean tailwind squares - Fits beautiful design without package dependencies */}
                    <div className="md:col-span-4 flex justify-center">
                      <div className="border bg-white p-3 rounded-xl shadow-sm text-center">
                        <div className="grid grid-cols-5 gap-1.5 h-20 w-20 bg-zinc-100 flex items-center justify-center p-1.5 font-mono text-[8px] font-bold text-emerald-900 select-none">
                          <div className="bg-black h-4 w-4"></div>
                          <div className="bg-white h-4 w-4"></div>
                          <div className="bg-black h-4 w-4"></div>
                          <div className="bg-white h-4 w-4"></div>
                          <div className="bg-black h-4 w-4"></div>
                          <div className="bg-white h-4 w-4"></div>
                          <div className="bg-black h-4 w-4"></div>
                          <div className="bg-black h-4 w-4"></div>
                          <div className="bg-white h-4 w-4"></div>
                          <div className="bg-black h-4 w-4"></div>
                        </div>
                        <span className="block text-[8px] font-bold text-zinc-400 uppercase tracking-widest mt-1.5 font-mono">QR MOCK</span>
                      </div>
                    </div>

                    <div className="md:col-span-8 space-y-2">
                      <p>
                        1. Abra seu aplicativo autenticador preferido (Google Authenticator, Microsoft Authenticator ou Authy).
                      </p>
                      <p>
                        2. Aponte a câmera para o QR-Code ao lado ou insira manualmente a chave secreta de sincronização abaixo:
                      </p>
                      
                      {/* Copyable Secret Token Key */}
                      <div className="flex items-center space-x-2 bg-white border rounded px-2 py-1 flex items-center justify-between font-mono text-[10px] text-zinc-700">
                        <span>VERT-MFA-SECRET-DEMO</span>
                        <button
                          type="button"
                          onClick={handleCopyKey}
                          className="text-zinc-400 hover:text-emerald-700 p-0.5"
                          title="Copiar token"
                        >
                          <Copy className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-1.5 max-w-sm">
                  <label htmlFor="mfa-input-code" className="block text-xs font-semibold text-zinc-750 uppercase tracking-wider">
                    3. Digite o código gerado para homologação:
                  </label>
                  <input
                    id="mfa-input-code"
                    type="text"
                    maxLength={6}
                    required
                    placeholder="Ex: 123456"
                    value={mfaInputCode}
                    onChange={(e) => setMfaInputCode(e.target.value.replace(/\D/g, ''))}
                    className="block w-full rounded-xl border border-zinc-200 py-2.5 px-3 text-center text-sm font-mono tracking-widest focus:outline-none focus:border-emerald-600"
                  />
                  <p className="text-[10px] text-zinc-400 leading-tight">
                    Insira qualquer código de 6 dígitos numéricos (como <strong>123456</strong> por padrão para o ambiente de testes).
                  </p>
                </div>

                <div className="flex space-x-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsSettingUpMfa(false)}
                    className="rounded-xl border border-zinc-200 bg-white px-4 py-2 text-xs font-semibold text-zinc-650 hover:bg-zinc-50"
                  >
                    Voltar
                  </button>
                  <button
                    type="submit"
                    className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-5 py-2 text-xs"
                    id="mfa-activation-confirm-btn"
                  >
                    Confirmar e Ativar 2FA
                  </button>
                </div>
              </form>
            ) : (
              /* If 2FA is deactivated */
              <div className="space-y-4">
                <div className="bg-amber-50/50 border border-amber-250 p-4 rounded-xl flex items-start space-x-2.5">
                  <ShieldAlert className="h-5 w-5 text-amber-700 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-950 leading-relaxed">
                    <strong>Nível de Segurança: Crítico.</strong> Sua conta está protegida apenas por sua senha. Recomendamos fortificar o acesso para os relatórios mensais e compras fiscais ativando o 2FA.
                  </div>
                </div>

                <button
                  onClick={handleStartSetupMfa}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 px-5 py-2.5 text-xs font-bold text-white shadow"
                  id="activate-2fa-flow-button"
                >
                  Configurar Autenticação em Duas Etapas (2FA)
                </button>
              </div>
            )}
          </div>

          {/* User History Purchases ONLY if user is a Customer */}
          {currentUser.role === 'customer' && (
            <div className="rounded-2xl border border-emerald-100 bg-white p-6 shadow-sm" id="customer-purchase-history">
              <h2 className="text-xs font-bold text-emerald-950 uppercase tracking-widest border-b pb-2 mb-4 flex items-center gap-1.5">
                <ShoppingBag className="h-4.5 w-4.5 text-emerald-700" />
                Histórico de Pedidos Realizados ({customerSales.length})
              </h2>

              {customerSales.length === 0 ? (
                <p className="text-xs text-zinc-400 py-6 text-center">Você ainda não realizou nenhuma compra na nossa vitrine.</p>
              ) : (
                <div className="space-y-4">
                  {customerSales.map((sale) => (
                    <div key={sale.id} className="border p-4 rounded-xl hover:border-emerald-250 transition-all text-xs flex flex-col sm:flex-row justify-between gap-4">
                      {/* Left */}
                      <div className="space-y-1 my-auto">
                        <div className="flex items-center space-x-2">
                          <span className="font-bold text-zinc-900 font-mono">ID: {sale.id}</span>
                          <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-100/50 text-[9px] font-bold text-emerald-800">
                            Confirmada
                          </span>
                        </div>
                        <p className="text-zinc-500 font-medium">
                          Data do pedido: {new Date(sale.timestamp).toLocaleDateString('pt-BR')}  às {new Date(sale.timestamp).toLocaleTimeString('pt-BR')}
                        </p>
                        <div className="text-zinc-400 text-[11px] leading-tight mt-1.5">
                          {sale.items.map((item, id) => (
                            <span key={id} className="block">
                              • {item.quantity}x {item.productName}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Right */}
                      <div className="flex flex-row sm:flex-col justify-between sm:justify-center items-end border-t sm:border-t-0 pt-3 sm:pt-0 sm:pl-4 sm:border-l border-zinc-100 text-right shrink-0">
                        <div>
                          <span className="block text-[10px] text-zinc-400">Total do Pedido</span>
                          <span className="font-bold text-emerald-950 font-mono text-sm block">
                            R$ {sale.total.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </span>
                          <span className="text-[9px] text-zinc-400 font-mono block">via {sale.paymentMethod}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
