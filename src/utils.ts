export const playSuccessSound = () => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const audioCtx = new AudioContext();
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'sine';
    
    // Two notes (E5, A5) for a success chime
    oscillator.frequency.setValueAtTime(659.25, audioCtx.currentTime); 
    oscillator.frequency.setValueAtTime(880.00, audioCtx.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.2, audioCtx.currentTime + 0.05);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.5);
  } catch (e) {
    // Ignore if not supported or blocked
  }
};

export const playErrorSound = () => {
  if (typeof window === 'undefined') return;
  try {
    const AudioContext = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContext) return;
    const audioCtx = new AudioContext();
    
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    oscillator.type = 'triangle';
    oscillator.frequency.setValueAtTime(220, audioCtx.currentTime);
    oscillator.frequency.linearRampToValueAtTime(160, audioCtx.currentTime + 0.25);
    
    gainNode.gain.setValueAtTime(0, audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.18, audioCtx.currentTime + 0.04);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.35);
    
    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.35);
  } catch (e) {}
};

export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'warning' | 'error' = 'light') => {
  if (typeof window === 'undefined' || !window.navigator || !window.navigator.vibrate) {
    return;
  }

  try {
    switch (type) {
      case 'light':
        window.navigator.vibrate(10);
        break;
      case 'medium':
        window.navigator.vibrate(20);
        break;
      case 'heavy':
        window.navigator.vibrate(30);
        break;
      case 'success':
        window.navigator.vibrate([10, 30, 20]);
        break;
      case 'warning':
        window.navigator.vibrate([20, 20, 20]);
        break;
      case 'error':
        window.navigator.vibrate([50, 50, 50, 50]);
        break;
      default:
        window.navigator.vibrate(10);
    }
  } catch (e) {
    // Ignore if not supported or blocked
  }
};

/**
 * Returns a local date string in YYYY-MM-DD format
 */
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayDateString(): string {
  return getLocalDateString(new Date());
}

export function getYesterdayDateString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return getLocalDateString(d);
}

/**
 * Checks if the user has completed at least one task today
 */
export function isStreakCompletedToday(lastStreakDate?: string, streakActiveDates?: string[]): boolean {
  const today = getTodayDateString();
  if (lastStreakDate === today) return true;
  if (streakActiveDates && streakActiveDates.includes(today)) return true;
  return false;
}

export interface WeekDayStreakItem {
  dayLetter: string; // 'P' | 'W' | 'Ś' | 'C' | 'P' | 'S' | 'N'
  dayName: string;
  isToday: boolean;
  isCompleted: boolean;
  dateStr: string;
}

/**
 * Generates Monday-Sunday states for the current week based on completed task dates
 */
export function getCurrentWeekStreakDays(
  lastStreakDate?: string,
  streakActiveDates: string[] = []
): WeekDayStreakItem[] {
  const letters = ['P', 'W', 'Ś', 'C', 'P', 'S', 'N'];
  const fullNames = ['Poniedziałek', 'Wtorek', 'Środa', 'Czwartek', 'Piątek', 'Sobota', 'Niedziela'];
  const todayStr = getTodayDateString();

  const now = new Date();
  const dayOfWeek = now.getDay(); // 0 = Sunday, 1 = Monday...
  // Calculate Monday
  const diffToMonday = now.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1);
  const monday = new Date(now);
  monday.setDate(diffToMonday);
  monday.setHours(0, 0, 0, 0);

  const allDates = new Set(streakActiveDates || []);
  if (lastStreakDate) allDates.add(lastStreakDate);

  return letters.map((letter, i) => {
    const dayDate = new Date(monday);
    dayDate.setDate(monday.getDate() + i);
    const dateStr = getLocalDateString(dayDate);
    const isToday = dateStr === todayStr;
    const isCompleted = allDates.has(dateStr);

    return {
      dayLetter: letter,
      dayName: fullNames[i],
      isToday,
      isCompleted,
      dateStr
    };
  });
}

/**
 * Calculates updated streak state when completing a task
 */
export function calculateStreakOnTaskCompletion(
  currentStreakDays: number = 0,
  lastStreakDate?: string,
  streakActiveDates: string[] = []
): {
  newStreakDays: number;
  newLastStreakDate: string;
  newStreakActiveDates: string[];
  isFirstCompletionToday: boolean;
} {
  const today = getTodayDateString();
  const yesterday = getYesterdayDateString();
  const uniqueDates = new Set(streakActiveDates || []);
  uniqueDates.add(today);

  if (lastStreakDate === today) {
    // Already counted today
    return {
      newStreakDays: Math.max(1, currentStreakDays),
      newLastStreakDate: today,
      newStreakActiveDates: Array.from(uniqueDates),
      isFirstCompletionToday: false
    };
  }

  let newStreakDays = 1;
  if (lastStreakDate === yesterday) {
    // Continued consecutive streak
    newStreakDays = (currentStreakDays || 0) + 1;
  } else if (!lastStreakDate || currentStreakDays === 0) {
    // Starting fresh streak
    newStreakDays = 1;
  } else {
    // Broken streak, starting over
    newStreakDays = 1;
  }

  return {
    newStreakDays,
    newLastStreakDate: today,
    newStreakActiveDates: Array.from(uniqueDates),
    isFirstCompletionToday: true
  };
}

