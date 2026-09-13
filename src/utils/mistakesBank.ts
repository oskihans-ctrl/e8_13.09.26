import { dzial1TasksPool } from '../data/dzial1TaskPool';
import { mathTopics } from '../data/mathTasks';

const STORAGE_KEY = 'matura_mistakes_bank';

export function getMistakesBank(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (e) {
    console.error('Failed to read mistakes bank:', e);
    return [];
  }
}

export function saveMistakesBank(bank: string[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bank));
    window.dispatchEvent(new CustomEvent('mistakes_bank_updated', { detail: bank }));
  } catch (e) {
    console.error('Failed to save mistakes bank:', e);
  }
}

export function addMistakeToBank(taskId: string): void {
  if (!taskId) return;
  const current = getMistakesBank();
  if (!current.includes(taskId)) {
    const updated = [...current, taskId];
    saveMistakesBank(updated);
  }
}

export function removeMistakeFromBank(taskId: string): void {
  if (!taskId) return;
  const current = getMistakesBank();
  if (current.includes(taskId)) {
    const updated = current.filter(id => id !== taskId);
    saveMistakesBank(updated);
  }
}

export function clearMistakesBank(): void {
  saveMistakesBank([]);
}

/**
 * Resolves full task objects for IDs currently in the mistakes bank.
 */
export function getMistakeTasks(): any[] {
  const ids = getMistakesBank();
  if (ids.length === 0) return [];

  const taskMap = new Map<string, any>();

  // 1. Check pool tasks
  dzial1TasksPool.forEach(task => {
    taskMap.set(task.id, task);
  });

  // 2. Check mathTopics tasks and lesson tasks
  mathTopics.forEach(topic => {
    if (Array.isArray(topic.tasks)) {
      topic.tasks.forEach(t => taskMap.set(t.id, t));
    }
    if (Array.isArray(topic.lessons)) {
      topic.lessons.forEach((lesson: any) => {
        if (Array.isArray(lesson.tasks)) {
          lesson.tasks.forEach((t: any) => taskMap.set(t.id, t));
        }
      });
    }
  });

  const resolvedTasks: any[] = [];
  ids.forEach(id => {
    const task = taskMap.get(id);
    if (task) {
      resolvedTasks.push(task);
    }
  });

  return resolvedTasks;
}
