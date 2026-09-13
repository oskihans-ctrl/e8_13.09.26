import { TaskOption, LessonTheoryPill } from '../types';
import curriculumData from './curriculum_matematyka.json';

export type TaskDifficultyTier = 'A' | 'B' | 'C';

export interface PoolTask {
  id: string;
  lessonId: string;
  tier: TaskDifficultyTier;
  tierLabel: string;
  points: number;
  question: string;
  options?: TaskOption[];
  correct_answer?: string;
  explanation: string;
  hint_1: string;
  hint_2: string;
  cke_tag?: string;
  type?: string;
  source?: string;
  instruction?: string;
  officialKey?: string;
  cke_source?: string;
  ai_tutor_rubric?: {
    max_points: number;
    criterion_1_point: string;
    criterion_2_points: string;
  };
  modelSolutionSteps?: { step_num: number; description: string; latex?: string }[];
}

export interface LessonFormulaSheet {
  lessonId: string;
  title: string;
  formulas: { title: string; latex: string }[];
  goldenRule: string;
  ckeTrap: {
    error: string;
    correct: string;
    description: string;
  };
}

export const formulaSheetsByLesson: Record<string, LessonFormulaSheet> = {
  '1.1': {
    lessonId: '1.1',
    title: 'Ułamki zwykłe, dziesiętne i kolejność działań',
    formulas: [
      { title: 'Kolejność działań', latex: '\\text{Nawiasy} \\to \\text{Potęgi/Pierwiastki} \\to \\text{Mnożenie/Dzielenie} \\to \\text{Dodawanie/Odejmowanie}' },
      { title: 'Dodawanie i odejmowanie ułamków', latex: '\\frac{a}{c} + \\frac{b}{c} = \\frac{a + b}{c}, \\quad \\frac{a}{b} \\pm \\frac{c}{d} = \\frac{ad \\pm bc}{bd}' },
      { title: 'Mnożenie i dzielenie ułamków', latex: '\\frac{a}{b} \\cdot \\frac{c}{d} = \\frac{a \\cdot c}{b \\cdot d}, \\quad \\frac{a}{b} : \\frac{c}{d} = \\frac{a}{b} \\cdot \\frac{d}{c}' }
    ],
    goldenRule: 'Przy dodawaniu ułamków ZAWSZE sprowadzaj do wspólnego mianownika. Dzielenie przez ułamek to mnożenie przez jego odwrotność!',
    ckeTrap: {
      error: '\\frac{1}{2} + \\frac{1}{3} = \\frac{1+1}{2+3} = \\frac{2}{5}',
      correct: '\\frac{1}{2} + \\frac{1}{3} = \\frac{3}{6} + \\frac{2}{6} = \\frac{5}{6}',
      description: 'Nigdy nie dodawaj liczników i mianowników bezpośrednio! Ułamki muszą mieć wspólny mianownik.'
    }
  },
  '1.2': {
    lessonId: '1.2',
    title: 'Cechy podzielności, NWD i NWW',
    formulas: [
      { title: 'Podzielność przez 3 i 9', latex: '\\text{Suma cyfr liczby jest podzielna przez 3 (lub 9)}' },
      { title: 'Podzielność przez 4', latex: '\\text{Dwie ostatnie cyfry tworzą liczbę podzielną przez 4}' },
      { title: 'Związek NWD i NWW', latex: 'NWD(a, b) \\cdot NWW(a, b) = a \\cdot b' }
    ],
    goldenRule: 'Aby sprawdzić podzielność przez 3 lub 9, zsumuj wszystkie cyfry liczby. Nie myl podzielności przez 3 z podzielnością przez 9!',
    ckeTrap: {
      error: '\\text{Liczba 12 dzieli się przez 3, więc dzieli się też przez 9}',
      correct: '12 : 3 = 4, \\quad 12 : 9 = 1\\frac{1}{3} \\notin \\mathbb{N}',
      description: 'Każda liczba podzielna przez 9 dzieli się przez 3, ale NIE każda liczba podzielna przez 3 dzieli się przez 9!'
    }
  },
  '1.3': {
    lessonId: '1.3',
    title: 'Liczby ujemne i oś liczbowa',
    formulas: [
      { title: 'Mnożenie liczb ze znakami', latex: '(-a) \\cdot (-b) = a \\cdot b, \\quad (-a) \\cdot b = -(ab)' },
      { title: 'Odejmowanie liczb ujemnych', latex: 'a - (-b) = a + b' },
      { title: 'Potęgowanie liczby ujemnej', latex: '(-a)^2 = a^2, \\quad (-a)^3 = -a^3, \\quad -a^2 = -(a^2)' }
    ],
    goldenRule: 'Dwa minusy dają plus przy mnożeniu i odejmowaniu. Pamiętaj: minus przed nawiasem zmienia znak każdego składnika!',
    ckeTrap: {
      error: '-5^2 = 25',
      correct: '-5^2 = -(5^2) = -25, \\quad \\text{natomiast } (-5)^2 = 25',
      description: 'Brak nawiasu oznacza, że potęgujesz wyłącznie samą liczbę 5, a minus pozostaje z przodu!'
    }
  }
};

/**
 * Authoritative pool of all 32 authentic matura tasks from curriculum_matematyka.json.
 */
