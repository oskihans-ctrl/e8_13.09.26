import { useState, useEffect } from 'react';
import { Swords, Trophy, Users, X, Crown, Medal, Zap, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { triggerHaptic } from '../utils';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, getDocs, setDoc, doc, onSnapshot, serverTimestamp, updateDoc, orderBy, limit, getCountFromServer, increment } from 'firebase/firestore';
import confetti from 'canvas-confetti';
import { UserState } from '../types';
import { handleFirestoreError, OperationType } from '../lib/firestoreErrors';

const TEST_TASKS = [
  { question: 'Czy liczba π jest liczbą wymierną?', answer: false },
  { question: 'Czy kwadrat każdej liczby rzeczywistej jest nieujemny?', answer: true },
  { question: 'Czy funkcja liniowa f(x) = 2x + 1 jest malejąca?', answer: false },
  { question: 'Czy trójkąt równoboczny ma wszystkie kąty o mierze 60 stopni?', answer: true },
  { question: 'Czy pierwiastek kwadratowy z 16 jest równy 4?', answer: true },
  { question: 'Czy liczba 0 jest naturalna (w polskiej tradycji matematycznej)?', answer: true },
  { question: 'Czy suma kątów w trójkącie wynosi 180 stopni?', answer: true },
  { question: 'Czy 2^3 równa się 6?', answer: false }
];

type MatchState = 'idle' | 'searching' | 'matched' | 'active' | 'finished';

interface ArenaViewProps {
  userState?: UserState;
  onUpdateUserState?: (updater: (prev: UserState) => UserState) => void;
  saveUserData?: (newState: UserState) => void;
}

