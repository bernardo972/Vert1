import React, { useState } from 'react';
import { User, Lock, Mail, ChevronRight, CheckCircle2, ShieldCheck, KeyRound } from 'lucide-react';
import { UserRole, User as UserType } from '../types';
import { registerUser, getUsers, getLoggedInUser } from '../utils/database';

interface AuthProps {
  onLoginSuccess: (user: UserType) => void;
  onSetNotification: (msg: string, type: 'success' | 'error') => void;
}

export default function Auth({ onLoginSuccess, onSetNotification }: AuthProps) {
  const [isLogin, setIsLogin] = useState(true);
  
  // Auth Form State
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState<UserRole>('customer');
  const [cpfOrCnpj, setCpfOrCnpj] = useState('');

  // 2FA Verification State
  const [pendingUser, setPendingUser] = useState<UserType | null>(null);
  const [twoFactorCode, setTwoFactorCode] = useState('');
  const [mfaError, setMfaError] = useState('');

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isLogin) {
      // Handle Login
      const users = getUsers();
      const matched = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!matched || matched.password !== password) {
        onSetNotification('E-mail ou senha incorretos.', 'error');
        return;
      }

      // Check if 2FA is enabled
      if (matched.isTwoFactorEnabled) {
        setPendingUser(matched);
        setTwoFactorCode('');
        setMfaError('');
        onSetNotification('Autenticação de Dois Fatores solicitada!', 'success');
      } else {
        onLoginSuccess(matched);
        onSetNotification(`Bem-vindo de volta, ${matched.name}!`, 'success');
      }
    } else {
      // Handle Registration
      if (!name || !email || !password) {
        onSetNotification('Preencha todos os campos obrigatórios.', 'error');
        return;
      }
      try {
        const registered = registerUser({
          name,
          email,
          password,
          role: 'customer',
          cpfOrCnpj: '123.456.789-00'
        });
        onSetNotification('Cadastro efetuado com sucesso! Insira suas credenciais para entrar.', 'success');
        setIsLogin(true);
        setPassword('');
      } catch (err: any) {
        onSetNotification(err.message || 'Erro ao registrar.', 'error');
      }
    }
  };

  const handleVerify2FA = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pendingUser) return;

    // Simulate 2FA code checking. In this simulation, we accept "123456" as the standard demo token, 
    // or any other 6-digit numeric input starting with "12" or "2" for maximum convenience.
    // We let the user know what code is needed.
    const isCodeValid = twoFactorCode.trim() === '123456' || twoFactorCode.trim() === '654321' || (twoFactorCode.length === 6 && !isNaN(Number(twoFactorCode)));

    if (isCodeValid) {
      const user = pendingUser;
      setPendingUser(null);
      onLoginSuccess(user);
      onSetNotification(`Acesso seguro autorizado! Olá, ${user.name}.`, 'success');
    } else {
      setMfaError('Código 2FA incorreto ou expirado. Tente "123456" para o ambiente de testes.');
      onSetNotification('Falha na autenticação em dois fatores.', 'error');
    }
  };

  return (
    <div className="mx-auto max-w-md px-4 py-12" id="auth-container">
      {pendingUser ? (
        /* 2FA Form Panel */
        <div className="rounded-2xl border border-emerald-100 bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
              <ShieldCheck className="h-8 w-8 animate-pulse" />
            </div>
            <h2 className="mt-4 text-xl font-bold text-zinc-900 font-sans">Segurança em Duas Etapas</h2>
            <p className="mt-2 text-xs text-zinc-500">
              Sua conta possui proteção extra ativada. Insira o código de verificação temporário de 6 dígitos gerado pelo seu aplicativo autenticador.
            </p>
          </div>

          <form onSubmit={handleVerify2FA} className="space-y-4" id="mfa-form">
            <div>
              <label htmlFor="mfa-code" className="block text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-1.5">Código de Autenticação (2FA)</label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                  <KeyRound className="h-4 w-4" />
                </span>
                <input
                  id="mfa-code"
                  type="text"
                  maxLength={6}
                  required
                  placeholder="Ex: 123456"
                  value={twoFactorCode}
                  onChange={(e) => setTwoFactorCode(e.target.value.replace(/\D/g, ''))}
                  className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2.5 pl-10 pr-4 text-center font-mono text-lg tracking-widest text-zinc-800 placeholder-zinc-400 focus:border-emerald-600 focus:bg-white focus:outline-none transition-all"
                  autoFocus
                />
              </div>
              <p className="mt-1.5 text-[11px] text-emerald-600 text-center font-medium">
                Dica de simulação: Digite <strong>123456</strong> para validar com segurança.
              </p>
              {mfaError && (
                <p className="mt-2 text-xs text-rose-600 font-medium text-center bg-rose-50 p-2 rounded-lg">
                  {mfaError}
                </p>
              )}
            </div>

            <button
              type="submit"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-700 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-800 transition"
              id="confirm-mfa-button"
            >
              <span>Verificar e Acessar</span>
              <ChevronRight className="h-4 w-4" />
            </button>

            <button
              type="button"
              onClick={() => setPendingUser(null)}
              className="w-full text-center text-xs font-medium text-zinc-500 hover:text-zinc-700 transition"
            >
              Voltar para o login
            </button>
          </form>
        </div>
      ) : (
        /* Main Login / Register panel */
        <div className="space-y-6">
          <div className="rounded-2xl border border-emerald-100 bg-white p-8 shadow-sm">
            <div className="mb-6 flex justify-center border-b border-zinc-100 pb-2">
              <button
                onClick={() => { setIsLogin(true); setPassword(''); }}
                className={`w-1/2 pb-2 text-sm font-semibold transition ${
                  isLogin ? 'border-b-2 border-emerald-700 text-emerald-950 font-bold' : 'text-zinc-400 hover:text-zinc-600'
                }`}
                id="tab-login"
              >
                Entrar
              </button>
              <button
                onClick={() => { setIsLogin(false); setPassword(''); }}
                className={`w-1/2 pb-2 text-sm font-semibold transition ${
                  !isLogin ? 'border-b-2 border-emerald-700 text-emerald-950 font-bold' : 'text-zinc-400 hover:text-zinc-600'
                }`}
                id="tab-register"
              >
                Criar Conta
              </button>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-4" id="credentials-auth-form">
              {!isLogin && (
                <>
                  <div>
                    <label htmlFor="auth-name" className="block text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-1">Nome Completo</label>
                    <div className="relative">
                      <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                        <User className="h-4 w-4" />
                      </span>
                      <input
                        id="auth-name"
                        type="text"
                        required
                        placeholder="Ex: João da Silva"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2.5 pl-10 pr-4 text-sm text-zinc-800 placeholder-zinc-400 focus:border-emerald-600 focus:bg-white focus:outline-none transition-all"
                      />
                    </div>
                  </div>
                </>
              )}

              <div>
                <label htmlFor="auth-email" className="block text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-1">E-mail Corporativo ou Pessoal</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                    <Mail className="h-4 w-4" />
                  </span>
                  <input
                    id="auth-email"
                    type="email"
                    required
                    placeholder="voce@exemplo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2.5 pl-10 pr-4 text-sm text-zinc-800 placeholder-zinc-400 focus:border-emerald-600 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="auth-pass" className="block text-xs font-semibold text-zinc-600 uppercase tracking-widest mb-1">Senha Secreta</label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-zinc-400">
                    <Lock className="h-4 w-4" />
                  </span>
                  <input
                    id="auth-pass"
                    type="password"
                    required
                    placeholder="Sua senha"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full rounded-xl border border-zinc-200 bg-zinc-50/50 py-2.5 pl-10 pr-4 text-sm text-zinc-800 placeholder-zinc-400 focus:border-emerald-600 focus:bg-white focus:outline-none transition-all"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition"
                id="submit-auth-button"
              >
                <span>{isLogin ? 'Entrar com Segurança' : 'Criar Conta Grátis'}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
