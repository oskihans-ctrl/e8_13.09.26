import { useState } from 'react';
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
    <div className="flex flex-col gap-5">
      {/* Wallet / Arena Currency Card */}
      <div className="bg-white dark:bg-[#131B29] border border-slate-200 dark:border-slate-800 rounded-2xl p-5 shadow-xs">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500">
              <Crown size={20} />
            </div>
            <div>
              <h3 className="font-display font-bold text-slate-900 dark:text-white text-base">Portfel Zasobów</h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">Waluty turniejowe i edukacyjne</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3.5 flex flex-col border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1.5">
              <Crown size={12} className="text-amber-500" /> Żetony Areny
            </span>
            <span className="text-2xl font-display font-bold text-slate-900 dark:text-white leading-tight">
              {masteryTokens}
            </span>
            <span className="text-[11px] text-slate-400 mt-1">Z walk 1v1 i odznak</span>
          </div>

          <div className="bg-slate-50 dark:bg-slate-800/40 rounded-xl p-3.5 flex flex-col border border-slate-200 dark:border-slate-700/60">
            <span className="text-[10px] uppercase font-bold text-slate-400 mb-1 flex items-center gap-1.5">
              <Coins size={12} className="text-amber-500" /> Monety
            </span>
            <span className="text-2xl font-display font-bold text-slate-900 dark:text-white leading-tight">
              {coins.toLocaleString('pl-PL')}
            </span>
            <span className="text-[11px] text-slate-400 mt-1">Z zadań i egzaminu</span>
          </div>
        </div>
      </div>

      {/* SYSTEM SLOTÓW EKWIPUNKU */}
      <div>
        <div className="flex items-center justify-between mb-3 px-0.5">
          <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Sparkles size={16} className="text-amber-500" /> Aktywne Wzmocnienia
          </h3>
          <span className="text-[10px] uppercase tracking-wider font-bold text-slate-400">Ekwipunek</span>
        </div>

        <div className="flex flex-col gap-3">
          {/* SLOT 1: TARCZA PASSY */}
          <div className="bg-white dark:bg-[#131B29] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                <Shield size={22} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between flex-wrap gap-1 mb-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Tarcza Passy (Zamrożenie)</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    (perks.streakFreezes || 0) > 0 
                      ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-800' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}>
                    {(perks.streakFreezes || 0) > 0 ? `Dostępne: ${perks.streakFreezes} szt.` : 'Brak'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                  Chroni Twój płomień serii przed zerwaniem w przypadku opuszczenia dnia nauki.
                </p>

                <div className="flex items-center gap-2">
                  {userState.campusRust > 0 && (perks.streakFreezes || 0) > 0 && onUseStreakFreeze ? (
                    <button
                      type="button"
                      onClick={() => {
                        triggerHaptic('success');
                        onUseStreakFreeze();
                      }}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 rounded-xl text-xs font-bold transition-all shadow-xs cursor-pointer"
                    >
                      Użyj i usuń rdzę ({userState.campusRust})
                    </button>
                  ) : (perks.streakFreezes || 0) === 0 ? (
                    <button
                      type="button"
                      onClick={scrollToMarket}
                      className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      Kup w sklepie poniżej <ArrowRight size={12} />
                    </button>
                  ) : (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1">
                      <Check size={13} /> Aktywna automatyczna ochrona
                    </span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SLOT 2: TARCZA ELO ARENY */}
          <div className="bg-white dark:bg-[#131B29] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                <ShieldCheck size={22} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between flex-wrap gap-1 mb-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Egida Areny 1v1</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    (perks.arenaShields || 0) > 0 
                      ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-800' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}>
                    {(perks.arenaShields || 0) > 0 ? `Dostępne: ${perks.arenaShields} pojedynków` : 'Brak'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                  Chroni Twój ranking ELO przed spadkiem w razie przegranego pojedynku na żywo.
                </p>

                <div className="flex items-center gap-2">
                  {(perks.arenaShields || 0) > 0 ? (
                    <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 flex items-center gap-1.5">
                      <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                      Zabezpieczenie aktywne w kolejnym meczu
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={scrollToMarket}
                      className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      Kup Egidę w sklepie <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* SLOT 3: DOŁADOWANIE XP */}
          <div className="bg-white dark:bg-[#131B29] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 shadow-xs">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-500 shrink-0">
                <Zap size={22} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between flex-wrap gap-1 mb-1">
                  <h4 className="font-bold text-slate-900 dark:text-white text-sm">Doładowanie 2x XP</h4>
                  <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                    (perks.temporaryXpBoostCharges || 0) > 0 
                      ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-800' 
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-400 border-slate-200 dark:border-slate-700'
                  }`}>
                    {(perks.temporaryXpBoostCharges || 0) > 0 
                      ? `2x XP przez ${perks.temporaryXpBoostCharges} zad.` 
                      : 'Nieaktywne'}
                  </span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed mb-3">
                  Podwaja wszystkie zdobywane punkty doświadczenia ze standardowych zadań i arkuszy.
                </p>

                <div className="flex items-center gap-2">
                  {(perks.temporaryXpBoostCharges || 0) > 0 ? (
                    <span className="text-xs font-bold text-amber-700 dark:text-amber-400 flex items-center gap-1.5">
                      <Sparkles size={13} />
                      Mnożnik aktywny w bieżących zadaniach!
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={scrollToMarket}
                      className="text-xs font-bold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      Kup Doładowanie w sklepie <ArrowRight size={12} />
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Pasek pasywnych premii */}
        <div className="mt-3 bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700/60 rounded-xl p-3 flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <span className="font-bold flex items-center gap-1.5 text-slate-700 dark:text-slate-300">
            <Sparkles size={13} className="text-amber-500" /> Premie stałe z odznak:
          </span>
          <div className="flex items-center gap-2.5 font-mono font-bold text-[11px] text-slate-800 dark:text-slate-200">
            <span>+{perks.xpBoostPercent || 0}% XP</span>
            <span>•</span>
            <span>+{perks.coinBoostPercent || 0}% Monet</span>
            <span>•</span>
            <span>+{perks.arenaTokenBonusPercent || 0}% Żetonów</span>
          </div>
        </div>
      </div>

      {/* Powiadomienia */}
      {purchaseSuccess && (
        <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-300 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
          <Check size={15} className="text-emerald-500" />
          <span>{purchaseSuccess}</span>
        </div>
      )}

      {purchaseError && (
        <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-300 dark:border-rose-900 text-rose-800 dark:text-rose-300 px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 shadow-xs">
          <AlertCircle size={15} className="text-rose-500" />
          <span>{purchaseError}</span>
        </div>
      )}

      {/* Sklep / Rynek Perków */}
      <div id="perks-market-section">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-display font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingBag size={16} className="text-amber-500" /> Sklepik Narzędzi
          </h3>
          <span className="text-xs text-slate-400">Wymiana zasobów</span>
        </div>

        <div className="space-y-3">
          {SHOP_ITEMS.map(item => {
            const canAffordTokens = masteryTokens >= item.tokenPrice;
            const canAffordCoins = coins >= item.coinPrice;

            return (
              <div
                key={item.id}
                className="bg-white dark:bg-[#131B29] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 sm:p-5 flex flex-col gap-3 shadow-xs"
              >
                {/* Header Karty */}
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 text-amber-500">
                    {item.icon === 'Shield' && <Shield size={20} />}
                    {item.icon === 'ShieldCheck' && <ShieldCheck size={20} />}
                    {item.icon === 'Zap' && <Zap size={20} />}
                  </div>
                  <div>
                    <h4 className="font-bold text-slate-900 dark:text-white text-sm">{item.name}</h4>
                    <span className="text-[10px] font-bold text-slate-400">Przedmiot ochronny</span>
                  </div>
                </div>

                {/* Body Karty */}
                <div>
                  <p className="text-xs text-slate-500 dark:text-slate-400 leading-relaxed">{item.description}</p>
                </div>

                {/* Footer / Action Row */}
                <div className="flex flex-row items-center gap-2 pt-1">
                  {/* Kup za Żetony */}
                  <button
                    type="button"
                    onClick={() => handlePurchase(item, 'tokens')}
                    disabled={!canAffordTokens}
                    title={!canAffordTokens ? "Za mało żetonów" : ""}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      canAffordTokens
                        ? 'bg-amber-50 dark:bg-amber-950/20 text-amber-800 dark:text-amber-400 border-amber-300 dark:border-amber-800 hover:bg-amber-100 dark:hover:bg-amber-900/30'
                        : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <Crown size={13} />
                    <span>{item.tokenPrice} Żetonów</span>
                  </button>

                  {/* Kup za Monety */}
                  <button
                    type="button"
                    onClick={() => handlePurchase(item, 'coins')}
                    disabled={!canAffordCoins}
                    title={!canAffordCoins ? "Za mało monet" : ""}
                    className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all cursor-pointer ${
                      canAffordCoins
                        ? 'bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-900 dark:text-white border-slate-200 dark:border-slate-700'
                        : 'bg-slate-50 dark:bg-slate-800/40 text-slate-400 border-slate-200 dark:border-slate-800 opacity-50 cursor-not-allowed'
                    }`}
                  >
                    <Coins size={13} />
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

export default PerksVaultSection;