export interface StreakMilestoneDay {
  dayNumber: number; // e.g. 1, 2, 3, 4, 5, 6, 7 (or 8..14)
  shortLabel: string; // "D1", "D2", ...
  fullLabel: string; // "Dzień 1", "Dzień 2", ...
  isCompleted: boolean; // Has checkmark ✓
  isTargetToday: boolean; // Pulsing orange target for today
  isUpcoming: boolean; // Future milestone
}

/**
 * Returns a 7-day milestone block (e.g. Days 1-7, Days 8-14) representing
 * the student's continuous streak path instead of fixed calendar weekdays.
 */
export function getMilestoneStreakDays(
  streakDays: number = 0,
  lastStreakDate?: string,
  streakActiveDates: string[] = []
): {
  days: StreakMilestoneDay[];
  currentCycle: number;
  isCompletedToday: boolean;
  todayTargetDayNumber: number;
} {
  const isCompletedToday = isStreakCompletedToday(lastStreakDate, streakActiveDates);
  
  // Calculate which milestone window to display:
  // If streakDays === 0, window is 1..7, target today is Day 1.
  // If streakDays === 1 and completed today: window is 1..7, Day 1 has checkmark, next target is Day 2 (tomorrow).
  // If streakDays === 7 and completed today: window is 1..7, all 7 completed.
  // When streak reaches 8, window shifts to 8..14.
  const activeFocusDay = isCompletedToday ? Math.max(1, streakDays) : (streakDays + 1);
  const cycleIndex = Math.floor(Math.max(0, activeFocusDay - 1) / 7);
  const startDay = cycleIndex * 7 + 1;

  const days: StreakMilestoneDay[] = [];
  for (let i = 0; i < 7; i++) {
    const dayNum = startDay + i;
    const isCompleted = dayNum <= streakDays;
    const isTargetToday = !isCompletedToday && dayNum === (streakDays + 1);
    const isUpcoming = dayNum > (isCompletedToday ? streakDays : (streakDays + 1));

    days.push({
      dayNumber: dayNum,
      shortLabel: `D${dayNum}`,
      fullLabel: `Dzień ${dayNum}`,
      isCompleted,
      isTargetToday,
      isUpcoming
    });
  }

  return {
    days,
    currentCycle: cycleIndex + 1,
    isCompletedToday,
    todayTargetDayNumber: isCompletedToday ? streakDays : (streakDays + 1)
  };
}

export interface FormattedSolutionStep {
  stepNum: number;
  label: string; // e.g. "Krok 1"
  title?: string; // e.g. "Zastosowanie wzoru skróconego mnożenia"
  content: string; // mathematical content & text
}

/**
 * Parses raw task explanations containing "Krok 1:", "Krok 2:", etc.
 * into structured, beautifully formatted solution steps.
 */
export function parseSolutionSteps(rawText?: string): FormattedSolutionStep[] {
  if (!rawText) return [];
  const text = rawText.trim();
  
  // Check if text contains "Krok 1", "Krok 2", etc.
  const hasKrok = /Krok\s+\d+/i.test(text);
  if (!hasKrok) {
    const paragraphs = text.split(/\n\s*\n/).map(p => p.trim()).filter(Boolean);
    if (paragraphs.length > 1) {
      return paragraphs.map((p, idx) => ({
        stepNum: idx + 1,
        label: `Krok ${idx + 1}`,
        content: p
      }));
    }
    return [{
      stepNum: 1,
      label: 'Wyjaśnienie',
      content: text
    }];
  }

  // Split by "Krok \d+" pattern
  const chunks = text.split(/(?=(?:Krok\s+\d+[:.]?))/i).map(c => c.trim()).filter(Boolean);
  const steps: FormattedSolutionStep[] = [];
  let fallbackNum = 1;

  chunks.forEach((chunk) => {
    const match = chunk.match(/^Krok\s+(\d+)[:.]?\s*([\s\S]*)$/i);
    if (match) {
      const num = parseInt(match[1], 10) || fallbackNum;
      fallbackNum = num + 1;
      const rest = match[2].trim();

      // Check if there is a clean title before newline or colon
      const titleMatch = rest.match(/^([^:\n$]+)[:\n]([\s\S]*)$/);
      if (titleMatch && titleMatch[1].length < 70 && !titleMatch[1].includes('$')) {
        steps.push({
          stepNum: num,
          label: `Krok ${num}`,
          title: titleMatch[1].trim(),
          content: titleMatch[2].trim()
        });
      } else {
        steps.push({
          stepNum: num,
          label: `Krok ${num}`,
          content: rest
        });
      }
    } else {
      steps.push({
        stepNum: fallbackNum++,
        label: 'Wprowadzenie',
        content: chunk
      });
    }
  });

  return steps;
}


