import { useState } from 'react';
import { motion } from 'motion/react';
import { 
  Shield, 
  ShieldCheck, 
  Zap, 
  Crown, 
  Coins, 
  Sparkles, 
  ShoppingBag, 
  Check, 
  AlertCircle,
  Flame,
  ArrowRight
} from 'lucide-react';
import { UserState } from '../types';
import { SHOP_ITEMS, ShopItem } from '../data/achievements';
import { triggerHaptic } from '../utils';
import confetti from 'canvas-confetti';

interface PerksVaultSectionProps {
  userState: UserState;
  onBuyItem: (item: ShopItem, currency: 'tokens' | 'coins') => boolean;
  onUseStreakFreeze?: () => void;
}

export function PerksVaultSection({
  userState,
  onBuyItem,
  onUseStreakFreeze
}: PerksVaultSectionProps) {
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);
  const [purchaseError, setPurchaseError] = useState<string | null>(null);

  const perks = userState.perks || {
    xpBoostPercent: 0,
    coinBoostPercent: 0,
    streakFreezes: 0,
    arenaShields: 0,
    arenaTokenBonusPercent: 0,
    temporaryXpBoostCharges: 0
  };

  const masteryTokens = userState.masteryTokens || 0;
  const coins = userState.coins || 0;

  const handlePurchase = (item: ShopItem, currency: 'tokens' | 'coins') => {
    setPurchaseError(null);
    const success = onBuyItem(item, currency);
    if (success) {
      triggerHaptic('success');
      confetti({
        particleCount: 50,
        spread: 50,
        origin: { y: 0.8 }
      });
      setPurchaseSuccess(`Zdobyto: ${item.name}!`);
      setTimeout(() => setPurchaseSuccess(null), 3000);
    } else {
      triggerHaptic('error');
      setPurchaseError(`Niewystarczająca ilość ${currency === 'tokens' ? 'Żetonów Areny' : 'Monet'}!`);
      setTimeout(() => setPurchaseError(null), 3500);
    }
  };

  const scrollToMarket = () => {
    triggerHaptic('light');
    const marketEl = document.getElementById('perks-market-section');
    if (marketEl) {
      marketEl.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Wallet / Arena Currency Card */}
      <div className="bg-[#141A23] border border-white/5 shadow-md rounded-[24px] p-5 relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-400 shadow-inner">
              <Crown size={20} />
            </div>
            <div>
              <h3 className="font-display font-black text-white text-base">Portfel Mistrzostwa</h3>
              <p className="text-[11px] text-[#8B8D98]">Zasoby turniejowe i naukowe</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="bg-white/5 rounded-2xl p-3.5 flex flex-col border border-white/5">
            <span className="text-[10px] uppercase font-black text-[#8B8D98] mb-1 flex items-center gap-1.5">
              <Crown size={12} className="text-sky-400" /> Żetony Areny
            </span>
            <span className="text-2xl font-display font-black text-sky-400 leading-tight">
              {masteryTokens}
            </span>
            <span className="text-[10px] text-sky-200/60 mt-1">Z walk 1v1 i odznak</span>
          </div>

          <div className="bg-white/5 rounded-2xl p-3.5 flex flex-col border border-white/5">
            <span className="text-[10px] uppercase font-black text-[#8B8D98] mb-1 flex items-center gap-1.5">
              <Coins size={12} className="text-sky-300" /> Monety Kampusu
            </span>
            <span className="text-2xl font-display font-black text-white leading-tight">
              {coins.toLocaleString('pl-PL')}
            </span>
            <span className="text-[10px] text-[#8B8D98] mt-1">Z zadań i matury</span>
          </div>
        </div>
      </div>

      {/* SYSTEM SLOTÓW EKWIPUNKU (RPG ARTIFACT SLOTS) */}
      <div>
        <div className="flex items-center justify-between mb-3 px-0.5">
          <h3 className="text-sm font-display font-black text-white flex items-center gap-2">
            <Sparkles size={16} className="text-[#00E5FF]" /> Sloty Ekwipunku & Wzmocnienia
          </h3>
          <span className="text-[10px] uppercase tracking-wider font-bold text-[#8B8D98]">3 Gniazda RPG</span>
        </div>

        <div className="flex flex-col gap-3.5">
          {/* SLOT 1: TARCZA PASSY */}
          <div className="relative group bg-[#141A23] border border-blue-500/20 rounded-[22px] p-4 sm:p-5 overflow-hidden shadow-[0_4px_20px_rgba(59,130,246,0.08)] transition-all duration-150 active:scale-[0.98]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/10 rounded-full blur-[35px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>
            
            <div className="flex items-start gap-4 relative z-10">
              {/* Świecący slot artefaktu */}
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-700/30 border border-blue-400/30 flex items-center justify-center text-blue-400 shadow-[0_0_20px_rgba(59,130,246,0.3)]">
                  <Shield size={26} className="drop-shadow-[0_0_8px_rgba(96,165,250,0.8)]" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-blue-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-[#141A23]">
                  S1
                </div>
              </div>

              {/* Opis i status slotu */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between flex-wrap gap-1 mb-1">
                  <h4 className="font-display font-black text-white text-base">Tarcza Passy</h4>
                  <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-500/15 text-blue-300 border border-blue-500/30 shadow-sm">
                    Aktywna: {perks.streakFreezes || 0} szt.
                  </span>
                </div>
                <p className="text-xs text-[#9CA3AF] leading-relaxed mb-3">
                  Chroni Twój płomień serii przed zerwaniem i natychmiast neutralizuje rdzę po opuszczonym dniu nauki.
                </p>

                {/* Szybka interakcja */}
                <div className="flex items-center gap-2">
                  {userState.campusRust > 0 && (perks.streakFreezes || 0) > 0 && onUseStreakFreeze ? (
                    <button
                      onClick={() => {
                        triggerHaptic('success');
                        onUseStreakFreeze();
                      }}
                      className="px-3 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-black shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all duration-150 active:scale-[0.96]"
                    >
                      Użyj i usuń rdzę ({userState.campusRust})
                    </button>
                  ) : (perks.streakFreezes || 0) === 0 ? (
                    <button
                      onClick={scrollToMarket}
                      className="text-[11px] font-bold text-blue-400 hover:text-blue-300 flex items-center gap-1 transition-colors"
                    >
                      Kup w Rynku poniżej <ArrowRight size={12} />
                    </button>
                  ) : (
                    <span className="text-[11px] font-bold text-blue-300/70 flex items-center gap-1">
                      <Check size={13} className="text-blue-400" /> Gotowa do automatycznej ochrony
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SLOT 2: TARCZA ELO ARENY */}
          <div className="relative group bg-[#141A23] border border-emerald-500/20 rounded-[22px] p-4 sm:p-5 overflow-hidden shadow-[0_4px_20px_rgba(16,185,129,0.08)] transition-all duration-150 active:scale-[0.98]">
            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-[35px] -translate-y-1/2 translate-x-1/4 pointer-events-none"></div>

            <div className="flex items-start gap-4 relative z-10">
              {/* Świecący slot artefaktu */}
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-emerald-700/30 border border-emerald-400/30 flex items-center justify-center text-emerald-400 shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                  <ShieldCheck size={26} className="drop-shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-emerald-600 text-white text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-[#141A23]">
                  S2
                </div>
              </div>

              {/* Opis i status slotu */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between flex-wrap gap-1 mb-1">
                  <h4 className="font-display font-black text-white text-base">Egida Areny 1v1</h4>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-sm ${
                    (perks.arenaShields || 0) > 0 
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30' 
                      : 'bg-white/5 text-[#8B8D98] border-white/5'
                  }`}>
                    {(perks.arenaShields || 0) > 0 ? `Aktywna: ${perks.arenaShields} pojedynków` : 'Brak w ekwipunku'}
                  </span>
                </div>
                <p className="text-xs text-[#9CA3AF] leading-relaxed mb-3">
                  Runiczna osłona turniejowa. Zapobiega utracie punktów rankingu ELO w razie przegranej w pojedynku na żywo.
                </p>

                <div className="flex items-center gap-2">
                  {(perks.arenaShields || 0) > 0 ? (
                    <span className="text-[11px] font-bold text-emerald-300/80 flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></div>
                      Chroni ranking w następnej walce
                    </span>
                  ) : (
                    <button
                      onClick={scrollToMarket}
                      className="text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
                    >
                      Zdobądź Egidę w Rynku <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SLOT 3: DOŁADOWANIE XP (PULSUJĄCE LAZUROWE ŚWIATŁO) */}
          <div className="relative group bg-[#141A23] border border-sky-500/25 rounded-[22px] p-4 sm:p-5 overflow-hidden shadow-[0_4px_25px_rgba(14,165,233,0.15)] transition-all duration-150 active:scale-[0.98]">
            {/* Lazurowa poświata */}
            <div className="absolute top-0 right-0 w-36 h-36 bg-sky-500/15 rounded-full blur-[40px] -translate-y-1/2 translate-x-1/4 pointer-events-none animate-pulse"></div>

            <div className="flex items-start gap-4 relative z-10">
              {/* Pulsujący artefakt z dynamicznym blaskiem */}
              <div className="relative shrink-0">
                <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-sky-500/25 to-blue-600/30 border border-sky-400/40 flex items-center justify-center text-sky-400 shadow-[0_0_25px_rgba(14,165,233,0.4)] animate-pulse">
                  <Zap size={26} className="drop-shadow-[0_0_10px_rgba(56,189,248,0.9)]" />
                </div>
                <div className="absolute -bottom-1 -right-1 bg-sky-500 text-black text-[9px] font-black px-1.5 py-0.5 rounded-full border-2 border-[#141A23]">
                  S3
                </div>
              </div>

              {/* Opis i status slotu */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between flex-wrap gap-1 mb-1">
                  <h4 className="font-display font-black text-white text-base flex items-center gap-1.5">
                    <span>Doładowanie 2x XP</span>
                  </h4>
                  <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full border shadow-sm ${
                    (perks.temporaryXpBoostCharges || 0) > 0 
                      ? 'bg-sky-500/20 text-sky-300 border-sky-500/40 animate-pulse' 
                      : 'bg-white/5 text-[#8B8D98] border-white/5'
                  }`}>
                    {(perks.temporaryXpBoostCharges || 0) > 0 
                      ? `2x XP przez ${perks.temporaryXpBoostCharges} zadania` 
                      : 'Gotowe do zasilenia'}
                  </span>
                </div>
                <p className="text-xs text-[#9CA3AF] leading-relaxed mb-3">
                  Potężny eliksir mądrości. Podwaja wszystkie zdobywane punkty XP z lekcji, modułów i próbnych egzaminów E8.
                </p>

                <div className="flex items-center gap-2">
                  {(perks.temporaryXpBoostCharges || 0) > 0 ? (
                    <span className="text-[11px] font-black text-sky-300 flex items-center gap-1.5">
                      <Sparkles size={13} className="text-sky-400 animate-spin" />
                      Mnożnik aktywny w bieżących zadaniach!
                    </span>
                  ) : (
                    <button
                      onClick={scrollToMarket}
                      className="text-[11px] font-bold text-sky-400 hover:text-sky-300 flex items-center gap-1 transition-colors"
                    >
                      Kup Doładowanie w Rynku <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pasek pasywnych relikwii z odznak */}
        <div className="mt-3.5 bg-white/[0.03] border border-white/5 rounded-2xl p-3 flex items-center justify-between gap-2 text-[11px] text-[#9CA3AF]">
          <span className="font-bold flex items-center gap-1.5 text-white">
            <Sparkles size={13} className="text-purple-400" /> Pasywne premie z odznak:
          </span>
          <div className="flex items-center gap-2.5 font-mono font-bold text-[10px]">
            <span className="text-purple-300">+{perks.xpBoostPercent || 0}% XP</span>
            <span>•</span>
            <span className="text-sky-300">+{perks.coinBoostPercent || 0}% Monet</span>
            <span>•</span>
            <span className="text-cyan-300">+{perks.arenaTokenBonusPercent || 0}% Żetonów</span>
          </div>
        </div>
      </div>

      {/* Notification Toast */}
      {purchaseSuccess && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg"
        >
          <Check size={16} className="text-emerald-400" />
          <span>{purchaseSuccess}</span>
        </motion.div>
      )}

      {purchaseError && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-red-500/20 border border-red-500/40 text-red-200 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-lg"
        >
          <AlertCircle size={16} className="text-red-400" />
          <span>{purchaseError}</span>
        </motion.div>
      )}

      {/* Perks Market / Shop */}
      <div id="perks-market-section">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-display font-black text-white flex items-center gap-2">
            <ShoppingBag size={16} className="text-sky-400" /> Rynek Perków i Tarcz
          </h3>
          <span className="text-[11px] text-[#8B8D98]">Wymień żetony lub monety</span>
        </div>

        <div className="space-y-3">
          {SHOP_ITEMS.map(item => {
            const canAffordTokens = masteryTokens >= item.tokenPrice;
            const canAffordCoins = coins >= item.coinPrice;

            return (
              <div
                key={item.id}
                className="bg-[#141A23] border border-white/5 rounded-2xl p-5 flex flex-col gap-4 shadow-lg hover:border-white/10 transition-colors"
              >
                {/* Header Karty */}
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-[#0B0E14] border border-sky-500/30 flex items-center justify-center shrink-0 text-sky-400 shadow-[0_0_15px_rgba(14,165,233,0.2)]">
                    {item.icon === 'Shield' && <Shield size={24} />}
                    {item.icon === 'ShieldCheck' && <ShieldCheck size={24} />}
                    {item.icon === 'Zap' && <Zap size={24} />}
                  </div>
                  <div>
                    <h4 className="font-black text-white text-base">{item.name}</h4>
                    <span className="text-[10px] uppercase font-bold text-[#A855F7] bg-[#A855F7]/10 px-2 py-0.5 rounded-full mt-1 inline-block">Wzmocnienie</span>
                  </div>
                </div>

                {/* Body Karty */}
                <div>
                  <p className="text-sm text-[#9CA3AF] leading-relaxed">{item.description}</p>
                </div>

                {/* Footer / Action Row */}
                <div className="flex flex-row items-center gap-2 mt-1">
                  {/* Buy with Mastery Tokens */}
                  <button
                    onClick={() => handlePurchase(item, 'tokens')}
                    disabled={!canAffordTokens}
                    title={!canAffordTokens ? "Za mało żetonów" : ""}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 border transition-all duration-150 ${
                      canAffordTokens
                        ? 'bg-[#D97706]/10 hover:bg-[#D97706]/20 text-[#F59E0B] border-[#D97706]/30 active:scale-[0.96]'
                        : 'bg-white/5 text-[#6B7280] border-white/5 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <Crown size={14} />
                    <span>{item.tokenPrice} Żetonów</span>
                  </button>

                  {/* Buy with Coins */}
                  <button
                    onClick={() => handlePurchase(item, 'coins')}
                    disabled={!canAffordCoins}
                    title={!canAffordCoins ? "Za mało monet" : ""}
                    className={`flex-1 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 border transition-all duration-150 ${
                      canAffordCoins
                        ? 'bg-[#3B82F6]/10 hover:bg-[#3B82F6]/20 text-[#00D2FF] border-[#3B82F6]/30 active:scale-[0.96]'
                        : 'bg-white/5 text-[#6B7280] border-white/5 opacity-40 cursor-not-allowed'
                    }`}
                  >
                    <Coins size={14} />
                    <span>{item.coinPrice.toLocaleString('pl-PL')} Monet</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