export const dzial1TasksPool: PoolTask[] = (() => {
  const topics = (curriculumData as any).topics || [];
  const pool: PoolTask[] = [];

  topics.forEach((topic: any) => {
    (topic.lessons || []).forEach((lesson: any) => {
      (lesson.tasks || []).forEach((t: any) => {
        const isProof = t.type === 'OPEN_PROOF' || t.type === 'OPEN';
        const tier: TaskDifficultyTier = t.difficulty === 'EASY' ? 'A' : t.difficulty === 'HARD' ? 'C' : 'B';
        const tierLabel = t.difficulty === 'EASY' ? 'Rozgrzewka' : t.difficulty === 'HARD' ? 'Wymagające' : 'Pewniak E8';

        const options: TaskOption[] | undefined = t.options ? t.options.map((opt: any) => ({
          id: opt.id,
          content_latex: opt.text,
          is_correct: opt.id === t.correct_answer
        })) : undefined;

        pool.push({
          id: t.id,
          lessonId: String(lesson.id),
          tier,
          tierLabel,
          points: t.points || 1,
          question: t.question,
          options,
          correct_answer: t.correct_answer,
          explanation: t.explanation,
          hint_1: t.hint_1,
          hint_2: t.hint_2,
          type: t.type,
          source: t.source,
          cke_source: t.source,
          cke_tag: t.source,
          officialKey: t.explanation,
          instruction: isProof 
            ? 'Zapisz swoje obliczenia, przekształcenia i odpowiedź.' 
            : 'Dokończ zdanie. Wybierz właściwą odpowiedź spośród podanych.',
          ai_tutor_rubric: t.ai_tutor_rubric,
          modelSolutionSteps: [
            { step_num: 1, description: t.explanation }
          ]
        });
      });
    });
  });

  return pool;
})();

/**
 * Helper: True randomized Fisher-Yates shuffle
 */
