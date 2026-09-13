import fs from 'fs';

const path = 'src/data/mathTasks.ts';

const newTasks = `export const mathTopics = [
  {
    id: 'math-1',
    name: 'Dział 1: Liczby Rzeczywiste (Poziom ULTIMATE)',
    progress: '0%',
    locked: false,
    tasks: [
      {
        id: 'MAT-01-THEORY', type: 'theory', topic: 'Liczby Rzeczywiste • Teoria', title: 'Lekcja 1: Ułamki, Potęgi i Pierwiastki',
        question: 'Przeczytaj poniższą pigułkę wiedzy, aby przypomnieć sobie najważniejsze wzory i zasady.',
        officialKey: 'Pigułka wiedzy:\\n• Kolejność działań: Nawiasy -> Potęgowanie/Pierwiastkowanie -> Mnożenie/Dzielenie -> Dodawanie/Odejmowanie.\\n• Mnożenie potęg: a^x * a^y = a^(x+y). Przykład: 2^3 * 2^4 = 2^7.\\n• Ujemny wykładnik: Odwraca ułamek! a^(-x) = 1/(a^x).\\n• Pierwiastki nieparzystego stopnia: Mogą być z liczb ujemnych! cbrt(-8) = -2, bo (-2)^3 = -8.',
        maxPoints: 0, difficulty: 'Teoria', method: 'Czytanie', xp: 5, time: '2 min'
      },
      {
        id: 'MAT-01-001', type: 'practice', topic: 'Liczby Rzeczywiste • Lekcja 1.1', title: 'Wartość wyrażenia ułamkowego',
        question: 'Wartość wyrażenia 2024 : (1 - 1/2025) - (1 - 2025/2024) : 1/2024 jest równa:\\nA) 0\\nB) 1\\nC) 2024\\nD) 2026',
        officialKey: 'D (Ułamek sprowadzamy do 2024 / (2024/2025) - (-1/2024)/(1/2024) = 2025 - (-1) = 2026)',
        maxPoints: 1, difficulty: 'Podstawowy', method: 'Active Recall', xp: 10, time: '2 min'
      },
      {
        id: 'MAT-01-002', type: 'practice', topic: 'Liczby Rzeczywiste • Lekcja 1.1', title: 'Upraszczanie sumy pierwiastków',
        question: 'Liczba (cbrt(250) + cbrt(54)) / (cbrt(250) - cbrt(54)) jest równa:\\nA) cbrt(76/49)\\nB) -1\\nC) 4\\nD) 4*cbrt(2)',
        officialKey: 'C (cbrt(250) = 5*cbrt(2), a cbrt(54) = 3*cbrt(2). Podstawiamy: 8*cbrt(2) / 2*cbrt(2) = 4)',
        maxPoints: 1, difficulty: 'Podstawowy', method: 'Active Recall', xp: 10, time: '2 min'
      },
      {
        id: 'MAT-01-003', type: 'practice', topic: 'Liczby Rzeczywiste • Lekcja 1.1', title: 'Wymierność wyrażenia z pierwiastkiem',
        question: 'Dana jest liczba x = a - (sqrt(3) - sqrt(2))^2, gdzie a jest liczbą rzeczywistą. Wybierz dwie odpowiedzi, tak aby dla każdej z nich dokończenie zdania było prawdziwe. Liczba x jest wymierna dla:\\nA) a = 5\\nB) a = (sqrt(2) - sqrt(3))^2 + 0,3\\nC) a = 6\\nD) a = -2*sqrt(6) + 12,5\\nE) a = (sqrt(2) - sqrt(3))^2 - 2*sqrt(6)\\nF) a = -sqrt(6)',
        officialKey: 'B, D (Przekształcamy wzór określający x: x = a - (3 - 2*sqrt(6) + 2) = a - 5 + 2*sqrt(6). Aby wynik był wymierny, a musi "zabić" 2*sqrt(6), więc musi posiadać człon -2*sqrt(6).)',
        maxPoints: 2, difficulty: 'Podstawowy', method: 'Active Recall', xp: 20, time: '3 min'
      },
      {
        id: 'MAT-01-004', type: 'theory', topic: 'Liczby Rzeczywiste • Lekcja 1.1', title: 'Własności pierwiastków (Prawda/Fałsz)',
        question: 'Bez użycia kalkulatora, oceń Prawda/Fałsz:\\n1. sqrt(50) + sqrt(50) = sqrt(100)\\n2. cbrt(-64) = -4',
        officialKey: '1. F (nie wolno dodawać pod pierwiastkami!), 2. P.',
        maxPoints: 2, difficulty: 'Podstawowy', method: 'Microlearning', xp: 20, time: '2 min'
      },
      {
        id: 'MAT-01-THEORY-2', type: 'theory', topic: 'Liczby Rzeczywiste • Teoria 2', title: 'Lekcja 2: Procenty i Zastosowania Praktyczne',
        question: 'Przeczytaj poniższą pigułkę wiedzy, aby przypomnieć sobie najważniejsze wzory i zasady.',
        officialKey: 'Pigułka wiedzy:\\n• O ile procent więcej? Jeśli pensja A to 3000, a pensja B to 4000. Pensja B jest większa od A o: (4000-3000)/3000 * 100% = 33,3%.\\n• Lokaty (procent składany): Kasa rośnie jak kula śnieżna. Wzór: K_n = K_0 * (1 + p/100)^n.',
        maxPoints: 0, difficulty: 'Teoria', method: 'Czytanie', xp: 5, time: '2 min'
      },
      {
        id: 'MAT-01-005', type: 'practice', topic: 'Liczby Rzeczywiste • Lekcja 1.2', title: 'Zależności procentowe',
        question: 'Pensja pana X jest o 50% wyższa od średniej krajowej, a pensja pana Y jest o 40% niższa od średniej krajowej.\\n1. Pensja pana X jest wyższa od pensji pana Y o:\\nA. 40% B. 90% C. 150% D. 275%\\n2. Pensja pana Y jest niższa od pensji pana X o:\\nE. 60% F. 73% G. 90% H. 150%',
        officialKey: 'Średnia to S. Pan X = 1.5S, Pan Y = 0.6S. Cześć 1: X jest większy od Y o: (1.5S - 0.6S)/0.6S = 1.5 = 150%. Odp: C. Cześć 2: Y jest mniejszy od X o: (1.5S - 0.6S)/1.5S = 0.6 = 60%. Odp: E.',
        maxPoints: 2, difficulty: 'Podstawowy', method: 'Interleaving', xp: 20, time: '3 min'
      },
      {
        id: 'MAT-01-006', type: 'practice', topic: 'Liczby Rzeczywiste • Lekcja 1.2', title: 'Zysk z długoterminowej lokaty',
        question: 'Oprocentowanie na lokacie wynosi 3% w skali roku (po podatkach). Po 10 latach oszczędzania, kwota na lokacie będzie większa od wpłaconej o (w zaokrągleniu do 1%):\\nA) 30%\\nB) 34%\\nC) 36%\\nD) 43%',
        officialKey: 'B (Kwota po 10 latach: K = K_0 * (1.03)^10. (1.03)^10 ≈ 1.3439. Zysk wynosi około 34%.)',
        maxPoints: 1, difficulty: 'Podstawowy', method: 'Active Recall', xp: 10, time: '2 min'
      },
      {
        id: 'MAT-01-THEORY-3', type: 'theory', topic: 'Liczby Rzeczywiste • Teoria 3', title: 'Lekcja 3: Logarytmy i Wartość Bezwzględna',
        question: 'Przeczytaj poniższą pigułkę wiedzy, aby przypomnieć sobie najważniejsze wzory i zasady.',
        officialKey: 'Pigułka wiedzy:\\n• Logarytm: log_a b = c oznacza a^c = b. Pamiętaj wzory: suma logarytmów to logarytm z iloczynu! log_a x + log_a y = log_a(x * y).\\n• Wartość bezwzględna: Zawsze sprawdź znak wyrażenia wewnątrz |...|. Jeśli jest ujemne, zmień WSZYSTKIE znaki.',
        maxPoints: 0, difficulty: 'Teoria', method: 'Czytanie', xp: 5, time: '2 min'
      },
      {
        id: 'MAT-01-007', type: 'practice', topic: 'Liczby Rzeczywiste • Lekcja 1.3', title: 'Własności logarytmu i potęgi',
        question: 'Liczba log_2 [ (sqrt(2))^2 * (sqrt(2))^4 * (sqrt(2))^8 ] jest równa:\\nA) sqrt(2)\\nB) 7\\nC) 14\\nD) 2^7',
        officialKey: 'B (Sumujemy wykładniki: 2+4+8=14. Mamy log_2 ((sqrt(2))^14) = log_2 (2^7) = 7.)',
        maxPoints: 1, difficulty: 'Podstawowy', method: 'Active Recall', xp: 10, time: '2 min'
      },
      {
        id: 'MAT-01-008', type: 'practice', topic: 'Liczby Rzeczywiste • Lekcja 1.3', title: 'Suma logarytmów',
        question: 'Dane są liczby a = log_2(3*sqrt(5) + sqrt(13)) oraz b = log_2(3*sqrt(5) - sqrt(13)). Liczba a + b jest równa:\\nA) log_2 45\\nB) log_2 30\\nC) 4\\nD) 5',
        officialKey: 'D (Suma logarytmów: log_2( (3*sqrt(5)+sqrt(13))(3*sqrt(5)-sqrt(13)) ) = log_2 (45 - 13) = log_2 32 = 5)',
        maxPoints: 1, difficulty: 'Podstawowy', method: 'Active Recall', xp: 10, time: '2 min'
      },
      {
        id: 'MAT-01-009', type: 'practice', topic: 'Liczby Rzeczywiste • Lekcja 1.3', title: 'Wartość bezwzględna',
        question: 'Liczba |sqrt(5) - 1| - 3|2 - sqrt(5)| jest równa:\\nA) -7\\nB) 5 - 4*sqrt(5)\\nC) 4*sqrt(5) - 7\\nD) 5 - 2*sqrt(5)',
        officialKey: 'D (sqrt(5)-1 jest dodatnie. 2-sqrt(5) jest ujemne, zmieniamy znaki na sqrt(5)-2. Wynik: sqrt(5)-1 - 3(sqrt(5)-2) = 5 - 2*sqrt(5))',
        maxPoints: 1, difficulty: 'Podstawowy', method: 'Active Recall', xp: 10, time: '3 min'
      },
      {
        id: 'MAT-01-010', type: 'practice', topic: 'Liczby Rzeczywiste • Sprawdzian', title: 'Potęgowanie i skracanie podstaw',
        question: 'Dokończ zdanie. Liczba 3^4 * 9^2 * 27^(-1) jest równa:\\nA) 3^3\\nB) 3^5\\nC) 3^7\\nD) 3^8',
        officialKey: 'B. Zamieniamy na potęgi trójki: 3^4 * (3^2)^2 * (3^3)^(-1) = 3^4 * 3^4 * 3^(-3) = 3^5.',
        maxPoints: 1, difficulty: 'Podstawowy', method: 'Test', xp: 10, time: '2 min'
      },
      {
        id: 'MAT-01-013', type: 'practice', topic: 'Liczby Rzeczywiste • Sprawdzian', title: 'Obliczanie ceny po obniżce',
        question: 'Sukienka po obniżce o 20% kosztuje 120 zł. Oblicz cenę sukienki przed obniżką, a następnie oblicz, jakim procentem nowej ceny jest obniżka.',
        officialKey: 'Cena początkowa to x. 80% z x = 120 => x = 150 zł. Obniżka wyniosła 30 zł. Obniżka stanowi 30/120 * 100% = 25% nowej ceny.',
        maxPoints: 2, difficulty: 'Podstawowy', method: 'Test', xp: 20, time: '3 min'
      }
    ]
  },
  {
    id: 'math-2',
    name: 'Dział 2: Wyrażenia Algebraiczne i Dowody (Poziom ULTIMATE)',
    progress: '0%',
    locked: false,
    tasks: [
      {
        id: 'MAT-02-THEORY', type: 'theory', topic: 'Wyrażenia Algebraiczne • Teoria', title: 'Lekcja 1: Wzory Skróconego Mnożenia',
        question: 'Zanim zaczniesz zadania, przypomnij sobie podstawowe wzory i zasady.',
        officialKey: 'Pigułka wiedzy:\\n• Kwadrat sumy/różnicy: (a +- b)^2 = a^2 +- 2ab + b^2.\\n• Różnica kwadratów: a^2 - b^2 = (a-b)(a+b). Świetne do skracania skomplikowanych ułamków.\\n• Wyrażenia wymierne: To po prostu "ułamki z iksami". Zanim cokolwiek z nimi zrobisz, ZAWSZE wyznaczaj dziedzinę (mianownik != 0).',
        maxPoints: 0, difficulty: 'Teoria', method: 'Czytanie', xp: 5, time: '2 min'
      },
      {
        id: 'MAT-02-001', type: 'practice', topic: 'Wyrażenia Algebraiczne • Lekcja 2.1', title: 'Skracanie ułamków algebraicznych',
        question: 'Liczba ((x^2 - 1)(x - 1)) / (x^2 - 2x + 1) dla x =/= 1 jest równa:\\nA) x^2 - 1\\nB) x - 1\\nC) x + 1\\nD) x',
        officialKey: 'C (Rozpisujemy licznik ze wzoru na różnicę kwadratów: (x-1)(x+1)(x-1). Mianownik to wzór na (x-1)^2. Skracamy i zostaje x+1.)',
        maxPoints: 1, difficulty: 'Podstawowy', method: 'Active Recall', xp: 10, time: '2 min'
      },
      {
        id: 'MAT-02-002', type: 'practice', topic: 'Wyrażenia Algebraiczne • Lekcja 2.1', title: 'Zastosowanie wzorów skróconego mnożenia',
        question: 'Dla każdej liczby rzeczywistej x i y wyrażenie (2x - y)^2 - (2x + y)^2 jest równe:\\nA) 8x^2\\nB) -8xy\\nC) -4xy\\nD) 2y^2',
        officialKey: 'B (Używamy wzorów: (4x^2 - 4xy + y^2) - (4x^2 + 4xy + y^2) = -8xy)',
        maxPoints: 1, difficulty: 'Podstawowy', method: 'Active Recall', xp: 10, time: '2 min'
      },
      {
        id: 'MAT-02-THEORY-2', type: 'theory', topic: 'Wyrażenia Algebraiczne • Teoria', title: 'Lekcja 2: Dowody i Podzielność',
        question: 'Zanim zaczniesz zadania, przypomnij sobie podstawowe wzory i zasady.',
        officialKey: 'Pigułka wiedzy:\\n• Jak udowodnić podzielność przez k? Przekształcaj wyrażenie tak długo, aż uzyskasz postać k * (...), gdzie w nawiasie jest liczba całkowita.\\n• Kolejne liczby: n, n+1, n+2. Iloczyn dwóch kolejnych liczb n(n+1) zawsze dzieli się przez 2. Iloczyn trzech kolejnych zawsze dzieli się przez 6.',
        maxPoints: 0, difficulty: 'Teoria', method: 'Czytanie', xp: 5, time: '2 min'
      },
      {
        id: 'MAT-02-003', type: 'practice', topic: 'Wyrażenia Algebraiczne • Lekcja 2.2', title: 'Dowód podzielności przez 6',
        question: 'Wykaż, że dla każdej liczby naturalnej n >= 1 liczba n(n^2 + 3n + 2) jest podzielna przez 6.',
        officialKey: 'Nawias rozkładamy z delty: n^2+3n+2 = (n+1)(n+2). Mamy więc iloczyn n(n+1)(n+2), co stanowi trzy kolejne liczby naturalne. Ich iloczyn dzieli się przez 6.',
        maxPoints: 2, difficulty: 'Podstawowy', method: 'Dowód', xp: 20, time: '3 min'
      },
      {
        id: 'MAT-02-005', type: 'practice', topic: 'Wyrażenia Algebraiczne • Lekcja 2.2', title: 'Dowód podzielności sumy potęg',
        question: 'Udowodnij, że liczba 3^45 + 9^22 + 27^14 jest podzielna przez 37.',
        officialKey: '3^45 + (3^2)^22 + (3^3)^14 = 3^45 + 3^44 + 3^42. Wyciągamy 3^42: 3^42(3^3 + 3^2 + 1) = 3^42(27+9+1) = 3^42 * 37. Wynik jest wielokrotnością 37.',
        maxPoints: 2, difficulty: 'Podstawowy', method: 'Dowód', xp: 20, time: '4 min'
      },
      {
        id: 'MAT-02-010', type: 'practice', topic: 'Wyrażenia Algebraiczne • Sprawdzian', title: 'Dowód nierówności z dwiema zmiennymi',
        question: 'Wykaż, że dla dowolnych liczb rzeczywistych x, y zachodzi nierówność x^2 + y^2 >= 2xy.',
        officialKey: 'Przenosimy 2xy na lewą stronę: x^2 - 2xy + y^2 >= 0. Zwijamy we wzór skróconego mnożenia: (x-y)^2 >= 0. Kwadrat liczby rzeczywistej jest zawsze nieujemny, c.n.d.',
        maxPoints: 2, difficulty: 'Podstawowy', method: 'Dowód', xp: 20, time: '3 min'
      }
    ]
  },
  {
    id: 'math-3',
    name: 'Dział 3: Równania i Nierówności (Poziom ULTIMATE)',
    progress: '0%',
    locked: false,
    tasks: [
      {
        id: 'MAT-03-THEORY', type: 'theory', topic: 'Równania i Nierówności • Teoria', title: 'Lekcja 1: Nierówności Liniowe i Kwadratowe',
        question: 'Zanim zaczniesz zadania, przypomnij sobie podstawowe wzory i zasady.',
        officialKey: 'Pigułka wiedzy:\\n• Nierówność Liniowa: Rozwiązujesz jak zwykłe równanie, ale UWAGA: jeśli mnożysz lub dzielisz obie strony przez liczbę ujemną, zawsze odwracaj znak nierówności!\\n• Nierówność Kwadratowa: Zawsze sprowadź do postaci ax^2+bx+c > 0 (po prawej stronie musi być zero!). Policz pierwiastki i narysuj przybliżoną parabolę.',
        maxPoints: 0, difficulty: 'Teoria', method: 'Czytanie', xp: 5, time: '2 min'
      },
      {
        id: 'MAT-03-002', type: 'practice', topic: 'Równania i Nierówności • Lekcja 3.1', title: 'Rozwiązywanie nierówności kwadratowej',
        question: 'Rozwiąż nierówność kwadratową: (3x - 4)(x - 1) < x.',
        officialKey: '3x^2 - 3x - 4x + 4 < x => 3x^2 - 8x + 4 < 0. Delta = 64 - 48 = 16. Pierwiastki: x1 = 2/3, x2 = 2. Parabola uśmiechnięta. Zbiór rozwiązań to x in (2/3, 2).',
        maxPoints: 2, difficulty: 'Podstawowy', method: 'Active Recall', xp: 20, time: '4 min'
      },
      {
        id: 'MAT-03-008', type: 'practice', topic: 'Równania i Nierówności • Sprawdzian', title: 'Nierówność kwadratowa z deltą',
        question: 'Rozwiąż nierówność: x^2 - 3x - 10 >= 0.',
        officialKey: 'Delta = 9 - 4(1)(-10) = 49. Pierwiastki: x1 = -2, x2 = 5. Parabola ramionami w górę. Odpowiedź: x in (-infty, -2> U <5, infty).',
        maxPoints: 2, difficulty: 'Podstawowy', method: 'Test', xp: 20, time: '3 min'
      },
      {
        id: 'MAT-03-THEORY-2', type: 'theory', topic: 'Równania i Nierówności • Teoria', title: 'Lekcja 2: Równania Wymierne i Wielomianowe',
        question: 'Zanim zaczniesz zadania, przypomnij sobie podstawowe wzory i zasady.',
        officialKey: 'Pigułka wiedzy:\\n• Dziedzina to świętość! Jeśli masz równanie z ułamkiem (np. 1/(x-2) = 5), ZAWSZE na samej górze napisz, że mianownik nie może być zerem.\\n• Równania Wielomianowe (Stopnia 3 lub wyżej): Grupowanie to klucz.',
        maxPoints: 0, difficulty: 'Teoria', method: 'Czytanie', xp: 5, time: '2 min'
      },
      {
        id: 'MAT-03-004', type: 'practice', topic: 'Równania i Nierówności • Lekcja 3.2', title: 'Równanie z ułamkiem algebraicznym',
        question: 'Dane jest równanie 2 / (2x + 1) = (x - 1) / (x + 2).\\nWyznacz dziedzinę tego równania. Następnie rozwiąż to równanie.',
        officialKey: '1) Dziedzina: 2x+1 =/= 0 => x =/= -1/2 oraz x+2 =/= 0 => x =/= -2.\\n2) Rozwiązanie: 2(x+2) = (x-1)(2x+1) => 2x + 4 = 2x^2 - x - 1 => 2x^2 - 3x - 5 = 0. Delta = 49. x1 = -1, x2 = 5/2. Oba w dziedzinie.',
        maxPoints: 3, difficulty: 'Podstawowy', method: 'Active Recall', xp: 30, time: '5 min'
      },
      {
        id: 'MAT-03-010', type: 'practice', topic: 'Równania i Nierówności • Sprawdzian', title: 'Grupowanie wyrazów w równaniu',
        question: 'Rozwiąż równanie x^3 - 3x^2 + 4x - 12 = 0.',
        officialKey: 'Grupowanie: x^2(x-3) + 4(x-3) = 0 => (x^2+4)(x-3) = 0. Ponieważ x^2+4 = 0 nie ma rozwiązań (x^2 = -4), zostaje nam tylko x-3=0, czyli x=3.',
        maxPoints: 2, difficulty: 'Podstawowy', method: 'Test', xp: 20, time: '3 min'
      }
    ]
  },
  {
    id: 'math-4',
    name: 'Dział 4: Układy Równań (Poziom ULTIMATE)',
    progress: '0%',
    locked: false,
    tasks: [
      {
        id: 'MAT-04-THEORY', type: 'theory', topic: 'Układy Równań • Teoria', title: 'Lekcja 1: Rozwiązywanie i Interpretacja',
        question: 'Zanim zaczniesz zadania, przypomnij sobie podstawowe wzory i zasady.',
        officialKey: 'Pigułka wiedzy:\\nMetody: Podstawianie lub Przeciwnych współczynników.\\nInterpretacja: Rozwiązanie to punkt przecięcia dwóch prostych na wykresie. Brak rozwiązań to proste równoległe.',
        maxPoints: 0, difficulty: 'Teoria', method: 'Czytanie', xp: 5, time: '2 min'
      },
      {
        id: 'MAT-04-002', type: 'practice', topic: 'Układy Równań • Lekcja 4.1', title: 'Rozwiązywanie metodą przeciwnych współczynników',
        question: 'Rozwiąż układ równań:\\n3x - 2y = 8\\n5x + 3y = 7',
        officialKey: 'Przeciwne współczynniki. Górę razy 3, dół razy 2. Góra: 9x - 6y = 24. Dół: 10x + 6y = 14. Dodajemy stronami: 19x = 38 => x = 2. Wstawiamy do dowolnego: 3(2) - 2y = 8 => y = -1.',
        maxPoints: 2, difficulty: 'Podstawowy', method: 'Active Recall', xp: 20, time: '4 min'
      },
      {
        id: 'MAT-04-005', type: 'practice', topic: 'Układy Równań • Lekcja 4.2', title: 'Znajdowanie współczynników',
        question: 'Para liczb (x, y) = (2, -1) jest rozwiązaniem układu równań:\\nax + by = 5\\n2ax - by = 4\\nWtedy:\\nA) a = 1, b = -3\\nB) a = -1, b = 3\\nC) a = 3/2, b = -2\\nD) a = 1, b = 3',
        officialKey: 'C (Wstawiamy x=2, y=-1. Mamy 2a - b = 5 oraz 4a + b = 4. Dodajemy stronami: 6a = 9 => a = 3/2. Wtedy 2(3/2) - b = 5 => 3 - b = 5 => b = -2.)',
        maxPoints: 1, difficulty: 'Podstawowy', method: 'Active Recall', xp: 10, time: '3 min'
      },
      {
        id: 'MAT-04-009', type: 'practice', topic: 'Układy Równań • Sprawdzian', title: 'Zadanie tekstowe: Sprzedaż biletów',
        question: 'Bilety do teatru kosztowały 25 zł (normalny) i 15 zł (ulgowy). Sprzedano łącznie 120 biletów za kwotę 2300 zł. Ile sprzedano biletów normalnych, a ile ulgowych? Ułóż odpowiedni układ równań i go rozwiąż.',
        officialKey: 'n + u = 120 oraz 25n + 15u = 2300. Z 1. równania n = 120 - u. Wstawiamy: 25(120 - u) + 15u = 2300 => 3000 - 10u = 2300 => 10u = 700 => u = 70. Wtedy n = 50. Sprzedano 50 normalnych i 70 ulgowych.',
        maxPoints: 2, difficulty: 'Podstawowy', method: 'Zadanie Tekstowe', xp: 20, time: '4 min'
      }
    ]
  },
  {
    id: 'math-5',
    name: 'Dział 5: Własności Funkcji (Poziom ULTIMATE)',
    progress: '0%',
    locked: false,
    tasks: [
      {
        id: 'MAT-05-THEORY', type: 'theory', topic: 'Własności Funkcji • Teoria', title: 'Lekcja 1: Dziedzina i Wykresy',
        question: 'Zanim zaczniesz zadania, przypomnij sobie podstawowe wzory i zasady.',
        officialKey: 'Pigułka wiedzy:\\n• Dziedzina (D_f): Odczytujesz ją z osi poziomej X. Szukasz od najdalszego lewego punktu wykresu do najdalszego prawego.\\n• Zbiór Wartości (ZW_f): Odczytujesz z osi pionowej Y.\\n• Miejsce zerowe: To taki x, dla którego y jest równe 0.',
        maxPoints: 0, difficulty: 'Teoria', method: 'Czytanie', xp: 5, time: '2 min'
      },
      {
        id: 'MAT-05-001', type: 'practice', topic: 'Własności Funkcji • Lekcja 5.1', title: 'Odczytywanie dziedziny z wykresu',
        question: 'Załóżmy, że wykres funkcji zaczyna się zamalowaną kropką w punkcie (-3, -2) i kończy pustą kropką w punkcie (5, 4). Dziedziną funkcji f jest przedział:\\nA) <-3, 5)\\nB) (-3, 5>\\nC) <-2, 4)\\nD) (-2, 4>',
        officialKey: 'A. Dziedzinę czytamy z osi X. Zaczyna się na -3 (zamalowane, więc domknięty) i idzie w prawo aż do 5 (puste, otwarty). <-3, 5).',
        maxPoints: 1, difficulty: 'Podstawowy', method: 'Active Recall', xp: 10, time: '2 min'
      },
      {
        id: 'MAT-05-005', type: 'practice', topic: 'Własności Funkcji • Lekcja 5.2', title: 'Wyznaczanie miejsc zerowych',
        question: 'Wyznacz wszystkie miejsca zerowe funkcji f(x) = (x-2)(x^2 - 9).',
        officialKey: 'Miejsce zerowe to y = 0. Przyrównujemy: (x-2)(x^2 - 9) = 0. Kiedy którykolwiek z nawiasów jest zerem! x-2 = 0 => x=2. ORAZ x^2 - 9 = 0 => x^2 = 9 => x=3 lub x=-3. Miejsca zerowe: x in {-3, 2, 3}.',
        maxPoints: 2, difficulty: 'Podstawowy', method: 'Active Recall', xp: 20, time: '3 min'
      },
      {
        id: 'MAT-05-008', type: 'practice', topic: 'Własności Funkcji • Sprawdzian', title: 'Wyznaczanie dziedziny ze wzoru',
        question: 'Wyznacz dziedzinę funkcji f(x) = sqrt(x-2) / (x-5).',
        officialKey: 'Mamy dwa ograniczenia. Pierwiastek kwadratowy: x-2 >= 0 => x >= 2. Mianownik: x-5 =/= 0 => x =/= 5. Dziedzina: D = <2, 5) U (5, infty).',
        maxPoints: 2, difficulty: 'Podstawowy', method: 'Test', xp: 20, time: '3 min'
      }
    ]
  },
  {
    id: 'math-6',
    name: 'Dział 6: Funkcja Liniowa i Kwadratowa (Poziom ULTIMATE)',
    progress: '0%',
    locked: false,
    tasks: [
      {
        id: 'MAT-06-THEORY', type: 'theory', topic: 'Funkcja Liniowa i Kwadratowa • Teoria', title: 'Lekcja 1: Proste i Parabole',
        question: 'Zanim zaczniesz zadania, przypomnij sobie podstawowe wzory i zasady.',
        officialKey: 'Pigułka wiedzy:\\n• Liniowa y = ax+b: Proste są równoległe, gdy mają takie same a. Proste są prostopadłe, gdy a1 * a2 = -1.\\n• Kwadratowa y = ax^2+bx+c: Trzy postacie do wyrycia (Ogólna, Kanoniczna, Iloczynowa). Wierzchołek p = -b/2a.',
        maxPoints: 0, difficulty: 'Teoria', method: 'Czytanie', xp: 5, time: '2 min'
      },
      {
        id: 'MAT-06-002', type: 'practice', topic: 'Funkcja Liniowa i Kwadratowa • Lekcja 6.1', title: 'Warunek prostopadłości prostych',
        question: 'Proste o równaniach y = 3ax - 2 oraz y = 2x + 3a są prostopadłe. Wtedy:\\nA) a = -1/6\\nB) a = 1/6\\nC) a = -2/3\\nD) a = 3/2',
        officialKey: 'A. Warunek prostopadłości: a1 * a2 = -1. Nasze wpółczynniki to (3a) oraz (2). Zatem: 3a * 2 = -1 => 6a = -1 => a = -1/6.',
        maxPoints: 1, difficulty: 'Podstawowy', method: 'Active Recall', xp: 10, time: '2 min'
      },
      {
        id: 'MAT-06-005', type: 'practice', topic: 'Funkcja Liniowa i Kwadratowa • Lekcja 6.2', title: 'Ekstrema funkcji kwadratowej w przedziale',
        question: 'Wyznacz najmniejszą i największą wartość funkcji kwadratowej f(x) = x^2 - 6x + 5 w przedziale domkniętym <1, 4>.',
        officialKey: 'Krok 1: Wierzchołek. p = 6/2 = 3. Leży w <1, 4>. q = f(3) = 3^2 - 18 + 5 = -4 (najmniejsza, bo a>0). Krok 2: Krańce. f(1) = 0. f(4) = -3. Największa: 0 (dla x=1), Najmniejsza: -4 (dla x=3).',
        maxPoints: 2, difficulty: 'Podstawowy', method: 'Active Recall', xp: 20, time: '4 min'
      },
      {
        id: 'MAT-06-006', type: 'practice', topic: 'Funkcja Liniowa i Kwadratowa • Lekcja 6.2', title: 'Postać iloczynowa z miejsc zerowych',
        question: 'Funkcja kwadratowa f ma miejsca zerowe równe -2 oraz 4. Jej wykres przechodzi przez punkt A=(-1, -5). Wyznacz wzór tej funkcji w postaci ogólnej.',
        officialKey: 'Postać iloczynowa: f(x) = a(x+2)(x-4). Wstawiamy punkt A: -5 = a(-1+2)(-1-4) => -5 = a(1)(-5) => a=1. Wzór to f(x) = 1(x+2)(x-4) = x^2 - 2x - 8.',
        maxPoints: 3, difficulty: 'Podstawowy', method: 'Active Recall', xp: 30, time: '4 min'
      }
    ]
  },
  {
    id: 'math-7',
    name: 'Dział 7: Optymalizacja (Poziom ULTIMATE)',
    progress: '0%',
    locked: false,
    tasks: [
      {
        id: 'MAT-07-THEORY', type: 'theory', topic: 'Optymalizacja • Teoria', title: 'Lekcja 1: Zadania optymalizacyjne',
        question: 'Zanim zaczniesz zadania, przypomnij sobie podstawowe wzory i zasady.',
        officialKey: 'Pigułka wiedzy:\\nKroki do pokonania optymalizacji:\\n1. Znajdź, co ma być maksymalne (często Pole lub Zysk).\\n2. Użyj ograniczenia z zadania.\\n3. Wyznacz jedną literkę z ograniczenia i wstaw do wzoru na Pole.\\n4. Znajdź wierzchołek paraboli.',
        maxPoints: 0, difficulty: 'Teoria', method: 'Czytanie', xp: 5, time: '2 min'
      },
      {
        id: 'MAT-07-001', type: 'practice', topic: 'Optymalizacja • Lekcja 7.1', title: 'Maksymalizacja przychodów ze sprzedaży',
        question: 'Pewien sklep sprzedaje 40 smartfonów tygodniowo po 2000 zł za sztukę. Właściciel zauważył, że każda obniżka ceny o 50 zł powoduje wzrost sprzedaży o 2 sztuki tygodniowo. Jaką cenę smartfona powinien ustalić właściciel, aby tygodniowy przychód z ich sprzedaży był największy?',
        officialKey: 'x - liczba obniżek. C = 2000 - 50x. S = 40 + 2x. Przychód P(x) = (2000-50x)(40+2x) = 80000 + 4000x - 2000x - 100x^2 = -100x^2 + 2000x + 80000. Wierzchołek p = -2000 / -200 = 10. Cena: 2000 - 50(10) = 1500 zł.',
        maxPoints: 4, difficulty: 'Rozszerzony/Podstawowy', method: 'Zadanie Otwarte', xp: 40, time: '6 min'
      },
      {
        id: 'MAT-07-002', type: 'practice', topic: 'Optymalizacja • Lekcja 7.1', title: 'Maksymalizacja pola wybiegu',
        question: 'Rolnik ma 80 metrów siatki. Chce ogrodzić prostokątny wybieg, wykorzystując ścianę stodoły jako jeden z boków. Jakie wymiary powinien mieć wybieg, aby miał największą powierzchnię?',
        officialKey: '2x + y = 80 => y = 80 - 2x. P = x*y = x(80 - 2x) = -2x^2 + 80x. Wierzchołek p = -80 / -4 = 20. Bok x = 20m, bok y = 80 - 2*20 = 40m.',
        maxPoints: 3, difficulty: 'Podstawowy', method: 'Zadanie Otwarte', xp: 30, time: '5 min'
      }
    ]
  },
  {
    id: 'math-8',
    name: 'Dział 8: Ciągi (Poziom ULTIMATE)',
    progress: '0%',
    locked: false,
    tasks: [
      {
        id: 'MAT-08-THEORY', type: 'theory', topic: 'Ciągi • Teoria', title: 'Lekcja 1: Arytmetyczny i Geometryczny',
        question: 'Zanim zaczniesz zadania, przypomnij sobie podstawowe wzory i zasady.',
        officialKey: 'Pigułka wiedzy:\\n• Ciąg Arytmetyczny: Środkowy wyraz to zawsze średnia arytmetyczna jego lewego i prawego sąsiada! a2 = (a1 + a3)/2.\\n• Ciąg Geometryczny: Kwadrat środkowego wyrazu to iloczyn sąsiadów! a2^2 = a1 * a3.',
        maxPoints: 0, difficulty: 'Teoria', method: 'Czytanie', xp: 5, time: '2 min'
      },
      {
        id: 'MAT-08-002', type: 'practice', topic: 'Ciągi • Lekcja 8.1', title: 'Własności ciągu arytmetycznego',
        question: 'W pewnym ciągu arytmetycznym suma pierwszego i trzeciego wyrazu jest równa 14, a różnica ciągu to r=3. Wyznacz piąty wyraz tego ciągu.',
        officialKey: 'a1 + a3 = 14 => a1 + (a1+2r) = 14 => 2a1 + 6 = 14 => 2a1 = 8 => a1 = 4. a5 = a1 + 4r = 4 + 4(3) = 16.',
        maxPoints: 2, difficulty: 'Podstawowy', method: 'Active Recall', xp: 20, time: '3 min'
      },
      {
        id: 'MAT-08-005', type: 'practice', topic: 'Ciągi • Lekcja 8.2', title: 'Środkowy wyraz w ciągu geometrycznym',
        question: 'Liczby 2x, 8, 32 tworzą ciąg geometryczny. Wtedy:\\nA) x = 1\\nB) x = 2\\nC) x = 4\\nD) x = 16',
        officialKey: 'A. Kwadrat środkowego to iloczyn sąsiadów: 8^2 = (2x) * 32 => 64 = 64x => x = 1.',
        maxPoints: 2, difficulty: 'Podstawowy', method: 'Active Recall', xp: 20, time: '2 min'
      },
      {
        id: 'MAT-08-010', type: 'practice', topic: 'Ciągi • Sprawdzian', title: 'Wstawianie liczb do ciągu',
        question: 'Pomiędzy liczby 4 oraz 108 wstawiono dwie liczby x i y tak, że ciąg (4, x, y, 108) jest geometryczny i rosnący. Wyznacz x i y.',
        officialKey: 'Skaczemy od a1=4 do a4=108. 4 * q^3 = 108 => q^3 = 27 => q = 3. x = 4*3 = 12, y = 12*3 = 36.',
        maxPoints: 3, difficulty: 'Podstawowy', method: 'Test', xp: 30, time: '4 min'
      }
    ]
  },
  {
    id: 'math-9',
    name: 'Dział 9: Trygonometria (Poziom ULTIMATE)',
    progress: '0%',
    locked: false,
    tasks: [
      {
        id: 'MAT-09-THEORY', type: 'theory', topic: 'Trygonometria • Teoria', title: 'Lekcja 1: Związki w trójkącie',
        question: 'Zanim zaczniesz zadania, przypomnij sobie podstawowe wzory i zasady.',
        officialKey: 'Pigułka wiedzy:\\n• Sinus (sin): Daleko / Najdłuższy.\\n• Cosinus (cos): Blisko / Najdłuższy.\\n• Jedynka trygonometryczna: sin^2(alpha) + cos^2(alpha) = 1.',
        maxPoints: 0, difficulty: 'Teoria', method: 'Czytanie', xp: 5, time: '2 min'
      },
      {
        id: 'MAT-09-001', type: 'practice', topic: 'Trygonometria • Lekcja 9.1', title: 'Cosinus w trójkącie prostokątnym',
        question: 'W trójkącie prostokątnym przeciwprostokątna ma długość 13, a jedna z przyprostokątnych ma długość 5. Cosinus najmniejszego kąta w tym trójkącie jest równy:\\nA) 5/13\\nB) 12/13\\nC) 5/12\\nD) 12/5',
        officialKey: 'B. Pitagoras: x^2 + 25 = 169 => x=12. Najmniejszy kąt leży naprzeciw 5. Cosinus to blisko(12) / najdłuższy(13) = 12/13.',
        maxPoints: 1, difficulty: 'Podstawowy', method: 'Active Recall', xp: 10, time: '2 min'
      },
      {
        id: 'MAT-09-008', type: 'practice', topic: 'Trygonometria • Sprawdzian', title: 'Wzory skróconego mnożenia i trygonometria',
        question: 'Kąt alpha jest ostry i sin(alpha) + cos(alpha) = 7/5. Oblicz wartość wyrażenia sin(alpha) * cos(alpha).',
        officialKey: 'Podnosimy obustronnie do kwadratu: sin^2 + 2sin*cos + cos^2 = 49/25. Używamy jedynki: 1 + 2sin*cos = 49/25 => 2sin*cos = 24/25 => sin*cos = 12/25.',
        maxPoints: 2, difficulty: 'Podstawowy', method: 'Test', xp: 20, time: '3 min'
      }
    ]
  },
  {
    id: 'math-10',
    name: 'Dział 10: Planimetria (Poziom ULTIMATE)',
    progress: '0%',
    locked: false,
    tasks: [
      {
        id: 'MAT-10-THEORY', type: 'theory', topic: 'Planimetria • Teoria', title: 'Lekcja 1: Pola i okręgi',
        question: 'Zanim zaczniesz zadania, przypomnij sobie podstawowe wzory i zasady.',
        officialKey: 'Pigułka wiedzy:\\n• Kąt wpisany jest zawsze DWA RAZY MNIEJSZY niż kąt środkowy.\\n• Trójkąt oparty na średnicy jest ZAWSZE prostokątny.\\n• Wysokość trójkąta równobocznego to h = a*sqrt(3)/2.',
        maxPoints: 0, difficulty: 'Teoria', method: 'Czytanie', xp: 5, time: '2 min'
      },
      {
        id: 'MAT-10-004', type: 'practice', topic: 'Planimetria • Lekcja 10.2', title: 'Promień okręgu opisanego na trójkącie',
        question: 'Pole trójkąta równobocznego jest równe 16*sqrt(3). Promień okręgu opisanego na tym trójkącie jest równy:\\nA) 16*sqrt(3)/3\\nB) 8*sqrt(3)/3\\nC) 8\\nD) 8*sqrt(3)',
        officialKey: 'B. P = a^2*sqrt(3)/4 = 16*sqrt(3) => a^2 = 64 => a=8. Promień to R = 2/3 * h. h = a*sqrt(3)/2 = 4*sqrt(3). R = 2/3 * 4*sqrt(3) = 8*sqrt(3)/3.',
        maxPoints: 2, difficulty: 'Podstawowy', method: 'Active Recall', xp: 20, time: '3 min'
      },
      {
        id: 'MAT-10-009', type: 'practice', topic: 'Planimetria • Sprawdzian', title: 'Obwód trapezu prostokątnego',
        question: 'Pole trapezu prostokątnego jest równe 40, a długości jego podstaw to 6 i 10. Oblicz obwód tego trapezu.',
        officialKey: 'P = (a+b)h/2 => 40 = (6+10)h/2 => 8h = 40 => h = 5. Z prawej mały trójkąt: podstawa 10-6=4, wysokość 5. Z Pitagorasa c^2 = 4^2 + 5^2 = 41 => c = sqrt(41). Obwód: 6 + 10 + 5 + sqrt(41) = 21 + sqrt(41).',
        maxPoints: 2, difficulty: 'Podstawowy', method: 'Test', xp: 20, time: '4 min'
      }
    ]
  },
  {
    id: 'math-11',
    name: 'Dział 11: Geometria Analityczna (Poziom ULTIMATE)',
    progress: '0%',
    locked: false,
    tasks: [
      {
        id: 'MAT-11-THEORY', type: 'theory', topic: 'Geometria Analityczna • Teoria', title: 'Lekcja 1: Środki, odległości i proste',
        question: 'Zanim zaczniesz zadania, przypomnij sobie podstawowe wzory i zasady.',
        officialKey: 'Pigułka wiedzy:\\n• Środek odcinka (S): To średnia arytmetyczna z iksów i średnia z igreków.\\n• Długość odcinka (|AB|): To tak naprawdę Twierdzenie Pitagorasa w przebraniu.',
        maxPoints: 0, difficulty: 'Teoria', method: 'Czytanie', xp: 5, time: '2 min'
      },
      {
        id: 'MAT-11-005', type: 'practice', topic: 'Geometria Analityczna • Lekcja 11.2', title: 'Równanie symetralnej odcinka',
        question: 'Dane są punkty A=(1, -2) i B=(5, 4). Wyznacz równanie symetralnej odcinka AB.',
        officialKey: '1. Środek S = (3, 1). 2. Współczynnik prostej AB: a = (4 - (-2))/(5-1) = 6/4 = 3/2. 3. Symetralna jest prostopadła, więc a_sym = -2/3. 4. Przechodzi przez S(3,1): 1 = -2/3(3) + b => 1 = -2 + b => b = 3. Równanie: y = -2/3x + 3.',
        maxPoints: 3, difficulty: 'Podstawowy', method: 'Active Recall', xp: 30, time: '5 min'
      }
    ]
  },
  {
    id: 'math-12',
    name: 'Dział 12: Stereometria (Poziom ULTIMATE)',
    progress: '0%',
    locked: false,
    tasks: [
      {
        id: 'MAT-12-THEORY', type: 'theory', topic: 'Stereometria • Teoria', title: 'Lekcja 1: Bryły i kąty',
        question: 'Zanim zaczniesz zadania, przypomnij sobie podstawowe wzory i zasady.',
        officialKey: 'Pigułka wiedzy:\\n• Graniastosłup: V = P_p * H.\\n• Ostrosłup: V = 1/3 * P_p * H.\\n• Kąt nachylenia krawędzi bocznej do podstawy: Szukaj trójkąta prostokątnego.',
        maxPoints: 0, difficulty: 'Teoria', method: 'Czytanie', xp: 5, time: '2 min'
      },
      {
        id: 'MAT-12-005', type: 'practice', topic: 'Stereometria • Lekcja 12.2', title: 'Objętość ostrosłupa prawidłowego z kątem',
        question: 'W ostrosłupie prawidłowym czworokątnym krawędź podstawy ma długość 6. Kąt nachylenia krawędzi bocznej do płaszczyzny podstawy ma miarę 60 stopni. Oblicz objętość.',
        officialKey: 'Przekątna kwadratu = 6*sqrt(2). Połowa = 3*sqrt(2). Tangens 60 to sqrt(3). sqrt(3) = H / 3*sqrt(2) => H = 3*sqrt(6). V = 1/3 * P_p * H = 1/3 * 36 * 3*sqrt(6) = 36*sqrt(6).',
        maxPoints: 3, difficulty: 'Podstawowy', method: 'Active Recall', xp: 30, time: '5 min'
      }
    ]
  },
  {
    id: 'math-13',
    name: 'Dział 13: Prawdopodobieństwo i Statystyka (Poziom ULTIMATE)',
    progress: '0%',
    locked: false,
    tasks: [
      {
        id: 'MAT-13-THEORY', type: 'theory', topic: 'Prawdopodobieństwo i Statystyka • Teoria', title: 'Lekcja 1: Reguła mnożenia i średnie',
        question: 'Zanim zaczniesz zadania, przypomnij sobie podstawowe wzory i zasady.',
        officialKey: 'Pigułka wiedzy:\\n• Klasyczne prawdopodobieństwo: P(A) = moc A / moc Omega.\\n• Średnia arytmetyczna: Sumujesz wszystko, dzielisz przez ilość.\\n• Mediana: Wynik ŚRODKOWY po posortowaniu rosnąco.',
        maxPoints: 0, difficulty: 'Teoria', method: 'Czytanie', xp: 5, time: '2 min'
      },
      {
        id: 'MAT-13-009', type: 'practice', topic: 'Prawdopodobieństwo • Sprawdzian', title: 'Wyznaczanie nieznanych w zestawie (mediana)',
        question: 'Dany jest zestaw 5 liczb: 1, 4, a, b, 12. Mediana tego zestawu wynosi 6, a średnia arytmetyczna to 7. Wyznacz a i b, wiedząc, że układ jest już posortowany rosnąco (1 <= 4 <= a <= b <= 12).',
        officialKey: '5 cyfr, mediana pośrodku, czyli a=6. Średnia (1+4+6+b+12)/5 = 7 => (23+b)/5 = 7 => 23+b = 35 => b=12.',
        maxPoints: 2, difficulty: 'Podstawowy', method: 'Test', xp: 20, time: '3 min'
      },
      {
        id: 'MAT-13-010', type: 'practice', topic: 'Prawdopodobieństwo • Sprawdzian', title: 'Prawdopodobieństwo: Losowanie dwóch kul',
        question: 'W urnie znajduje się 6 kul czarnych i 4 kule białe. Losujemy najpierw jedną kulę, a potem (nie zwracając jej) drugą kulę. Oblicz prawdopodobieństwo, że wylosujemy dwie kule tego samego koloru.',
        officialKey: 'Biała i Biała: 4/10 * 3/9 = 12/90. Czarna i Czarna: 6/10 * 5/9 = 30/90. Razem 42/90 = 7/15.',
        maxPoints: 3, difficulty: 'Podstawowy', method: 'Test', xp: 30, time: '4 min'
      }
    ]
  }
];
`;

fs.writeFileSync(path, newTasks);
