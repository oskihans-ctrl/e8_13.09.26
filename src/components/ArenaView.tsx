import { useState, useEffect } from 'react';
import { Swords, Trophy, Users, Loader2, X, Crown, Medal, Check, Zap, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { triggerHaptic } from '../utils';
import { db, auth } from '../firebase';
import { useAuthState } from 'react-firebase-hooks/auth';
import { collection, query, where, getDocs, getDoc, setDoc, doc, onSnapshot, serverTimestamp, updateDoc, increment, orderBy, limit, getCountFromServer } from 'firebase/firestore';
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
          setOnlineCount(Math.max(1, snap.data().count)); // At least 1 (themselves)
        } catch(e) {}
      };
      fetchOnlineCount();

      const fetchLeaderboard = async () => {
        try {
          const q = query(collection(db, 'users'), orderBy('arenaRating', 'desc'), limit(10));
          const snap = await getDocs(q);
          const lb = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          setLeaderboard(lb);
        } catch(e) {}
      };
      fetchLeaderboard();

      const int1 = setInterval(updatePresence, 60000);
      const int2 = setInterval(fetchOnlineCount, 30000);

      return () => {
        unsubUser();
        clearInterval(int1);
        clearInterval(int2);
      };
    }
  }, [user]);

  useEffect(() => {
    if (matchId) {
      const matchRef = doc(db, 'matches', matchId);
      const unsub = onSnapshot(matchRef, (snap) => {
        if (snap.exists()) {
          const data = snap.data();
          setMatchData(data);
          
          if (data.status === 'matched' && matchState === 'searching') {
            setMatchState('matched');
            triggerHaptic('success');
            // Transition to active after 3 seconds
            setTimeout(() => {
               setMatchState('active');
               if (data.player1 === user?.uid) {
                 updateDoc(matchRef, { status: 'active' });
               }
            }, 3500);
          } else if (data.status === 'active' && matchState !== 'active' && matchState !== 'finished') {
             setMatchState('active');
          } else if (data.status === 'finished' && matchState !== 'finished') {
            setMatchState('finished');
            triggerHaptic('heavy');
          }
        }
      }, (error) => {
        handleFirestoreError(error, OperationType.GET, `matches/${matchId}`);
      });
      return () => unsub();
    }
  }, [matchId, matchState, user]);

  useEffect(() => {
    // Bot logic: if we are searching, and match is waiting, after 5s make it a bot match
    if (matchState === 'searching' && matchData?.status === 'waiting' && matchData?.player1 === user?.uid) {
       const tid = setTimeout(async () => {
         const botRating = Math.max(100, userStats.rating + Math.floor(Math.random() * 40 - 20));
         await updateDoc(doc(db, 'matches', matchId!), {
           player2: 'bot_' + Date.now(),
           player2Name: 'Bot Master',
           player2Photo: 'https://api.dicebear.com/7.x/bottts/svg?seed=' + Math.random(),
           player2Rating: botRating,
           status: 'matched',
           isBotMatch: true
         });
       }, 5000);
       setBotTimerId(tid);
       return () => clearTimeout(tid);
    }
  }, [matchState, matchData, user, matchId, userStats.rating]);
  
  // Bot playing logic
  useEffect(() => {
    if (matchState === 'active' && matchData?.isBotMatch && matchData?.status === 'active') {
      const botSolveTime = 3000 + Math.random() * 7000; // 3-10s
      const botCorrectProb = 0.7; // 70% chance to be right
      
      const timer = setTimeout(async () => {
         // check if match not finished yet
         const md = await getDoc(doc(db, 'matches', matchId));
         if (md.exists() && md.data().status === 'active') {
            const isCorrect = Math.random() < botCorrectProb;
            if (isCorrect) {
              await updateDoc(doc(db, 'matches', matchId!), {
                status: 'finished',
                winner: matchData.player2,
                finishedAt: serverTimestamp()
              });
            } else {
               // bot answered wrong, if player hasn't answered, player wins
              await updateDoc(doc(db, 'matches', matchId!), {
                status: 'finished',
                winner: matchData.player1,
                finishedAt: serverTimestamp()
              });
            }
         }
      }, botSolveTime);
      return () => clearTimeout(timer);
    }
  }, [matchState, matchData, matchId]);

  const handleSearchMatch = async () => {
    if (!user) {
      setGuestWarning(true);
      setTimeout(() => setGuestWarning(false), 4000);
      return;
    }
    triggerHaptic('heavy');
    setMatchState('searching');
    setShieldProtected(false);
    
    try {
      const matchesRef = collection(db, 'matches');
      const q = query(matchesRef, where('status', '==', 'waiting'));
      const snap = await getDocs(q);
      
      let foundMatch = false;
      for (const d of snap.docs) {
        const data = d.data();
        if (data.player1 !== user.uid) {
          foundMatch = true;
          setMatchId(d.id);
          await updateDoc(doc(db, 'matches', d.id), {
            player2: user.uid,
            player2Name: user.displayName || 'Gracz',
            player2Photo: user.photoURL || '',
            player2Rating: userStats.rating,
            status: 'matched'
          });
          break;
        }
      }
      
      if (!foundMatch) {
        const newMatchRef = doc(matchesRef);
        const randomTask = TEST_TASKS[Math.floor(Math.random() * TEST_TASKS.length)];
        await setDoc(newMatchRef, {
          player1: user.uid,
          player1Name: user.displayName || 'Gracz',
          player1Photo: user.photoURL || '',
          player1Rating: userStats.rating,
          status: 'waiting',
          task: randomTask,
          createdAt: serverTimestamp()
        });
        setMatchId(newMatchRef.id);
      }
    } catch(e) {
      console.error(e);
      setMatchState('idle');
    }
  };

  const handleCancelSearch = async () => {
    if (matchId && matchState === 'searching') {
      if (botTimerId) clearTimeout(botTimerId);
      await updateDoc(doc(db, 'matches', matchId), { status: 'cancelled' });
      setMatchId(null);
      setMatchState('idle');
    }
  };

  const handleAnswer = async (answer: boolean) => {
    if (!user || !matchId || !matchData || matchData.status !== 'active') return;
    
    const isCorrect = answer === matchData.task.answer;
    
    // First to answer: if correct -> wins. if wrong -> loses.
    const winnerId = isCorrect ? user.uid : (matchData.player1 === user.uid ? matchData.player2 : matchData.player1);
    
    await updateDoc(doc(db, 'matches', matchId), {
      status: 'finished',
      winner: winnerId,
      finishedAt: serverTimestamp()
    });

    const tokenBonusPct = userState?.perks?.arenaTokenBonusPercent || 0;
    const tokensGained = Math.round(10 * (1 + tokenBonusPct / 100));
    
    if (winnerId === user.uid) {
      const userRef = doc(db, 'users', user.uid);
      await updateDoc(userRef, {
        arenaRating: increment(25),
        arenaWins: increment(1),
        masteryTokens: increment(tokensGained)
      });
      if (onUpdateUserState && saveUserData) {
        onUpdateUserState(prev => {
          const updated: UserState = {
            ...prev,
            arenaRating: (prev.arenaRating || 1000) + 25,
            arenaWins: (prev.arenaWins || 0) + 1,
            masteryTokens: (prev.masteryTokens || 0) + tokensGained
          };
          saveUserData(updated);
          return updated;
        });
      }
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
    } else {
      const shields = userState?.perks?.arenaShields || 0;
      if (shields > 0) {
        setShieldProtected(true);
        if (onUpdateUserState && saveUserData) {
          onUpdateUserState(prev => {
            const updated: UserState = {
              ...prev,
              perks: {
                ...prev.perks!,
                arenaShields: Math.max(0, (prev.perks?.arenaShields || 1) - 1)
              }
            };
            saveUserData(updated);
            return updated;
          });
        }
      } else {
        const userRef = doc(db, 'users', user.uid);
        await updateDoc(userRef, {
          arenaRating: increment(-15)
        });
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
    <div className="flex flex-col p-5 sm:p-6 pt-6 pb-[140px] min-h-full max-w-xl mx-auto w-full">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display text-2xl font-bold text-white mb-1">Arena</h1>
          <p className="text-[#8B8D98] text-sm">Pojedynki na wiedzę w czasie rzeczywistym.</p>
    
    </div>
        <div className="flex items-center gap-3">
          <div className="flex flex-col items-end">
            <span className="text-xs text-[#8B8D98] font-medium">Mastery Tokens</span>
            <div className="flex items-center gap-1.5 text-sky-400 font-bold">
              <Crown size={14} />
              {userStats.masteryTokens}
        
    </div>
      
    </div>
          <div className="w-12 h-12 bg-red-500/10 rounded-[16px] border border-red-500/20 flex items-center justify-center relative">
            <Swords className="text-red-500" size={24} />
            <div className="absolute -top-1.5 -right-1.5 bg-green-500 rounded-full border-2 border-[#0A0A0B] w-4 h-4"></div>
      
    </div>
    
    </div>
  
    </div>

      <div className="flex items-center gap-2 text-xs font-bold text-green-400 mb-6 bg-green-500/10 w-fit px-3 py-1.5 rounded-full border border-green-500/20">
        <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
        {onlineCount} GRACZY ONLINE
  
    </div>

      {matchState === 'idle' && (
        <div className="bg-[#141A23] border border-white/5 rounded-[20px] p-1.5 mb-8 flex">
          <button 
            onClick={() => { triggerHaptic('light'); setActiveTab('play'); }}
            className={`flex-1 py-3 text-xs font-bold tracking-wide rounded-[16px] transition-all ${activeTab === 'play' ? 'bg-white/10 text-white shadow-lg' : 'text-[#8B8D98] hover:text-white'}`}
          >
            GRAJ
          </button>
          <button 
            onClick={() => { triggerHaptic('light'); setActiveTab('leaderboard'); }}
            className={`flex-1 py-3 text-xs font-bold tracking-wide rounded-[16px] transition-all ${activeTab === 'leaderboard' ? 'bg-white/10 text-white shadow-lg' : 'text-[#8B8D98] hover:text-white'}`}
          >
            RANKING
          </button>
    
    </div>
      )}

      {activeTab === 'play' && (
        <div className="flex-1 flex flex-col h-full relative">
          <AnimatePresence mode="wait">
            {matchState === 'idle' && (
              <motion.div 
                key="idle"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex-1 flex flex-col items-center justify-center py-6"
              >
                <div className="mb-8 flex flex-col items-center">
                  <div className="text-[#8B8D98] text-xs font-bold tracking-wider uppercase mb-2">Twój Ranking</div>
                  <div className="text-4xl font-display font-bold text-white flex items-center gap-3">
                    {userStats.rating} <Medal className="text-blue-400" size={28} />
              
    </div>
                  <div className="text-sm text-white/50 mt-2">{userStats.wins} wygranych pojedynków</div>

                  {/* Active Perks Badges */}
                  <div className="flex items-center gap-2 mt-3 flex-wrap justify-center">
                    {(userState?.perks?.arenaShields || 0) > 0 && (
                      <span className="text-[11px] font-bold text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                        <ShieldCheck size={13} />
                        {userState?.perks?.arenaShields}x Tarcza ELO
                      </span>
                    )}
                    {(userState?.perks?.arenaTokenBonusPercent || 0) > 0 && (
                      <span className="text-[11px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
                        <Crown size={13} />
                        +{userState?.perks?.arenaTokenBonusPercent}% bonus Żetonów
                      </span>
                    )}
              
    </div>
            
    </div>

                {guestWarning && (
                  <div className="bg-sky-500/20 border border-sky-500/30 text-sky-200 text-xs px-4 py-2 rounded-xl mb-4 font-bold animate-pulse">
                    Zaloguj się z Google w profilu, aby rywalizować w Arenie 1v1!
              
    </div>
                )}

                <motion.div 
                  animate={{ scale: [1, 1.05, 1] }} 
                  transition={{ repeat: Infinity, duration: 2.5, ease: "easeInOut" }}
                  className="relative w-48 h-48 mb-10"
                >
                  <div className="absolute inset-0 bg-red-500/20 rounded-full blur-[40px]"></div>
                  <button 
                    onClick={handleSearchMatch}
                    className="absolute inset-4 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex flex-col items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.4)] border border-red-400/50 hover:scale-105 transition-transform"
                  >
                    <Swords size={32} className="text-white mb-2" />
                    <span className="font-display font-bold text-white text-lg tracking-wide uppercase">Graj 1v1</span>
                  </button>
                </motion.div>
                
                <p className="text-sm text-[#8B8D98] text-center max-w-[240px] leading-relaxed">
                  Zdobądź szybką odpowiedź szybciej niż przeciwnik, aby awansować w rankingu.
                </p>
              </motion.div>
            )}

            {matchState === 'searching' && (
              <motion.div 
                key="searching"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center"
              >
                <div className="relative mb-8">
                  <div className="w-32 h-32 rounded-full border-4 border-white/5 flex items-center justify-center">
                     <div className="w-28 h-28 rounded-full border-4 border-red-500 border-t-transparent animate-spin"></div>
                     <div className="absolute inset-0 flex items-center justify-center">
                        {user?.photoURL ? (
                           <img src={user.photoURL} className="w-24 h-24 rounded-full object-cover grayscale opacity-50" />
                        ) : (
                           <Users size={32} className="text-white/20" />
                        )}
                 
    </div>
              
    </div>
            
    </div>
                <h3 className="text-xl font-bold text-white mb-2 tracking-wide">Szukanie przeciwnika...</h3>
                <p className="text-[#8B8D98] text-sm mb-12">Jeżeli nie znajdziemy gracza, otrzymasz bota</p>
                <button 
                  onClick={handleCancelSearch}
                  className="px-6 py-3 rounded-full bg-white/5 text-white/70 hover:bg-white/10 hover:text-white font-medium transition-colors"
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
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex-1 flex flex-col items-center justify-center absolute inset-0 z-50 bg-[#0A0A0B] pb-10 px-6"
              >
                <motion.div 
                  initial={{ y: -100, opacity: 0, scale: 0.8 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.1 }}
                  className="flex flex-col items-center bg-[#1A1B23] border border-white/10 rounded-[24px] p-6 pb-8 shadow-2xl relative overflow-hidden w-full max-w-[260px] z-10"
                >
                  <motion.div 
                     initial={{ rotate: 0 }}
                     animate={{ rotate: 360 }}
                     transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                     className="absolute -inset-[100%] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(59,130,246,0.3)_360deg)]"
                  />
                  <div className="absolute inset-[2px] bg-[#1A1B23] rounded-[22px] z-0"></div>
                  
                  <div className="z-10 flex flex-col items-center">
                     <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-blue-500 shadow-[0_0_30px_rgba(59,130,246,0.4)] mb-3 bg-white/5 flex items-center justify-center">
                        {user?.photoURL ? <img src={user.photoURL} className="w-full h-full object-cover" /> : <Users size={28} className="text-white/20" />}
                 
    </div>
                     <div className="text-xl font-bold text-white mb-2 text-center leading-tight line-clamp-1">{user?.displayName || 'Ty'}</div>
                     <div className="flex items-center gap-1.5 bg-blue-500/10 px-3 py-1 rounded-full border border-blue-500/20">
                       <Trophy size={12} className="text-blue-400" />
                       <span className="text-blue-400 font-bold text-xs">{userStats.rating} ELO</span>
                 
    </div>
              
    </div>
                </motion.div>

                <motion.div 
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: 'spring', delay: 0.4, stiffness: 200 }}
                  className="w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-[0_0_40px_rgba(239,68,68,0.5)] z-20 relative -my-6 border-4 border-[#0A0A0B]"
                >
                  <span className="font-display font-black text-xl text-white italic">VS</span>
                </motion.div>

                <motion.div 
                  initial={{ y: 100, opacity: 0, scale: 0.8 }}
                  animate={{ y: 0, opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.6 }}
                  className="flex flex-col items-center bg-[#1A1B23] border border-white/10 rounded-[24px] p-6 pt-8 shadow-2xl relative overflow-hidden w-full max-w-[260px] z-10"
                >
                  <motion.div 
                     initial={{ rotate: 0 }}
                     animate={{ rotate: 360 }}
                     transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                     className="absolute -inset-[100%] bg-[conic-gradient(from_0deg,transparent_0_340deg,rgba(239,68,68,0.3)_360deg)]"
                  />
                  <div className="absolute inset-[2px] bg-[#1A1B23] rounded-[22px] z-0"></div>

                  <div className="z-10 flex flex-col items-center">
                     <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-red-500 shadow-[0_0_30px_rgba(239,68,68,0.4)] mb-3 bg-white/5 flex items-center justify-center">
                        {matchData.player1 === user?.uid ? (
                          matchData.player2Photo ? <img src={matchData.player2Photo} className="w-full h-full object-cover bg-white" /> : <Users size={28} className="text-white/20" />
                        ) : (
                          matchData.player1Photo ? <img src={matchData.player1Photo} className="w-full h-full object-cover bg-white" /> : <Users size={28} className="text-white/20" />
                        )}
                 
    </div>
                     <div className="text-xl font-bold text-white mb-2 text-center leading-tight line-clamp-1">
                        {matchData.player1 === user?.uid ? matchData.player2Name : matchData.player1Name}
                 
    </div>
                     <div className="flex items-center gap-1.5 bg-red-500/10 px-3 py-1 rounded-full border border-red-500/20">
                       <Trophy size={12} className="text-red-400" />
                       <span className="text-red-400 font-bold text-xs">
                          {matchData.player1 === user?.uid ? matchData.player2Rating : matchData.player1Rating} ELO
                       </span>
                 
    </div>
              
    </div>
                </motion.div>
                
                <motion.div 
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 1.5 }}
                  className="absolute bottom-6 text-white/50 text-sm animate-pulse font-medium tracking-wide z-10"
                >
                  Przygotuj się na pojedynek...
                </motion.div>
              </motion.div>
            )}

            {matchState === 'active' && matchData && (
              <motion.div 
                key="active"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex-1 flex flex-col absolute inset-0 z-50 bg-[#0A0A0B]"
              >
                <div className="flex items-center justify-between p-4 bg-white/5 border-b border-white/5 rounded-t-2xl">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400 font-bold text-xs shadow-[0_0_15px_rgba(59,130,246,0.2)]">TY</div>
                    <span className="font-medium text-white/30 text-xs">VS</span>
                    <div className="w-8 h-8 rounded-full bg-red-500/20 flex items-center justify-center text-red-400 font-bold text-xs shadow-[0_0_15px_rgba(239,68,68,0.2)]">
                      {(matchData.player1 === user?.uid ? (matchData.player2Name?.[0] || '?') : (matchData.player1Name?.[0] || '?')).toUpperCase()}
                
    </div>
              
    </div>
                  <div className="text-xs font-bold text-sky-400 animate-pulse flex items-center gap-1.5">
                    <Zap size={14} className="fill-sky-400" /> Kto pierwszy!
              
    </div>
            
    </div>
                
                <div className="flex-1 flex flex-col p-6 items-center justify-center">
                  <div className="text-center mb-12">
                    <div className="text-xs font-bold text-blue-400 uppercase tracking-widest mb-4">Zadanie typu Prawda/Fałsz</div>
                    <h2 className="text-2xl font-bold text-white leading-relaxed">
                      {matchData.task.question}
                    </h2>
              
    </div>
                  
                  <div className="flex gap-4 w-full max-w-sm">
                     <button 
                        onClick={() => handleAnswer(true)}
                        className="flex-1 py-6 bg-green-500/10 border border-green-500/30 rounded-2xl hover:bg-green-500/20 text-green-400 font-bold text-xl transition-all"
                     >
                       PRAWDA
                     </button>
                     <button 
                        onClick={() => handleAnswer(false)}
                        className="flex-1 py-6 bg-red-500/10 border border-red-500/30 rounded-2xl hover:bg-red-500/20 text-red-400 font-bold text-xl transition-all"
                     >
                       FAŁSZ
                     </button>
              
    </div>
            
    </div>
              </motion.div>
            )}

            {matchState === 'finished' && matchData && (
              <motion.div 
                key="finished"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex-1 flex flex-col items-center justify-center absolute inset-0 z-50 bg-[#0A0A0B]"
              >
                <div className="w-24 h-24 rounded-full bg-white/5 flex items-center justify-center mb-6">
                  {matchData.winner === user?.uid ? (
                    <Trophy size={48} className="text-sky-400 drop-shadow-[0_0_20px_rgba(14,165,233,0.5)]" />
                  ) : (
                    <X size={48} className="text-red-500 drop-shadow-[0_0_20px_rgba(239,68,68,0.4)]" />
                  )}
            
    </div>
                <h2 className="text-4xl font-display font-black text-white mb-2">
                  {matchData.winner === user?.uid ? 'ZWYCIĘSTWO!' : 'PORAŻKA'}
                </h2>
                <p className="text-[#8B8D98] mb-8 text-center max-w-xs">
                  {matchData.winner === user?.uid 
                    ? 'Byłeś szybszy i dokładniejszy od przeciwnika!' 
                    : 'Przeciwnik był szybszy lub udzieliłeś złej odpowiedzi. Spróbuj ponownie!'}
                </p>
                
                {matchData.winner === user?.uid && (
                  <div className="flex gap-4 mb-10">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl px-5 py-4 flex flex-col items-center gap-1">
                      <span className="text-emerald-400 font-black text-2xl">+25</span>
                      <span className="text-[10px] text-emerald-400/70 font-bold uppercase tracking-wider">Rating</span>
                
    </div>
                    <div className="bg-sky-500/10 border border-sky-500/20 rounded-2xl px-5 py-4 flex flex-col items-center gap-1">
                      <span className="text-sky-400 font-black text-2xl">
                        +{Math.round(10 * (1 + (userState?.perks?.arenaTokenBonusPercent || 0) / 100))}
                      </span>
                      <span className="text-[10px] text-sky-400/70 font-bold uppercase tracking-wider">
                        Tokens {(userState?.perks?.arenaTokenBonusPercent || 0) > 0 ? `(+${userState?.perks?.arenaTokenBonusPercent}%)` : ''}
                      </span>
                
    </div>
              
    </div>
                )}
                
                {matchData.winner !== user?.uid && (
                  <div className="flex flex-col items-center gap-3 mb-10">
                    {shieldProtected ? (
                      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 flex items-center gap-3 text-left max-w-xs">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0">
                          <ShieldCheck size={22} />
                    
    </div>
                        <div>
                          <span className="text-sm font-bold text-emerald-300 block">Tarcza ELO aktywowana!</span>
                          <span className="text-xs text-emerald-200/70 block">
                            0 ELO strat. Ochroniono Twój ranking! (Pozostało tarcz: {userState?.perks?.arenaShields || 0})
                          </span>
                    
    </div>
                  
    </div>
                    ) : (
                      <div className="bg-red-500/10 border border-red-500/20 rounded-2xl px-6 py-4 flex flex-col items-center gap-1">
                        <span className="text-red-400 font-black text-2xl">-15</span>
                        <span className="text-[10px] text-red-400/70 font-bold uppercase tracking-wider">Rating</span>
                  
    </div>
                    )}
              
    </div>
                )}

                <button 
                  onClick={handleLeaveMatch}
                  className="w-full max-w-[240px] py-4 bg-white text-black font-bold rounded-2xl hover:bg-gray-200 transition-colors shadow-[0_0_30px_rgba(255,255,255,0.2)]"
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
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex-1 flex flex-col"
        >
          <div className="bg-[#141A23] border border-white/5 rounded-[24px] overflow-hidden">
            <div className="p-5 border-b border-white/5 flex items-center justify-between">
              <h3 className="text-white font-bold flex items-center gap-2">
                <Trophy size={18} className="text-sky-400" />
                Top 10 Graczy
              </h3>
        
    </div>
            <div className="flex flex-col">
              {leaderboard.length === 0 ? (
                <div className="p-8 text-center text-[#8B8D98] text-sm">Brak graczy w rankingu.</div>
              ) : (
                leaderboard.map((player, idx) => (
                  <div key={player.id} className={`flex items-center justify-between p-4 ${idx !== leaderboard.length - 1 ? 'border-b border-white/5' : ''} ${player.id === user?.uid ? 'bg-white/5' : ''}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-6 text-center font-bold text-sm ${idx === 0 ? 'text-sky-400' : idx === 1 ? 'text-gray-300' : idx === 2 ? 'text-cyan-600' : 'text-[#8B8D98]'}`}>
                        #{idx + 1}
                  
    </div>
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center overflow-hidden">
                          {player.photoURL ? <img src={player.photoURL} alt="Avatar" className="w-full h-full object-cover" /> : <Users size={14} className="text-white/50" />}
                    
    </div>
                        <div>
                          <div className="text-sm font-medium text-white">{player.displayName || 'Anonim'}</div>
                          <div className="text-[10px] text-[#8B8D98]">{player.arenaWins || 0} wygranych</div>
                    
    </div>
                  
    </div>
                
    </div>
                    <div className="font-bold text-blue-400 text-sm">
                      {player.arenaRating || 1000}
                
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