function shuffleArray<T>(array: T[]): T[] {
  const copy = [...array];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

/**
 * Complete, authoritative Theory Pills (Pigułki Wiedzy) for all 7 lessons in Dział 1.
 * Provides rich pedagogical structure: Intuition, KaTeX Core Formulas, Worked Example (Sweller, 2006), and CKE Exam Trap.
 */
export const defaultTheoryPillsByLesson: Record<string, LessonTheoryPill> = {
  '1.1': {
    lessonId: '1.1',
    title: 'Potęgi o wykładnikach całkowitych i wymiernych',
    concept_essence: 'Potęgowanie to skrócony zapis wielokrotnego mnożenia tej samej liczby ($a^n = a \\cdot a \\cdot ... \\cdot a$). Ujemny wykładnik oznacza odwrócenie liczby ($a^{-n} = \\frac{1}{a^n}$), a wykładnik ułamkowy reprezentuje pierwiastkowanie ($a^{\\frac{m}{n}} = \\sqrt[n]{a^m}$). Pamiętaj: potęgować można wyłącznie liczby o dodatniej podstawie, gdy wykładnik nie jest całkowity.',
    matura_context: 'W arkuszu maturalnym zadania z potęg to gwarantowany 1 punkt na samym początku egzaminu. W 90% przypadków kluczem jest **sprowadzenie wszystkich liczb do wspólnej bazy** (najczęściej $2$, $3$ lub $5$). Egzaminator sprawdza, czy nie ulegniesz pokusie mnożenia podstaw zamiast dodawania wykładników.',
    core_formulas: `\\begin{aligned} a^x \\cdot a^y &= a^{x+y} \\\\[6pt] \\frac{a^x}{a^y} &= a^{x-y} \\\\[6pt] (a^x)^y &= a^{x \\cdot y} \\\\[6pt] a^{-x} &= \\frac{1}{a^x} \\\\[6pt] a^{\\frac{m}{n}} &= \\sqrt[n]{a^m} \\end{aligned}`,
    formula_notes: 'Wzory obowiązują dla podstaw $a > 0$, $b > 0$ oraz dowolnych wykładników rzeczywistych.',
    coreFormulaLatex: `\\begin{aligned} a^x \\cdot a^y &= a^{x+y} \\\\[6pt] \\frac{a^x}{a^y} &= a^{x-y} \\\\[6pt] (a^x)^y &= a^{x \\cdot y} \\\\[6pt] a^{-x} &= \\frac{1}{a^x} \\\\[6pt] a^{\\frac{m}{n}} &= \\sqrt[n]{a^m} \\end{aligned}`,
    worked_example: {
      problem: 'Oblicz wartość wyrażenia: $9^3 \\cdot 27^{-1}$',
      step1: 'Sprowadź potęgi do wspólnej podstawy $3$: zapisz $9 = 3^2$ oraz $27 = 3^3$.',
      step2: 'Zastosuj działania na potęgach: $(3^2)^3 \\cdot (3^3)^{-1} = 3^6 \\cdot 3^{-3} = 3^{6 - 3} = 3^3 = 27$.',
      result: '27'
    },
    exam_trap: 'Podstawa potęgi **nigdy się nie zmienia** przy mnożeniu potęg o tej samej podstawie! Błąd: $2^3 \\cdot 2^4 \\neq 4^7$. Prawidłowo: $2^3 \\cdot 2^4 = 2^7$. Pamiętaj też: połowa liczby $2^{100}$ to $2^{99}$, a nie $1^{100}$ ani $2^{50}$!',
    intuition: 'W potęgach **90% zadań maturalnych** polega na sprowadzeniu liczb do wspólnej podstawy (najczęściej **2, 3 lub 5**). Pamiętaj: wykładnik ujemny odwraca ułamek, a ułamkowy zamienia się w pierwiastek.',
    keyTakeaway: 'Sprowadzaj wszystkie potęgi do wspólnej podstawy (najczęściej 2, 3 lub 5). Wykładnik ujemny odwraca liczbę, a ułamek zamienia się w pierwiastek.',
    trapAlert: 'Uwaga na pułapkę: podstawa potęgi się NIE zmienia! Przykład: $2^3 \\cdot 2^4 = 2^7$, a nie $4^7$.'
  },
  '1.2': {
    lessonId: '1.2',
    title: 'Pierwiastki i działania na liczbach niewymiernych',
    concept_essence: 'Pierwiastek $n$-tego stopnia z liczby $a$ to liczba, która podniesiona do potęgi $n$ daje $a$. Pierwiastkowanie jest operacją rozdzielną względem mnożenia i dzielenia, ale **nigdy względem dodawania i odejmowania**. Z definicji $\\sqrt{a^2} = |a|$, co zabezpiecza nieujemność wyniku dla pierwiastków stopnia parzystego.',
    matura_context: 'Zadania z pierwiastków sprawdzają wyłączanie czynnika przed znak pierwiastka (poprzez rozkład na iloczyn z kwadratem) oraz usuwanie niewymierności z mianownika. W zadaniach otwartych brak usunięcia niewymierności ze sprzężeniem grozi utratą punktu za wynik.',
    core_formulas: `\\begin{aligned} \\sqrt[n]{a \\cdot b} &= \\sqrt[n]{a} \\cdot \\sqrt[n]{b} \\\\[6pt] \\sqrt[n]{\\frac{a}{b}} &= \\frac{\\sqrt[n]{a}}{\\sqrt[n]{b}} \\\\[6pt] \\sqrt{a^2} &= |a| \\\\[6pt] \\frac{c}{\\sqrt{a} - \\sqrt{b}} &= \\frac{c(\\sqrt{a} + \\sqrt{b})}{a - b} \\end{aligned}`,
    formula_notes: 'Usuwanie niewymierności opiera się na wzorze skróconego mnożenia: $(\\sqrt{a} - \\sqrt{b})(\\sqrt{a} + \\sqrt{b}) = a - b$.',
    coreFormulaLatex: `\\begin{aligned} \\sqrt[n]{a \\cdot b} &= \\sqrt[n]{a} \\cdot \\sqrt[n]{b} \\\\[6pt] \\sqrt[n]{\\frac{a}{b}} &= \\frac{\\sqrt[n]{a}}{\\sqrt[n]{b}} \\\\[6pt] \\sqrt{a^2} &= |a| \\\\[6pt] \\frac{c}{\\sqrt{a} - \\sqrt{b}} &= \\frac{c(\\sqrt{a} + \\sqrt{b})}{a - b} \\end{aligned}`,
    worked_example: {
      problem: 'Uprość wyrażenie: $\\sqrt{50} - \\sqrt{18}$',
      step1: 'Rozłóż liczby podpierwiastkowe na iloczyn z kwadratem: $\\sqrt{50} = \\sqrt{25 \\cdot 2} = 5\\sqrt{2}$ oraz $\\sqrt{18} = \\sqrt{9 \\cdot 2} = 3\\sqrt{2}$.',
      step2: 'Wykonaj odejmowanie wyrazów podobnych: $5\\sqrt{2} - 3\\sqrt{2} = (5-3)\\sqrt{2} = 2\\sqrt{2}$.',
      result: '2\\sqrt{2}'
    },
    exam_trap: 'Nigdy nie rozbijaj sumy ani różnicy pod pierwiastkiem! $\\sqrt{a+b} \\neq \\sqrt{a} + \\sqrt{b}$. Zauważ: $\\sqrt{9+16} = \\sqrt{25} = 5$, podczas gdy $3+4 = 7$!',
    intuition: 'Pierwiastków **nigdy nie dodajemy pod jednym znakiem**. Zamiast tego rozkładaj liczby pod pierwiastkiem na iloczyn kwadratów i usuwaj niewymierność mnożąc przez sprzężenie.',
    keyTakeaway: 'Nigdy nie dodawaj liczb pod pierwiastkami ($\\sqrt{a+b} \\neq \\sqrt{a} + \\sqrt{b}$). Usuwaj niewymierność z mianownika.',
    trapAlert: 'Pamiętaj: $\\sqrt{a^2} = |a|$. Dla liczby ujemnej pierwiastek z kwadratu daje wartość dodatnią!'
  },
  '1.3': {
    lessonId: '1.3',
    title: 'Logarytmy i tożsamości logarytmiczne',
    concept_essence: 'Logarytm $\\log_a b = c$ to wykładnik potęgi, do którego należy podnieść podstawę $a$, aby otrzymać liczbę logarytmowaną $b$ ($a^c = b$). Warunki konieczne istnienia logarytmu: podstawa $a > 0$ i $a \\neq 1$ oraz argument $b > 0$. Logarytm zamienia operację mnożenia argumentów na proste dodawanie wartości.',
    matura_context: 'W arkuszu maturalnym regularnie pojawia się zwijanie sumy lub różnicy logarytmów o tej samej podstawie w jeden logarytm. Pamiętaj: przed zastosowaniem wzoru na sumę, każda liczba stojąca przed logarytmem musi najpierw trafić do potęgi argumentu.',
    core_formulas: `\\begin{aligned} \\log_a b = c &\\iff a^c = b \\\\[6pt] \\log_a x + \\log_a y &= \\log_a(x \\cdot y) \\\\[6pt] \\log_a x - \\log_a y &= \\log_a\\left(\\frac{x}{y}\\right) \\\\[6pt] k \\cdot \\log_a x &= \\log_a(x^k) \\end{aligned}`,
    formula_notes: 'Wzory obowiązują dla podstawy $a > 0, a \\neq 1$ oraz liczb logarytmowanych $x > 0, y > 0$.',
    coreFormulaLatex: `\\begin{aligned} \\log_a b = c &\\iff a^c = b \\\\[6pt] \\log_a x + \\log_a y &= \\log_a(x \\cdot y) \\\\[6pt] \\log_a x - \\log_a y &= \\log_a\\left(\\frac{x}{y}\\right) \\\\[6pt] k \\cdot \\log_a x &= \\log_a(x^k) \\end{aligned}`,
    worked_example: {
      problem: 'Oblicz wartość wyrażenia: $2\\log_2 6 - \\log_2 9$',
      step1: 'Wciągnij współczynnik $2$ do wykładnika potęgi argumentu: $2\\log_2 6 = \\log_2(6^2) = \\log_2 36$.',
      step2: 'Zastosuj wzór na różnicę logarytmów: $\\log_2 36 - \\log_2 9 = \\log_2\\left(\\frac{36}{9}\\right) = \\log_2 4 = 2$, bo $2^2 = 4$.',
      result: '2'
    },
    exam_trap: 'Suma logarytmów daje logarytm iloczynu, a NIE sumy! Błąd: $\\log(x+y) \\neq \\log x + \\log y$. Ponadto ułamek $\\frac{\\log_a x}{\\log_a y}$ to NIE jest $\\log_a(x-y)$!',
    intuition: 'Logarytm $\\log_a b$ to po prostu pytanie: **„Do jakiej potęgi podnieść $a$, aby otrzymać $b$?”** Suma logarytmów zamienia się w logarytm iloczynu.',
    keyTakeaway: 'Logarytm to pytanie o wykładnik: „Do jakiej potęgi podnieść a, by wyszło b?”. Zawsze najpierw wciągaj współczynniki przed logarytmem jako wykładniki.',
    trapAlert: 'Suma logarytmów daje logarytm ILOCZYNU. Logarytm z sumy argumentów jest nierozkładalny!'
  },
  '1.4': {
    lessonId: '1.4',
    title: 'Procenty, punkty procentowe i obliczenia finansowe',
    concept_essence: 'Jeden procent to jedna setna części całości ($1\\% = 0{,}01$). Przy zmianach procentowych kluczowe jest pojęcie mnożnika cenowego: podwyżka o $p\\%$ oznacza pomnożenie wielkości przez $(1 + \\frac{p}{100})$, a obniżka przez $(1 - \\frac{p}{100})$. Punkt procentowy ($p.p.$) to arytmetyczna różnica między dwiema stopami procentowymi.',
    matura_context: 'Na egzaminie ósmoklasisty egzaminator sprawdza wielokrotne zmiany cen (np. obniżka, a potem podwyżka) oraz obliczenia ułamkowe i procentowe. Punktowane jest poprawne zidentyfikowanie **bazy wyjściowej** – czyli wartości, od której w danym kroku naliczany jest procent.',
    core_formulas: `\\begin{aligned} C_{\\text{końcowa}} &= C_0 \\cdot (1 + p) \\\\[6pt] C_{\\text{końcowa}} &= C_0 \\cdot (1 - p) \\\\[6pt] \\text{Względna zmiana} &= \\frac{K - P}{P} \\cdot 100\\% \\\\[6pt] \\Delta p.p. &= p_2 - p_1 \\end{aligned}`,
    formula_notes: 'W mianowniku wzoru na względną zmianę zawsze umieszczaj początkową wartość bazową $P$.',
    coreFormulaLatex: `\\begin{aligned} C_{\\text{końcowa}} &= C_0 \\cdot (1 + p) \\\\[6pt] C_{\\text{końcowa}} &= C_0 \\cdot (1 - p) \\\\[6pt] \\text{Względna zmiana} &= \\frac{K - P}{P} \\cdot 100\\% \\\\[6pt] \\Delta p.p. &= p_2 - p_1 \\end{aligned}`,
    worked_example: {
      problem: 'Towar kosztował $200$ zł. Cenę obniżono o $20\\%$, a potem nową cenę podniesiono o $10\\%$. Ile wynosi cena końcowa?',
      step1: 'Zapisz mnożniki cenowe: obniżka o $20\\%$ to współczynnik $0{,}8$, a podwyżka o $10\\%$ to współczynnik $1{,}1$.',
      step2: 'Oblicz cenę końcową mnożąc kolejne czynniki: $200 \\cdot 0{,}8 \\cdot 1{,}1 = 160 \\cdot 1{,}1 = 176$ zł.',
      result: '176\\text{ zł}'
    },
    exam_trap: 'Dwie kolejne obniżki o $20\\%$ to NIE jest obniżka o $40\\%$! Ze $100$ zł po $-20\\%$ zostaje $80$ zł, a po kolejnym $-20\\%$ zostaje $64$ zł (czyli łączna obniżka o $36\\%$). Podwyżka i obniżka o ten sam procent nigdy nie przywracają ceny wyjściowej!',
    intuition: 'W zadaniach z procentami kluczem jest **baza wyjściowa**. Podwyżka o $p\\%$ to mnożenie przez $(1 + \\frac{p}{100})$, a obniżka przez $(1 - \\frac{p}{100})$.',
    keyTakeaway: 'W mianowniku ZAWSZE ląduje baza wyjściowa („od czego liczysz”). Dwie kolejne obniżki o 20% to obniżka o 36%, a nie o 40%!',
    trapAlert: 'Podwyżka i obniżka o ten sam procent nigdy nie dają tej samej kwoty, bo liczone są od innej podstawy!'
  },
  '1.5': {
    lessonId: '1.5',
    title: 'Wartość bezwzględna i przedziały liczbowe',
    concept_essence: 'Wartość bezwzględna $|x|$ określa odległość liczby $x$ od zera na osi liczbowej. Ponieważ odległość jest zawsze nieujemna, $|x| \\ge 0$ dla dowolnego $x$. Wyrażenie $|x - a| \\le r$ interpretujemy geometrycznie jako zbiór punktów oddalonych od środka $a$ o co najwyżej promień $r$.',
    matura_context: 'W arkuszu E8 pojawiają się zadania sprawdzające oś liczbową oraz zdejmowanie modułu z różnicy liczb. Egzaminator bada, czy sprawdzasz znak wyrażenia pod modułem przed opuszczeniem kresek wartości bezwzględnej.',
    core_formulas: `\\begin{aligned} |x| &= \\begin{cases} x & \\text{gdy } x \\ge 0 \\\\ -x & \\text{gdy } x < 0 \\end{cases} \\\\[6pt] |x - a| \\le r &\\iff x \\in \\langle a-r, a+r \\rangle \\\\[6pt] |x - a| \\ge r &\\iff x \\le a-r \\;\\lor\\; x \\ge a+r \\end{aligned}`,
    formula_notes: 'Liczba $a$ to środek przedziału na osi liczbowej, a $r$ to promień (odległość od środka).',
    coreFormulaLatex: `\\begin{aligned} |x| &= \\begin{cases} x & \\text{gdy } x \\ge 0 \\\\ -x & \\text{gdy } x < 0 \\end{cases} \\\\[6pt] |x - a| \\le r &\\iff x \\in \\langle a-r, a+r \\rangle \\\\[6pt] |x - a| \\ge r &\\iff x \\le a-r \\;\\lor\\; x \\ge a+r \\end{aligned}`,
    worked_example: {
      problem: 'Uprość wyrażenie: $|3 - \\pi| + |2 - \\sqrt{5}|$',
      step1: 'Oceń znak wyrażenia wewnątrz każdego modułu: $\\pi \\approx 3{,}14 \\implies 3 - \\pi < 0$ oraz $\\sqrt{5} \\approx 2{,}24 \\implies 2 - \\sqrt{5} < 0$.',
      step2: 'Zdejmij moduły zmieniając znaki na przeciwne: $|3 - \\pi| = \\pi - 3$ oraz $|2 - \\sqrt{5}| = \\sqrt{5} - 2$. Wynik: $(\\pi - 3) + (\\sqrt{5} - 2) = \\pi + \\sqrt{5} - 5$.',
      result: '\\pi + \\sqrt{5} - 5'
    },
    exam_trap: 'Klasyczny błąd na egzaminie: pisanie $|2 - \\sqrt{5}| = 2 - \\sqrt{5}$. Ponieważ $2 < \\sqrt{5}$, wynik $2 - \\sqrt{5} < 0$ byłby ujemny, co jest sprzeczne z definicją modułu! Poprawnie: $|2 - \\sqrt{5}| = \\sqrt{5} - 2$.',
    intuition: 'Wartość bezwzględna to **odległość na osi liczbowej** – nigdy nie może być ujemna! Przed zdjęciem kresek modułu sprawdź znak wyrażenia w środku.',
    keyTakeaway: 'Krok 1: Oszacuj znak wewnątrz kresek wartości bezwzględnej. Krok 2: Jeśli wnętrze jest ujemne, zdejmij moduł i zmień znak KAŻDEGO wyrazu!',
    trapAlert: 'Wartość bezwzględna NIGDY nie może dać liczby ujemnej. Jeśli wyrażenie jest mniejsze od zera, odwróć kolejność odejmowania!'
  },
  '1.6': {
    lessonId: '1.6',
    title: 'Błąd bezwzględny, względny i szacowanie',
    concept_essence: 'Przybliżenie wartości dokładnej $x$ liczbą szacowaną $a$ wiąże się z błędem. Błąd bezwzględny $\\Delta_x = |x - a|$ mierzy różnicę między tymi wartościami. Błąd względny $\\delta_x = \\frac{|x - a|}{x}$ odnosi tę różnicę do rzeczywistej wielkości, pozwalając obiektywnie ocenić precyzję oszacowania.',
    matura_context: 'W zadaniach z błędu względnego Egzaminator sprawdza mianownik ułamka. Żelazna reguła egzaminacyjna: **zawsze dzielimy przez wartość dokładną $x$**, a nigdy przez przybliżenie $a$. Zastosowanie przybliżenia w mianowniku powoduje całkowite wyzerowanie zadania.',
    core_formulas: `\\begin{aligned} \\Delta_x &= |x - a| \\\\[6pt] \\delta_x &= \\frac{|x - a|}{x} \\\\[6pt] \\delta_{\\%} &= \\frac{|x - a|}{x} \\cdot 100\\% \\end{aligned}`,
    formula_notes: '$\\Delta_x$ to błąd bezwzględny, $\\delta_x$ to błąd względny, a $\\delta_{\\%}$ to błąd procentowy. Pamiętaj: w mianowniku zawsze stoi wartość dokładna $x$.',
    coreFormulaLatex: `\\begin{aligned} \\Delta_x &= |x - a| \\\\[6pt] \\delta_x &= \\frac{|x - a|}{x} \\\\[6pt] \\delta_{\\%} &= \\frac{|x - a|}{x} \\cdot 100\\% \\end{aligned}`,
    worked_example: {
      problem: 'Liczbę $x = \\frac{5}{8}$ zaokrąglono do $a = 0{,}6$. Oblicz błąd względny tego przybliżenia.',
      step1: 'Zapisz wartość dokładną dziesiętnie: $x = 0{,}625$ oraz wyznacz błąd bezwzględny: $\\Delta = |0{,}625 - 0{,}6| = 0{,}025$.',
      step2: 'Oblicz błąd względny dzieląc błąd bezwzględny przez liczbę dokładną: $\\delta = \\frac{0{,}025}{0{,}625} = \\frac{1}{25} = 0{,}04 = 4\\%$.',
      result: '4\\%'
    },
    exam_trap: 'Zawsze dziel przez wartość DOKŁADNĄ $x$, a nie przez przybliżenie $a$! Błąd: $\\frac{0{,}025}{0{,}6} \\approx 4{,}17\\%$. Egzaminator bezlitośnie zeruje zadanie za dzielenie przez przybliżenie.',
    intuition: 'Błąd bezwzględny to prosta różnica $|x - a|$. W błędzie względnym pamiętaj o żelaznej regule: **zawsze dzielisz przez wartość DOKŁADNĄ $x$**, nigdy przez przybliżenie $a$!',
    keyTakeaway: 'x to wartość dokładna, a to przybliżenie. Błąd względny dzielimy ZAWSZE przez wartość DOKŁADNĄ x, a nigdy przez przybliżenie!',
    trapAlert: 'Klasyczna pułapka egzaminacyjna: uczeń dzieli błąd bezwzględny przez podane przybliżenie zamiast przez liczbę dokładną.'
  },
  '1.7': {
    lessonId: '1.7',
    title: 'Podzielność, liczby pierwsze i dowodzenie',
    concept_essence: 'Liczba całkowita $n$ jest podzielna przez liczbę $k \\neq 0$ wtedy i tylko wtedy, gdy istnieje liczba całkowita $m$, taka że $n = k \\cdot m$. W dowodach podzielności dążymy do wyłączenia szukanej wielokrotności przed nawias lub zapisu wyrażenia w postaci iloczynu kolejnych liczb całkowitych.',
    matura_context: 'W zadaniu dowodowym z algebry egzaminator oczekuje precyzji: przekształcenia algebraicznego z wyłączeniem szukanej wielokrotności oraz formalnego komentarza słownego uzasadniającego, dlaczego czynniki gwarantują podzielność.',
    core_formulas: `\\begin{aligned} n &= k \\cdot m \\quad (m \\in \\mathbb{Z}) \\\\[6pt] n(n+1) &= 2k \\\\[6pt] (n-1)n(n+1) &= 6k \\end{aligned}`,
    formula_notes: 'Iloczyn dwóch kolejnych liczb całkowitych jest zawsze podzielny przez 2, a iloczyn trzech kolejnych liczb całkowitych dzieli się przez 6.',
    coreFormulaLatex: `\\begin{aligned} n &= k \\cdot m \\quad (m \\in \\mathbb{Z}) \\\\[6pt] n(n+1) &= 2k \\\\[6pt] (n-1)n(n+1) &= 6k \\end{aligned}`,
    worked_example: {
      problem: 'Udowodnij, że dla każdej liczby całkowitej $n$ wyrażenie $n^3 - n$ jest podzielne przez $6$.',
      step1: 'Rozłóż wyrażenie na czynniki: $n^3 - n = n(n^2 - 1) = (n-1)n(n+1)$.',
      step2: 'Zapisz wniosek: $(n-1), n, (n+1)$ to iloczyn trzech kolejnych liczb całkowitych. Wśród nich co najmniej jedna jest podzielna przez 2 i dokładnie jedna przez 3, zatem iloczyn dzieli się przez $2 \\cdot 3 = 6$.',
      result: '6 \\mid (n^3 - n)'
    },
    exam_trap: 'Brak formalnego komentarza słownego to utrata 1 punktu na egzaminie! Samo rozłożenie na nawiasy nie wystarczy – egzaminator wymaga uzasadnienia, że iloczyn kolejnych liczb zawiera wielokrotności 2 i 3.',
    intuition: 'W zadaniu dowodowym z podzielności Twoim celem jest **wyłączenie szukanej wielokrotności przed nawias** (np. $W = 6k$) i formalne uzasadnienie, dlaczego liczba w nawiasie $k$ jest całkowita.',
    keyTakeaway: 'W zadaniu dowodowym przekształć algebraicznie wyrażenie tak, by wyłączyć szukaną wielokrotność przed nawias. Na końcu ZAWSZE dopisz słowny wniosek podsumowujący dowód!',
    trapAlert: 'Egzaminator bezwzględnie odejmie 1 punkt za brak słownego podsumowania i uzasadnienia, dlaczego liczba w nawiasie jest całkowita!'
  }
};

/**
 * Retrieves the comprehensive Theory Pill (Pigułka Wiedzy) for a given lesson
 */
export function getLessonTheoryPill(lessonId: string): LessonTheoryPill {
  const cleanId = String(lessonId).replace(/^lesson-/, '');
  let foundLesson: any = null;
  for (const topic of ((curriculumData as any).topics || [])) {
    const l = topic.lessons?.find((les: any) => String(les.id) === cleanId);
    if (l) {
      foundLesson = l;
      break;
    }
  }

  const formulaSheet = formulaSheetsByLesson[cleanId] || formulaSheetsByLesson['1.1'];
  const defaultPill = defaultTheoryPillsByLesson[cleanId] || defaultTheoryPillsByLesson['1.1'];
  const pillData = foundLesson?.theory_pill || foundLesson?.theoryPill || {};

  return {
    lessonId: cleanId,
    title: foundLesson?.title || defaultPill?.title || formulaSheet?.title || `Lekcja ${cleanId}`,
    concept_essence: pillData.concept_essence || pillData.key_takeaway || defaultPill?.concept_essence || pillData.intuition || defaultPill?.intuition,
    matura_context: pillData.matura_context || defaultPill?.matura_context || pillData.key_takeaway || defaultPill?.keyTakeaway,
    core_formulas: pillData.core_formula || pillData.core_formulas || defaultPill?.core_formulas || pillData.coreFormulaLatex,
    formula_notes: pillData.formula_notes || defaultPill?.formula_notes || '',
    coreFormulaLatex: pillData.core_formula || pillData.core_formulas || defaultPill?.core_formulas,
    worked_example: pillData.worked_example || defaultPill?.worked_example,
    exam_trap: pillData.trap_alert || pillData.exam_trap || pillData.cke_trap || defaultPill?.exam_trap,
    intuition: pillData.key_takeaway || pillData.concept_essence || defaultPill?.concept_essence || defaultPill?.intuition,
    keyTakeaway: pillData.key_takeaway || pillData.matura_context || defaultPill?.keyTakeaway,
    trapAlert: pillData.trap_alert || pillData.exam_trap || pillData.cke_trap || defaultPill?.trapAlert,
    summary: pillData.summary || pillData.key_takeaway || ''
  };
}

/**
 * Zwraca całą dostępną pulę zadań dla danej lekcji (do pętli Mastery Learning)
 */
export function getLessonTaskPool(lessonId: string): PoolTask[] {
  const cleanId = String(lessonId).replace(/^lesson-/, '');
  return dzial1TasksPool.filter(t => t.lessonId === cleanId);
}

/**
 * Dynamic Session Generator (Mastery Workout Flow):
 * Losuje z puli danej lekcji zestaw zadań egzaminacyjnych E8.
 * Towarzyszy im Krok 1 (Pigułka Wiedzy) oraz cel 4 poprawnych odpowiedzi.
 */
export function drawSessionTasks(lessonId: string): {
  sessionTasks: any[];
  formulaSheet: LessonFormulaSheet | null;
  theoryPill: LessonTheoryPill;
  lessonKey: string;
} {
  const cleanId = String(lessonId).replace(/^lesson-/, '');
  const lessonPool = dzial1TasksPool.filter(t => t.lessonId === cleanId);
  const theoryPill = getLessonTheoryPill(cleanId);
  const formulaSheet = formulaSheetsByLesson[cleanId] || {
    lessonId: cleanId,
    title: theoryPill.title,
    formulas: [
      { title: 'Kluczowe wzory i reguły', latex: theoryPill.core_formulas || '' }
    ],
    goldenRule: theoryPill.keyTakeaway || theoryPill.concept_essence || '',
    ckeTrap: {
      error: 'Częsty błąd egzaminacyjny',
      correct: 'Poprawne rozumowanie CKE',
      description: theoryPill.trapAlert || ''
    }
  };

  if (lessonPool.length === 0) {
    return { sessionTasks: [], formulaSheet, theoryPill, lessonKey: cleanId };
  }

  // Cel: 4 zadania z puli lekcji
  const targetCount = Math.min(4, lessonPool.length);

  // Dynamic random shuffle
  const shuffled = shuffleArray(lessonPool);
  const rawTasks = shuffled.slice(0, targetCount);

  // Map to unified TaskItem structure
  const sessionTasks = rawTasks.map((task, idx) => ({
    id: task.id,
    lessonId: cleanId,
    type: task.type || (task.options && task.options.length > 0 ? 'SINGLE_CHOICE' : 'OPEN_PROOF'),
    tier: task.tier,
    tierLabel: task.tierLabel,
    stepNumber: idx + 1,
    totalSteps: rawTasks.length,
    points: task.points,
    source: task.source || 'CKE Egzamin Ósmoklasisty • Zadanie E8',
    cke_source: task.source || 'CKE Egzamin Ósmoklasisty • Zadanie E8',
    title: `Zadanie ${idx + 1} z ${rawTasks.length} • ${task.tierLabel}`,
    topic: `Liczby Rzeczywiste • Lekcja ${cleanId}`,
    instruction: task.instruction || (task.type === 'OPEN_PROOF' ? 'Zapisz swoje przekształcenia i uzasadnienie podzielności...' : 'Dokończ zdanie. Wybierz właściwą odpowiedź spośród podanych.'),
    math_statement: task.question,
    question: task.question,
    options: task.options || [],
    correct_answer: task.correct_answer,
    numeric_correct_answer: task.correct_answer,
    explanation: task.explanation,
    officialKey: task.officialKey || task.explanation,
    ai_tutor_rubric: task.ai_tutor_rubric,
    modelSolutionSteps: task.modelSolutionSteps || [{ step_num: 1, description: task.explanation }],
    hints: {
      level_1: task.hint_1,
      level_2: task.hint_2,
      ai_tutor_prompt: `Pomóż uczniowi rozwiązać zadanie z Egzaminu Ósmoklasisty: ${task.question}`
    },
    maxPoints: task.points,
    difficulty: task.tierLabel,
    xp: task.points * 10
  }));

  return {
    sessionTasks,
    formulaSheet,
    theoryPill,
    lessonKey: cleanId
  };
}

export interface BossExamTask {
  id: string;
  lessonId: string;
  lessonOrder: number;
  lessonTitle: string;
  topicLabel: string;
  question: string;
  options?: TaskOption[];
  correct_answer?: string;
  explanation: string;
  hint_1: string;
  hint_2: string;
  source: string;
  type: string;
  points: number;
  ai_tutor_rubric?: any;
}

export interface BossExamData {
  id: string;
  title: string;
  subtitle: string;
  timeLimitMinutes: number;
  passingScore: number;
  totalQuestions: number;
  rewardXp: number;
  rewardCoins: number;
  badgeId: string;
  tasks: BossExamTask[];
}

/**
 * Automatyczny generator sprawdzianu działu (Boss Exam):
 * Losuje po zadaniu z każdej lekcji danego działu (pytania przekrojowe CKE).
 */
export function generateBossExam(topicNumericId: number = 1): BossExamData {
  const topic = ((curriculumData as any).topics || []).find((t: any) => t.id === topicNumericId) 
    || (curriculumData as any).topics?.[0];

  const examTasks: BossExamTask[] = [];

  (topic?.lessons || []).forEach((lesson: any, idx: number) => {
    const pool = dzial1TasksPool.filter(t => t.lessonId === String(lesson.id));
    if (pool.length > 0) {
      const chosen = pool[Math.floor(Math.random() * pool.length)];
      examTasks.push({
        id: chosen.id,
        lessonId: String(lesson.id),
        lessonOrder: idx + 1,
        lessonTitle: lesson.title || `Lekcja ${lesson.id}`,
        topicLabel: topic.short_title || topic.title || `Dział ${topicNumericId}`,
        question: chosen.question,
        options: chosen.options || [],
        correct_answer: chosen.correct_answer,
        explanation: chosen.explanation,
        hint_1: chosen.hint_1,
        hint_2: chosen.hint_2,
        source: chosen.source || `Egzamin Ósmoklasisty CKE • ${lesson.title}`,
        type: chosen.type || (chosen.options && chosen.options.length > 0 ? 'SINGLE_CHOICE' : 'OPEN'),
        points: chosen.points || 1,
        ai_tutor_rubric: chosen.ai_tutor_rubric
      });
    }
  });

  const qCount = examTasks.length || 1;

  return {
    id: `exam-dzial-${topicNumericId}`,
    title: `Sprawdzian: ${topic?.short_title || topic?.title || `Dział ${topicNumericId}`}`,
    subtitle: `Przekrojowy test podsumowujący Dział ${topicNumericId} E8`,
    timeLimitMinutes: Math.max(10, qCount * 3),
    passingScore: Math.max(1, Math.ceil(qCount * 0.6)),
    totalQuestions: qCount,
    rewardXp: 150 + topicNumericId * 10,
    rewardCoins: 80,
    badgeId: `master_dzial_${topicNumericId}`,
    tasks: examTasks
  };
}

export function generateDzial1BossExam(): BossExamData {
  return generateBossExam(1);
}
