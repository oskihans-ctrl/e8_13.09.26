import curriculumData from './curriculum_matematyka.json';
import { MathTaskItem, TaskOption } from '../types';
import { parseSolutionSteps } from '../utils';

export interface CurriculumTopic {
  id: number;
  slug: string;
  title: string;
  short_title: string;
  icon: string;
  color: string;
  matura_points_range: string;
  importance: string;
  description: string;
  lessons: any[];
}

export interface ProcessedTopic {
  id: string;
  numericId: number;
  name: string;
  short_title: string;
  icon: string;
  color: string;
  matura_points_range: string;
  importance: string;
  description: string;
  progress: string;
  locked: boolean;
  lessons: any[];
  tasks: any[];
}

/**
 * Transforms the official CKE 2025 curriculum into structured math topics and tasks.
 */
function buildMathTopics(): ProcessedTopic[] {
  const topics = (curriculumData as any).topics || [];

  return topics.map((topic: CurriculumTopic) => {
    const allTasks: any[] = [];
    const lessons = topic.lessons || [];

    lessons.forEach((lesson: any) => {
      // 1. Add Theory Pill Task if available
      if (lesson.theory_pill) {
        const theoryTask = {
          id: `THEORY-${lesson.id}`,
          type: 'theory',
          cke_source: 'Pigułka Wiedzy',
          title: `Lekcja ${lesson.id}: ${lesson.title}`,
          topic: `${topic.short_title} • Lekcja ${lesson.id}`,
          instruction: 'Zapoznaj się z kluczową regułą i wzorami przed przystąpieniem do zadań.',
          math_statement: lesson.theory_pill.core_formula,
          question: lesson.theory_pill.title,
          theory_pill: lesson.theory_pill,
          officialKey: `• Złoty Wzór:\n${lesson.theory_pill.core_formula}\n\n• Kluczowa Strategia:\n${lesson.theory_pill.key_takeaway}\n\n• Uwaga na Częstą Pułapkę:\n${lesson.theory_pill.cke_trap}`,
          maxPoints: 0,
          difficulty: 'Teoria',
          xp: 5,
          time: '2 min',
          hints: {
            level_1: lesson.theory_pill.key_takeaway,
            level_2: lesson.theory_pill.cke_trap,
            ai_tutor_prompt: `Wyjaśnij zagadnienie: ${lesson.title}`
          },
          official_solution_steps: [
            { step_num: 1, description: lesson.theory_pill.key_takeaway }
          ],
          lessonId: lesson.id
        };
        allTasks.push(theoryTask);
      }

      // 2. Add Practice & Exam Tasks
      const tasks = lesson.tasks || [];
      tasks.forEach((task: any) => {
        const isMulti = task.type === 'MULTI_CHOICE';
        const isSingle = task.type === 'SINGLE_CHOICE';
        const isProof = task.type === 'OPEN_PROOF';
        const isNumeric = task.type === 'NUMERIC_INPUT';

        const options: TaskOption[] = (task.options || []).map((opt: any) => ({
          id: opt.id,
          content_latex: opt.text,
          is_correct: isSingle ? opt.id === task.correct_answer : (task.correct_answers || []).includes(opt.id)
        }));

        let defaultInstruction = 'Dokończ zdanie. Wybierz właściwą odpowiedź spośród podanych.';
        if (isMulti) defaultInstruction = 'Wybierz wszystkie właściwe odpowiedzi spośród podanych.';
        if (isNumeric) defaultInstruction = 'Oblicz wartość i wpisz ostateczny wynik poniżej.';
        if (isProof) defaultInstruction = 'Przeprowadź dowód w brudnopisie i wpisz końcowy wynik lub współczynnik.';

        let difficultyLabel = 'Standard E8';
        if (task.difficulty === 'EASY') difficultyLabel = 'Rozgrzewka';
        if (task.difficulty === 'HARD') difficultyLabel = 'Wymagające';

        const taskItem = {
          id: task.id,
          type: task.type,
          source: task.source || 'CKE Egzamin Ósmoklasisty • Zadanie E8',
          cke_source: task.source || 'CKE Egzamin Ósmoklasisty • Zadanie E8',
          points: task.points,
          ai_tutor_rubric: task.ai_tutor_rubric,
          title: `Lekcja ${lesson.id}: ${lesson.title}`,
          topic: `${topic.short_title} • ${lesson.title}`,
          instruction: defaultInstruction,
          math_statement: task.question,
          question: task.question,
          options: options.length > 0 ? options : undefined,
          required_selections_count: isMulti ? (task.correct_answers?.length || 2) : 1,
          numeric_correct_answer: task.correct_answer,
          hints: {
            level_1: task.hint_1 || 'Zastosuj wzory i własności dla Egzaminu Ósmoklasisty.',
            level_2: task.hint_2 || 'Przekształć wyrażenie krok po kroku i uprość wynik.',
            ai_tutor_prompt: `Pomóż uczniowi rozwiązać zadanie z Egzaminu Ósmoklasisty bez podawania gotowej odpowiedzi: ${task.question}`
          },
          official_solution_steps: (() => {
            const parsed = parseSolutionSteps(task.explanation);
            if (parsed.length > 0) {
              return parsed.map(s => ({
                step_num: s.stepNum,
                description: s.title ? `**${s.title}:** ${s.content}` : s.content
              }));
            }
            return [{ step_num: 1, description: task.explanation }];
          })(),
          officialKey: task.explanation,
          maxPoints: task.points,
          difficulty: difficultyLabel,
          xp: task.points * 10,
          time: `${task.points * 2} min`,
          tags: task.tags || [`${task.points} pkt`],
          lessonId: lesson.id
        };

        allTasks.push(taskItem);
      });
    });

    return {
      id: `math-${topic.id}`,
      numericId: topic.id,
      name: topic.title,
      short_title: topic.short_title,
      icon: topic.icon,
      color: topic.color,
      matura_points_range: topic.matura_points_range,
      importance: topic.importance,
      description: topic.description,
      progress: '0%',
      locked: topic.id > 1,
      lessons: lessons,
      tasks: allTasks
    };
  });
}

export const mathTopics = buildMathTopics();