export function ArenaView({ userState, onUpdateUserState, saveUserData }: ArenaViewProps = {}) {
  const [user] = useAuthState(auth);
  const [matchState, setMatchState] = useState<MatchState>('idle');
  const [matchId, setMatchId] = useState<string | null>(null);
  const [matchData, setMatchData] = useState<any>(null);
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'play' | 'leaderboard'>('play');
  const [userStats, setUserStats] = useState({ rating: 1000, masteryTokens: 0, wins: 0 });
  const [onlineCount, setOnlineCount] = useState(1);
  const [botTimerId, setBotTimerId] = useState<any>(null);
  const [shieldProtected, setShieldProtected] = useState(false);
  const [guestWarning, setGuestWarning] = useState(false);

  useEffect(() => {
    if (user) {
      const userRef = doc(db, 'users', user.uid);
      const unsubUser = onSnapshot(userRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setUserStats({
            rating: data.arenaRating || 1000,
            masteryTokens: data.masteryTokens || 0,
            wins: data.arenaWins || 0
          });
        } else {
          setDoc(userRef, { arenaRating: 1000, masteryTokens: 0, arenaWins: 0 }, { merge: true });
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `users/${user.uid}`);
      });

      const updatePresence = async () => {
        await updateDoc(userRef, { lastActive: serverTimestamp() });
      };
      updatePresence();

      const fetchOnlineCount = async () => {
        try {
          const fiveMinsAgo = new Date(Date.now() - 5 * 60 * 1000);
          const q = query(collection(db, 'users'), where('lastActive', '>=', fiveMinsAgo));
          const snap = await getCountFromServer(q);
          setOnlineCount(Math.max(1, snap.data().count));
        } catch {
          // ignore
        }
      };
      fetchOnlineCount();

      const fetchLeaderboard = async () => {
        try {
          const q = query(collection(db, 'users'), orderBy('arenaRating', 'desc'), limit(10));
          const snap = await getDocs(q);
          const list = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setLeaderboard(list);
        } catch {
          // ignore
        }
      };
      fetchLeaderboard();

      return () => unsubUser();
    } else {
      setUserStats({
        rating: userState?.arenaRating || 1000,
        masteryTokens: userState?.masteryTokens || 0,
        wins: userState?.arenaWins || 0
      });
    }
  }, [user, userState?.arenaRating, userState?.masteryTokens, userState?.arenaWins]);

  const handleSearchMatch = async () => {
    triggerHaptic('medium');
    if (!user) {
      setGuestWarning(true);
      setTimeout(() => setGuestWarning(false), 3000);
      return;
    }
    setMatchState('searching');

    try {
      const q = query(collection(db, 'arena_matches'), where('status', '==', 'waiting'));
      const snap = await getDocs(q);
      const available = snap.docs.filter(d => d.data().player1 !== user.uid);

      if (available.length > 0) {
        const matchDoc = available[0];
        await updateDoc(doc(db, 'arena_matches', matchDoc.id), {
          player2: user.uid,
          player2Name: user.displayName || 'Anonim',
          player2Photo: user.photoURL || '',
          player2Rating: userStats.rating,
          status: 'matched'
        });
        setMatchId(matchDoc.id);
      } else {
        const randomTask = TEST_TASKS[Math.floor(Math.random() * TEST_TASKS.length)];
        const newMatchRef = doc(collection(db, 'arena_matches'));
        await setDoc(newMatchRef, {
          player1: user.uid,
          player1Name: user.displayName || 'Anonim',
          player1Photo: user.photoURL || '',
          player1Rating: userStats.rating,
          status: 'waiting',
          task: randomTask,
          createdAt: serverTimestamp()
        });
        setMatchId(newMatchRef.id);

        const timer = setTimeout(async () => {
          const checkSnap = await getDocs(query(collection(db, 'arena_matches'), where('player1', '==', user.uid), where('status', '==', 'waiting')));
          if (!checkSnap.empty) {
            await updateDoc(doc(db, 'arena_matches', newMatchRef.id), {
              player2: 'bot-id',
              player2Name: 'Maturzysta AI',
              player2Photo: '',
              player2Rating: Math.floor(userStats.rating * (0.9 + Math.random() * 0.2)),
              status: 'matched'
            });
          }
        }, 3500);
        setBotTimerId(timer);
      }
    } catch {
      setMatchState('idle');
    }
  };

  const handleCancelSearch = async () => {
    triggerHaptic('light');
    if (botTimerId) clearTimeout(botTimerId);
    if (matchId) {
      try {
        await updateDoc(doc(db, 'arena_matches', matchId), { status: 'cancelled' });
      } catch {
        // ignore
      }
    }
    setMatchState('idle');
    setMatchId(null);
  };

  useEffect(() => {
    if (!matchId) return;
    const unsub = onSnapshot(doc(db, 'arena_matches', matchId), (snap) => {
      if (!snap.exists()) return;
      const data = snap.data();
      setMatchData(data);

      if (data.status === 'matched' && matchState === 'searching') {
        setMatchState('matched');
        setTimeout(() => {
          setMatchState('active');
        }, 2200);
      } else if (data.status === 'finished') {
        setMatchState('finished');
      }
    });

    return () => unsub();
  }, [matchId, matchState]);

  const handleAnswer = async (userAnswer: boolean) => {
    if (!matchId || !matchData || matchState !== 'active') return;
    triggerHaptic('medium');

    const isCorrect = userAnswer === matchData.task.answer;
    const winnerId = isCorrect ? user?.uid : (matchData.player1 === user?.uid ? matchData.player2 : matchData.player1);

    await updateDoc(doc(db, 'arena_matches', matchId), {
      status: 'finished',
      winner: winnerId,
      endedAt: serverTimestamp()
    });

    if (winnerId === user?.uid) {
      triggerHaptic('success');
      confetti({ particleCount: 70, spread: 60, origin: { y: 0.6 } });
      if (user) {
        const bonusPct = userState?.perks?.arenaTokenBonusPercent || 0;
        const tokensAwarded = Math.round(10 * (1 + bonusPct / 100));
        await updateDoc(doc(db, 'users', user.uid), {
          arenaRating: increment(25),
          masteryTokens: increment(tokensAwarded),
          arenaWins: increment(1)
        });
      }
      if (onUpdateUserState && saveUserData) {
        onUpdateUserState(prev => {
          const bonusPct = prev.perks?.arenaTokenBonusPercent || 0;
          const tokensAwarded = Math.round(10 * (1 + bonusPct / 100));
          const updated: UserState = {
            ...prev,
            arenaRating: (prev.arenaRating || 1000) + 25,
            masteryTokens: (prev.masteryTokens || 0) + tokensAwarded,
            arenaWins: (prev.arenaWins || 0) + 1
          };
          saveUserData(updated);
          return updated;
        });
      }
    } else {
      triggerHaptic('error');
      const shieldsAvailable = userState?.perks?.arenaShields || 0;
      if (shieldsAvailable > 0) {
        setShieldProtected(true);
        if (onUpdateUserState && saveUserData) {
          onUpdateUserState(prev => {
            const updated: UserState = {
              ...prev,
              perks: {
                ...prev.perks,
                arenaShields: Math.max(0, (prev.perks?.arenaShields || 1) - 1)
              }
            };
            saveUserData(updated);
            return updated;
          });
        }
      } else {
        setShieldProtected(false);
        if (user) {
          await updateDoc(doc(db, 'users', user.uid), {
            arenaRating: increment(-15)
          });
        }
        if (onUpdateUserState && saveUserData) {
          onUpdateUserState(prev => {
            const updated: UserState = {
              ...prev,
              arenaRating: Math.max(0, (prev.arenaRating || 1000) - 15)
            };
            saveUserData(updated);
            return updated;
          });
        }
      }
    }
  };

  const handleLeaveMatch = () => {
    setMatchId(null);
    setMatchData(null);
    setMatchState('idle');
    setShieldProtected(false);
  };

  return (
    <div className="flex flex-col p-4 sm:p-6 pb-24 min-h-full max-w-xl mx-auto w-full">
      {/* NAGŁÓWEK ARENY */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-slate-900 dark:text-white mb-0.5">Arena</h1>
          <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">Pojedynki maturalne na wiedzę w czasie rzeczywistym.</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-[11px] text-slate-400 dark:text-slate-500 font-medium">Żetony Mistrza</span>
            <div className="flex items-center gap-1 text-amber-700 dark:text-amber-400 font-bold text-sm">
              <Crown size={14} />
              {userStats.masteryTokens}
            </div>
          </div>
          <div className="w-10 h-10 bg-amber-500/10 rounded-xl border border-amber-500/20 flex items-center justify-center relative">
            <Swords className="text-amber-700 dark:text-amber-400" size={20} />
            <div className="absolute -top-1 -right-1 bg-emerald-500 rounded-full border-2 border-white dark:border-[#0B0F17] w-3.5 h-3.5" />
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400 mb-6 bg-emerald-50 dark:bg-emerald-950/20 w-fit px-3 py-1.5 rounded-full border border-emerald-200 dark:border-emerald-800/40">
        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
        {onlineCount} GRACZY ONLINE
      </div>

      {matchState === 'idle' && (
        <div className="bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 rounded-xl p-1 mb-6 flex shadow-inner">
          <button 
            type="button"
            onClick={() => { triggerHaptic('light'); setActiveTab('play'); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'play' 
                ? 'btn-depth-secondary text-slate-900 dark:text-white' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            ZAGRAJ
          </button>
          <button 
            type="button"
            onClick={() => { triggerHaptic('light'); setActiveTab('leaderboard'); }}
            className={`flex-1 py-2.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
              activeTab === 'leaderboard' 
                ? 'btn-depth-secondary text-slate-900 dark:text-white' 
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            RANKING TOP 10
          </button>
        </div>
      )}

      {activeTab === 'play' && (
        <div className="flex-1 flex flex-col h-full relative">
          <AnimatePresence mode="wait">
            {matchState === 'idle' && (
              <motion.div 
                key="idle"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="flex-1 flex flex-col items-center justify-center py-6"
              >
                <div className="mb-8 flex flex-col items-center">
                  <div className="text-slate-400 dark:text-slate-500 text-xs font-bold tracking-wider uppercase mb-2">Twój Ranking ELO</div>
                  <div className="text-4xl font-display font-bold text-slate-900 dark:text-white flex items-center gap-3">
                    {userStats.rating} <Medal className="text-amber-500" size={32} />
                  </div>
                  <div className="text-xs text-slate-500 dark:text-slate-400 mt-1.5">{userStats.wins} wygranych pojedynków</div>

                  {/* Active Perks Badges */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
                    {(userState?.perks?.arenaShields || 0) > 0 && (
                      <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 px-3 py-1 rounded-full flex items-center gap-1.5">
                        <ShieldCheck size={13} />
                        {userState?.perks?.arenaShields}x Tarcza ELO
                      </span>
                    )}
                    {(userState?.perks?.arenaTokenBonusPercent || 0) > 0 && (
                      <span className="text-[11px] font-bold text-amber-800 dark:text-amber-400 bg-amber-500/10 border border-amber-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                        <Crown size={13} />
                        +{userState?.perks?.arenaTokenBonusPercent}% bonus Żetonów
                      </span>
                    )}
                  </div>
                </div>

                {guestWarning && (
                  <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-300 dark:border-amber-800 text-amber-800 dark:text-amber-300 text-xs px-4 py-2.5 rounded-xl mb-4 font-bold">
                    Zaloguj się kontem Google w profilu, aby rywalizować w Arenie 1v1!
                  </div>
                )}

                <div className="relative w-44 h-44 mb-8">
                  <button 
                    type="button"
                    onClick={handleSearchMatch}
                    className="w-full h-full btn-depth-primary rounded-3xl flex flex-col items-center justify-center cursor-pointer"
                  >
                    <Swords size={36} className="text-slate-950 mb-2" />
                    <span className="font-display font-bold text-slate-950 text-lg tracking-wide uppercase">Graj 1v1</span>
                  </button>
                </div>
                
                <p className="text-xs text-slate-500 dark:text-slate-400 text-center max-w-[260px] leading-relaxed">
                  Odpowiedz poprawnie szybciej niż przeciwnik, aby awansować w ogólnopolskim rankingu.
                </p>
              </motion.div>
            )}

            {matchState === 'searching' && (
              <motion.div 
                key="searching"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center py-10"
              >
                <div className="relative mb-6">
                  <div className="w-28 h-28 rounded-full border-4 border-slate-200 dark:border-slate-800 flex items-center justify-center">
                    <div className="w-24 h-24 rounded-full border-4 border-amber-500 border-t-transparent animate-spin" />
                    <div className="absolute inset-0 flex items-center justify-center">
                      {user?.photoURL ? (
                        <img src={user.photoURL} alt="User avatar" className="w-20 h-20 rounded-full object-cover" />
                      ) : (
                        <Users size={28} className="text-slate-400" />
                      )}
                    </div>
                  </div>
                </div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-1">Szukanie rywala...</h3>
                <p className="text-slate-500 dark:text-slate-400 text-xs mb-8">Dopasowywanie zbliżonego rankingu ELO</p>
                <button 
                  type="button"
                  onClick={handleCancelSearch}
                  className="px-6 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-medium text-xs transition-colors cursor-pointer"
                >
                  Anuluj
                </button>
              </motion.div>
            )}

            {matchState === 'matched' && matchData && (
              <motion.div 
                key="matched"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center py-8"
              >
                <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-8 w-full max-w-sm justify-center">
                  <div className="flex flex-col items-center bg-white dark:bg-[#131B29] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs w-36">
                    <div className="w-14 h-14 rounded-full overflow-hidden mb-2 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      {user?.photoURL ? <img src={user.photoURL} alt="Avatar" className="w-full h-full object-cover" /> : <Users size={22} className="text-slate-400" />}
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white text-center truncate w-full">{user?.displayName || 'Ty'}</div>
                    <span className="text-xs text-amber-700 dark:text-amber-400 font-bold">{userStats.rating} ELO</span>
                  </div>

                  <span className="font-display font-black text-slate-400 dark:text-slate-500 text-lg">VS</span>

                  <div className="flex flex-col items-center bg-white dark:bg-[#131B29] border border-slate-200 dark:border-slate-800 rounded-2xl p-4 shadow-xs w-36">
                    <div className="w-14 h-14 rounded-full overflow-hidden mb-2 bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
                      {matchData.player1 === user?.uid ? (
                        matchData.player2Photo ? <img src={matchData.player2Photo} alt="Opponent" className="w-full h-full object-cover" /> : <Users size={22} className="text-slate-400" />
                      ) : (
                        matchData.player1Photo ? <img src={matchData.player1Photo} alt="Opponent" className="w-full h-full object-cover" /> : <Users size={22} className="text-slate-400" />
                      )}
                    </div>
                    <div className="text-sm font-bold text-slate-900 dark:text-white text-center truncate w-full">
                      {matchData.player1 === user?.uid ? matchData.player2Name : matchData.player1Name}
                    </div>
                    <span className="text-xs text-amber-700 dark:text-amber-400 font-bold">
                      {matchData.player1 === user?.uid ? matchData.player2Rating : matchData.player1Rating} ELO
                    </span>
                  </div>
                </div>

                <div className="mt-8 text-xs text-slate-400 font-medium animate-pulse">
                  Pojedynek startuje za chwilę...
                </div>
              </motion.div>
            )}

            {matchState === 'active' && matchData && (
              <motion.div 
                key="active"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 flex flex-col bg-white dark:bg-[#131B29] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs"
              >
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800 mb-6">
                  <span className="text-xs font-bold text-amber-700 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Zap size={14} className="fill-amber-500" /> Szybka odpowiedź
                  </span>
                  <span className="text-xs text-slate-400 font-medium">Prawda czy Fałsz?</span>
                </div>
                
                <div className="flex-1 flex flex-col items-center justify-center text-center my-6">
                  <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white leading-relaxed max-w-md">
                    {matchData.task.question}
                  </h2>
                </div>

                <div className="grid grid-cols-2 gap-3 w-full max-w-md mx-auto">
                  <button 
                    type="button"
                    onClick={() => handleAnswer(true)}
                    className="py-4 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/20 dark:hover:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800/40 rounded-xl text-emerald-700 dark:text-emerald-400 font-bold text-base transition-all active:scale-95 cursor-pointer shadow-xs"
                  >
                    PRAWDA
                  </button>
                  <button 
                    type="button"
                    onClick={() => handleAnswer(false)}
                    className="py-4 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/20 dark:hover:bg-rose-950/40 border border-rose-300 dark:border-rose-800/40 rounded-xl text-rose-700 dark:text-rose-400 font-bold text-base transition-all active:scale-95 cursor-pointer shadow-xs"
                  >
                    FAŁSZ
                  </button>
                </div>
              </motion.div>
            )}

            {matchState === 'finished' && matchData && (
              <motion.div 
                key="finished"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col items-center justify-center bg-white dark:bg-[#131B29] border border-slate-200 dark:border-slate-800 rounded-2xl p-6 shadow-xs text-center"
              >
                <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mb-4">
                  {matchData.winner === user?.uid ? (
                    <Trophy size={32} className="text-amber-500" />
                  ) : (
                    <X size={32} className="text-rose-500" />
                  )}
                </div>
                <h2 className="text-2xl font-display font-bold text-slate-900 dark:text-white mb-2">
                  {matchData.winner === user?.uid ? 'Zwycięstwo!' : 'Porażka'}
                </h2>
                <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm mb-6 max-w-xs">
                  {matchData.winner === user?.uid 
                    ? 'Świetny refleks i poprawna odpowiedź!' 
                    : 'Rywal był szybszy lub odpowiedź była błędna.'}
                </p>

                {matchData.winner === user?.uid ? (
                  <div className="flex gap-3 mb-8">
                    <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl px-4 py-2.5 flex flex-col items-center">
                      <span className="text-emerald-700 dark:text-emerald-400 font-bold text-lg">+25</span>
                      <span className="text-[10px] text-emerald-600/70 font-bold uppercase">Rating ELO</span>
                    </div>
                    <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl px-4 py-2.5 flex flex-col items-center">
                      <span className="text-amber-700 dark:text-amber-400 font-bold text-lg">
                        +{Math.round(10 * (1 + (userState?.perks?.arenaTokenBonusPercent || 0) / 100))}
                      </span>
                      <span className="text-[10px] text-amber-700/70 dark:text-amber-400/70 font-bold uppercase">Żetony</span>
                    </div>
                  </div>
                ) : (
                  <div className="mb-8">
                    {shieldProtected ? (
                      <div className="bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-800/40 rounded-xl p-3 flex items-center gap-2 text-left max-w-xs text-xs text-emerald-800 dark:text-emerald-300 font-medium">
                        <ShieldCheck size={18} className="text-emerald-600 shrink-0" />
                        <span>Tarcza ELO ochroniła Twój ranking przed spadkiem.</span>
                      </div>
                    ) : (
                      <div className="bg-rose-50 dark:bg-rose-950/20 border border-rose-200 dark:border-rose-900/40 rounded-xl px-5 py-2.5 flex flex-col items-center">
                        <span className="text-rose-700 dark:text-rose-400 font-bold text-lg">-15</span>
                        <span className="text-[10px] text-rose-600/70 font-bold uppercase">Rating ELO</span>
                      </div>
                    )}
                  </div>
                )}

                <button 
                  type="button"
                  onClick={handleLeaveMatch}
                  className="py-3 px-8 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors cursor-pointer shadow-xs"
                >
                  Wróć do Areny
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {activeTab === 'leaderboard' && matchState === 'idle' && (
        <motion.div 
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col"
        >
          <div className="bg-white dark:bg-[#131B29] border border-slate-200 dark:border-slate-800 rounded-2xl overflow-hidden shadow-xs">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
              <h3 className="text-slate-900 dark:text-white font-bold text-sm flex items-center gap-2">
                <Trophy size={16} className="text-amber-500" />
                Ogólnopolski Ranking Top 10
              </h3>
            </div>
            <div className="flex flex-col divide-y divide-slate-100 dark:divide-slate-800">
              {leaderboard.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs">Trwa ładowanie rankingu...</div>
              ) : (
                leaderboard.map((player, idx) => (
                  <div key={player.id} className={`flex items-center justify-between p-3.5 ${player.id === user?.uid ? 'bg-amber-50/50 dark:bg-amber-950/10' : ''}`}>
                    <div className="flex items-center gap-3">
                      <div className={`w-5 text-center font-bold text-xs ${idx === 0 ? 'text-amber-500' : idx === 1 ? 'text-slate-400' : idx === 2 ? 'text-amber-700' : 'text-slate-400'}`}>
                        #{idx + 1}
                      </div>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                          {player.photoURL ? <img src={player.photoURL} alt="Avatar" className="w-full h-full object-cover" /> : <Users size={12} className="text-slate-400" />}
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">{player.displayName || 'Anonim'}</div>
                          <div className="text-[10px] text-slate-400">{player.arenaWins || 0} wygranych</div>
                        </div>
                      </div>
                    </div>
                    <div className="font-bold text-amber-700 dark:text-amber-400 text-xs">
                      {player.arenaRating || 1000} ELO
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </motion.div>
      )}
    </div>
  );
}

export default ArenaView;
