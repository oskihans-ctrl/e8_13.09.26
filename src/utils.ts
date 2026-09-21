/**
 * Audio Synthesizer, Haptics & Gamification Utilities for Jasne.
 */

// Sound Synthesizer using Web Audio API (zero external mp3 assets)
export const playSuccessSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    
    // Play warm, uplifting two-tone chime (C5 -> E5 -> G5)
    const now = ctx.currentTime;
    
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(523.25, now); // C5
    osc1.frequency.exponentialRampToValueAtTime(659.25, now + 0.08); // E5
    gain1.gain.setValueAtTime(0.15, now);
    gain1.gain.exponentialRampToValueAtTime(0.01, now + 0.35);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.35);

    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(783.99, now + 0.09); // G5
    gain2.gain.setValueAtTime(0.18, now + 0.09);
    gain2.gain.exponentialRampToValueAtTime(0.01, now + 0.45);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.09);
    osc2.stop(now + 0.45);
  } catch {
    // Silent fallback
  }
};

export const playErrorSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(260, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.2);
    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.2);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.2);
  } catch {
    // Silent fallback
  }
};

export const playTapSound = () => {
  try {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(400, now);
    osc.frequency.exponentialRampToValueAtTime(200, now + 0.04);
    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.04);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.04);
  } catch {
    // Silent fallback
  }
};

/**
 * Mobile Haptic feedback wrapper
 */
export const triggerHaptic = (type: 'light' | 'medium' | 'heavy' | 'success' | 'error' | 'warning') => {
  if (typeof window !== 'undefined' && 'vibrate' in navigator) {
    try {
      switch (type) {
        case 'light':
          navigator.vibrate(10);
          break;
        case 'medium':
          navigator.vibrate(25);
          break;
        case 'heavy':
          navigator.vibrate([40, 20, 40]);
          break;
        case 'success':
          navigator.vibrate([20, 40, 60]);
          break;
        case 'warning':
          navigator.vibrate([30, 20, 30]);
          break;
        case 'error':
          navigator.vibrate([60, 40, 60]);
          break;
      }
    } catch {
      // Ignore vibration errors
    }
  }
};

/**
 * Returns today's ISO date string (YYYY-MM-DD) in local timezone
 */
export function getLocalDateString(dateInput: Date = new Date()): string {
  const year = dateInput.getFullYear();
  const month = String(dateInput.getMonth() + 1).padStart(2, '0');
  const day = String(dateInput.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function getTodayDateString(): string {
  return getLocalDateString(new Date());
}

/**
 * Returns yesterday's ISO date string (YYYY-MM-DD) in local timezone
 */
export function getYesterdayDateString(): string {
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const year = yesterday.getFullYear();
  const month = String(yesterday.getMonth() + 1).padStart(2, '0');
  const day = String(yesterday.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Checks if user completed any lesson/task today
 */
export function isStreakCompletedToday(
  lastStreakDate?: string,
  streakActiveDates: string[] = []
): boolean {
  const today = getTodayDateString();
  if (lastStreakDate === today) return true;
  return streakActiveDates.includes(today);
}

/**
 * Calculates updated streak counters when a lesson/task is finished
 */
export function calculateStreakUpdate(
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

  // If already completed today, streak count stays the same
  if (lastStreakDate === today) {
    return {
      newStreakDays: Math.max(1, currentStreakDays),
      newLastStreakDate: today,
      newStreakActiveDates: Array.from(uniqueDates),
      isFirstCompletionToday: false
    };
  }

  let newStreakDays = 1;
  if (lastStreakDate === yesterday) {
    newStreakDays = (currentStreakDays || 0) + 1;
  } else if (!lastStreakDate || currentStreakDays === 0) {
    newStreakDays = 1;
  } else {
    newStreakDays = 1;
  }

  return {
    newStreakDays,
    newLastStreakDate: today,
    newStreakActiveDates: Array.from(uniqueDates),
    isFirstCompletionToday: true
  };
}

export const calculateStreakOnTaskCompletion = calculateStreakUpdate;

export interface StreakMilestoneDay {
  dayNumber: number;
  shortLabel: string;
  fullLabel: string;
  isCompleted: boolean;
  isTargetToday: boolean;
  isUpcoming: boolean;
}

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
  title?: string;
  content: string;
}

/**
 * Parses raw task explanations or array of steps into structured, beautifully formatted solution steps.
 */
export function parseSolutionSteps(
  stepsOrRawText?: any[] | string,
  fallbackText?: string
): FormattedSolutionStep[] {
  // If structured array is passed
  if (Array.isArray(stepsOrRawText) && stepsOrRawText.length > 0) {
    return stepsOrRawText.map((item, idx) => {
      if (typeof item === 'string') {
        return {
          stepNum: idx + 1,
          label: `Krok ${idx + 1}`,
          content: item
        };
      }
      return {
        stepNum: item.step || (idx + 1),
        label: item.label || `Krok ${item.step || (idx + 1)}`,
        title: item.title,
        content: item.content || item.text || ''
      };
    });
  }

  const raw = typeof stepsOrRawText === 'string' && stepsOrRawText.trim().length > 0
    ? stepsOrRawText
    : (fallbackText || '');

  if (!raw || !raw.trim()) return [];
  const text = raw.trim();
  
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
