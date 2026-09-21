import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  LogIn, 
  UserPlus, 
  Mail, 
  Lock, 
  User, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  Loader2
} from 'lucide-react';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  updateProfile, 
  signInWithPopup 
} from 'firebase/auth';
import { auth, googleProvider } from '../lib/firebase';
import { triggerHaptic } from '../utils';
import { JasneLogo } from './JasneLogo';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AuthModal({ isOpen, onClose, onSuccess }: AuthModalProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const resetForm = () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(false);
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!email.trim() || !password.trim()) {
      setError('Wypełnij wszystkie wymagane pola.');
      return;
    }

    if (mode === 'register' && password.length < 6) {
      setError('Hasło musi mieć co najmniej 6 znaków.');
      return;
    }

    setLoading(true);
    triggerHaptic('medium');

    try {
      if (mode === 'login') {
        await signInWithEmailAndPassword(auth, email.trim(), password);
        setSuccessMsg('Zalogowano pomyślnie!');
      } else {
        const userCredential = await createUserWithEmailAndPassword(auth, email.trim(), password);
        if (name.trim()) {
          await updateProfile(userCredential.user, {
            displayName: name.trim()
          });
        }
        setSuccessMsg('Konto zostało utworzone!');
      }

      triggerHaptic('success');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 500);
    } catch (err: any) {
      console.error('Auth error:', err);
      let message = 'Wystąpił błąd autoryzacji.';
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password' || err.code === 'auth/user-not-found') {
        message = 'Nieprawidłowy adres e-mail lub hasło.';
      } else if (err.code === 'auth/email-already-in-use') {
        message = 'Konto z tym adresem e-mail już istnieje. Zaloguj się.';
      } else if (err.code === 'auth/invalid-email') {
        message = 'Podaj poprawny format adresu e-mail.';
      } else if (err.code === 'auth/weak-password') {
        message = 'Hasło jest zbyt słabe (minimum 6 znaków).';
      } else if (err.message) {
        message = err.message;
      }
      setError(message);
      triggerHaptic('warning');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setSuccessMsg(null);
    setLoading(true);
    triggerHaptic('medium');

    try {
      await signInWithPopup(auth, googleProvider);
      setSuccessMsg('Zalogowano przez Google!');
      triggerHaptic('success');
      setTimeout(() => {
        onSuccess?.();
        onClose();
      }, 500);
    } catch (err: any) {
      console.error('Google auth error:', err);
      if (
        err.code === 'auth/popup-closed-by-user' ||
        err.code === 'auth/cancelled-popup-request' ||
        err.code === 'auth/popup-blocked'
      ) {
        setError('Logowanie Google zostało przerwane lub zablokowane przez przeglądarkę. Możesz zalogować się adresem e-mail powyżej.');
      } else if (
        err.code === 'auth/unauthorized-domain' ||
        err.message?.includes('unauthorized-domain')
      ) {
        setError('Domena podglądu wymaga autoryzacji Google. Skorzystaj z logowania Email + Hasło powyżej.');
      } else {
        setError('Nie udało się zalogować przez Google. Użyj formularza e-mail.');
      }
      triggerHaptic('warning');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 10 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className="w-full max-w-md bg-[#141A23] border border-white/10 rounded-3xl p-6 relative shadow-2xl overflow-hidden"
      >
        {/* Glow ambient background */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-blue-500/10 rounded-full blur-[50px] -translate-y-1/2 translate-x-1/4 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-purple-500/10 rounded-full blur-[40px] translate-y-1/2 -translate-x-1/4 pointer-events-none" />

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-[#8B8D98] hover:text-white p-2 rounded-xl hover:bg-white/5 transition-colors z-10"
          aria-label="Zamknij"
        >
          <X size={18} />
        </button>

        {/* Modal Header */}
        <div className="flex flex-col items-center text-center mb-5">
          <div className="p-3 rounded-2xl bg-amber-400/15 border border-amber-400/35 mb-3 shadow-[0_0_24px_rgba(245,158,11,0.25)] flex items-center justify-center">
            <JasneLogo variant="icon" size="md" />
          </div>
          <h2 className="font-display font-black text-xl text-white">
            {mode === 'login' ? 'Witaj w Jasne.!' : 'Dołącz do Jasne.'}
          </h2>
          <p className="text-xs text-[#8B8D98] mt-1 max-w-xs">
            {mode === 'login' 
              ? 'Zaloguj się, aby synchronizować serię dni, zadania i odznaki w chmurze.' 
              : 'Utwórz konto i zachowaj swoje osiągnięcia na każdym urządzeniu.'}
          </p>
        </div>

        {/* Tabs: Logowanie / Rejestracja */}
        <div className="bg-[#0B0E14] p-1 rounded-xl flex items-center gap-1 mb-5 border border-white/5">
          <button
            type="button"
            onClick={() => {
              resetForm();
              setMode('login');
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'login'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-[#8B8D98] hover:text-white'
            }`}
          >
            <LogIn size={13} />
            <span>Logowanie</span>
          </button>
          <button
            type="button"
            onClick={() => {
              resetForm();
              setMode('register');
            }}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all flex items-center justify-center gap-1.5 ${
              mode === 'register'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-[#8B8D98] hover:text-white'
            }`}
          >
            <UserPlus size={13} />
            <span>Rejestracja</span>
          </button>
        </div>

        {/* Alert Messages */}
        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-rose-500/10 border border-rose-500/30 rounded-xl p-3 mb-4 flex items-start gap-2.5 text-rose-300 text-xs leading-relaxed"
            >
              <AlertCircle size={16} className="shrink-0 mt-0.5 text-rose-400" />
              <span>{error}</span>
            </motion.div>
          )}

          {successMsg && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-3 mb-4 flex items-center gap-2.5 text-emerald-300 text-xs font-bold"
            >
              <CheckCircle2 size={16} className="shrink-0 text-emerald-400" />
              <span>{successMsg}</span>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Email & Password Form */}
        <form onSubmit={handleEmailAuth} className="space-y-3">
          {mode === 'register' && (
            <div>
              <label className="block text-[11px] font-bold text-[#8B8D98] uppercase tracking-wider mb-1.5">
                Twoje Imię lub Pseudonim
              </label>
              <div className="relative">
                <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B8D98]" />
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="np. Aleksander"
                  className="w-full bg-[#0B0E14] border border-white/10 focus:border-blue-500 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none transition-colors"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[11px] font-bold text-[#8B8D98] uppercase tracking-wider mb-1.5">
              Adres E-mail
            </label>
            <div className="relative">
              <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B8D98]" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="twoj.email@gmail.com"
                className="w-full bg-[#0B0E14] border border-white/10 focus:border-blue-500 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-[#8B8D98] uppercase tracking-wider mb-1.5">
              Hasło {mode === 'register' && <span className="text-white/40 normal-case">(min. 6 znaków)</span>}
            </label>
            <div className="relative">
              <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8B8D98]" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[#0B0E14] border border-white/10 focus:border-blue-500 rounded-xl pl-10 pr-3.5 py-2.5 text-sm text-white placeholder:text-white/30 focus:outline-none transition-colors"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 py-3 px-4 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-black text-sm rounded-xl transition-all shadow-[0_0_20px_rgba(37,99,235,0.4)] flex items-center justify-center gap-2 cursor-pointer active:scale-[0.98]"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : mode === 'login' ? (
              <>
                <LogIn size={15} />
                <span>Zaloguj się</span>
              </>
            ) : (
              <>
                <UserPlus size={15} />
                <span>Utwórz bezpłatne konto</span>
              </>
            )}
          </button>
        </form>

        {/* Divider */}
        <div className="flex items-center gap-3 my-4">
          <div className="flex-1 h-[1px] bg-white/10" />
          <span className="text-[10px] uppercase font-bold text-[#8B8D98]">lub</span>
          <div className="flex-1 h-[1px] bg-white/10" />
        </div>

        {/* Google Sign-in Button */}
        <button
          type="button"
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full py-2.5 px-4 bg-[#0B0E14] hover:bg-white/5 border border-white/10 text-white font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-2.5 cursor-pointer active:scale-[0.98]"
        >
          {/* SVG Google icon */}
          <svg className="w-4 h-4" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.66-5.17 3.66-9.17z"
            />
            <path
              fill="#34A853"
              d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24z"
            />
            <path
              fill="#FBBC05"
              d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.98 0 12s.45 3.82 1.25 5.42l4.03-3.15z"
            />
            <path
              fill="#EA4335"
              d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98z"
            />
          </svg>
          <span>Kontynuuj przez Google</span>
        </button>
      </motion.div>
    </div>
  );
}
