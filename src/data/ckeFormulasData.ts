export interface CkeFormulaItem {
  id: string;
  topicId: string;
  topicName: string;
  title: string;
  formula: string;
  explanation?: string;
  goldenRule?: string;
  ckeTrap?: string;
  keywords: string[];
}

export const CKE_FORMULA_TOPICS = [
  { id: 'all', name: 'Wszystkie działy' },
  { id: 'liczby-dzialania', name: 'Liczby i Działania' },
  { id: 'potegi-pierwiastki', name: 'Potęgi i Pierwiastki' },
  { id: 'procenty-predkosc', name: 'Procenty i Prędkość' },
  { id: 'algebra-rownania', name: 'Algebra i Równania' },
  { id: 'planimetria', name: 'Geometria Płaska' },
  { id: 'stereometria', name: 'Bryły (Stereometria)' },
  { id: 'statystyka-prawdopodobienstwo', name: 'Statystyka i Szansa' }
];

export const CKE_FORMULAS_DATA: CkeFormulaItem[] = [
  // 1. Liczby i Działania
  {
    id: 'f-liczby-1',
    topicId: 'liczby-dzialania',
    topicName: 'Liczby i Działania',
    title: 'Cechy podzielności liczb naturalnych',
    formula: 'Przez 2: ostatnia cyfra to 0, 2, 4, 6, 8\nPrzez 3: suma cyfr podzielna przez 3\nPrzez 4: 2 ostatnie cyfry tworzą liczbę podzielną przez 4\nPrzez 5: ostatnia cyfra to 0 lub 5\nPrzez 9: suma cyfr podzielna przez 9\nPrzez 10: ostatnia cyfra to 0',
    explanation: 'Podstawowe reguły pozwalające natychmiast stwierdzić podzielność liczby bez wykonywania długiego dzielenia.',
    goldenRule: 'Liczba jest podzielna przez 6, gdy jest jednocześnie podzielna przez 2 i przez 3 (parzysta o sumie cyfr podzielnej przez 3).',
    ckeTrap: 'Nie myl cechy podzielności przez 3 (suma cyfr) z cechą podzielności przez 2 lub 5 (tylko ostatnia cyfra)!',
    keywords: ['podzielność', 'cechy podzielności', 'suma cyfr', 'reszta z dzielenia']
  },
  {
    id: 'f-liczby-2',
    topicId: 'liczby-dzialania',
    topicName: 'Liczby i Działania',
    title: 'Kolejność wykonywania działań',
    formula: '1. Działania w nawiasach\n2. Potęgowanie i pierwiastkowanie\n3. Mnożenie i dzielenie (od lewej do prawej)\n4. Dodawanie i odejmowanie (od lewej do prawej)',
    explanation: 'Prawidłowa hierarchia operacji arytmetycznych zapobiega typowym pomyłkom na egzaminie.',
    goldenRule: 'Gdy masz dzielenie i mnożenie po sobie (np. 12 : 3 · 2), wykonuj je od lewej do prawej: 12 : 3 = 4, a 4 · 2 = 8!',
    ckeTrap: 'Działanie 10 - 2 · 3 to 10 - 6 = 4, a NIE (10 - 2) · 3 = 24!',
    keywords: ['kolejność działań', 'nawiasy', 'mnożenie', 'dzielenie']
  },
  {
    id: 'f-liczby-3',
    topicId: 'liczby-dzialania',
    topicName: 'Liczby i Działania',
    title: 'Działania na ułamkach zwykłych i dziesiętnych',
    formula: 'Dodawanie/Odejmowanie: a/c ± b/c = (a ± b)/c (wspólny mianownik!)\nMnożenie: a/b · c/d = (a · c)/(b · d)\nDzielenie: a/b : c/d = a/b · d/c (mnożenie przez odwrotność!)',
    explanation: 'Dzielenie przez ułamek to mnożenie przez jego odwrotność. Przy dodawaniu zawsze sprowadzaj do wspólnego mianownika.',
    goldenRule: 'Zanim pomnożysz ułamki, ZAWSZE skracaj licznik z mianownikiem na krzyż!',
    ckeTrap: 'Przy dodawaniu ułamków NIE dodawaj mianowników: 1/3 + 1/3 to 2/3, a NIE 2/6!',
    keywords: ['ułamki', 'wspólny mianownik', 'odwrotność', 'skracanie']
  },

  // 2. Potęgi i Pierwiastki
  {
    id: 'f-potegi-1',
    topicId: 'potegi-pierwiastki',
    topicName: 'Potęgi i Pierwiastki',
    title: 'Mnożenie i dzielenie potęg o tej samej podstawie',
    formula: 'a^m · a^n = a^{m+n}\na^m : a^n = a^{m-n}',
    explanation: 'Gdy podstawy potęg są równe, przy mnożeniu dodajemy wykładniki, a przy dzieleniu odejmujemy.',
    goldenRule: 'Zawsze szukaj wspólnej podstawy: np. 4³ = (2²)³ = 2⁶.',
    ckeTrap: '2³ · 2⁴ to 2⁷, a NIGDY 4⁷! Podstawa potęgi pozostaje bez zmian.',
    keywords: ['potęgi', 'mnożenie potęg', 'dzielenie potęg', 'wykładnik']
  },
  {
    id: 'f-potegi-2',
    topicId: 'potegi-pierwiastki',
    topicName: 'Potęgi i Pierwiastki',
    title: 'Potęga potęgi oraz potęga iloczynu i ilorazu',
    formula: '(a^m)^n = a^{m · n}\n(a · b)^n = a^n · b^n\n(a : b)^n = a^n : b^n',
    explanation: 'Przy potęgowaniu potęgi mnożymy wykładniki. Iloczyn podnosimy do potęgi, potęgując każdy czynnik z osobna.',
    goldenRule: 'Pamiętaj: a⁰ = 1 dla dowolnej liczby a ≠ 0 oraz a¹ = a.',
    ckeTrap: 'Kwadrat sumy (a + b)² to NIE a² + b²! Na przykład (2 + 3)² = 5² = 25, a 2² + 3² = 4 + 9 = 13.',
    keywords: ['potęga potęgi', 'iloczyn potęg', 'nawiasy']
  },
  {
    id: 'f-pierwiastki-1',
    topicId: 'potegi-pierwiastki',
    topicName: 'Potęgi i Pierwiastki',
    title: 'Działania na pierwiastkach kwadratowych i sześciennych',
    formula: '√(a · b) = √a · √b\n√(a : b) = √a : √b\n∛(a · b) = ∛a · ∛b\n(√a)² = a   (dla a ≥ 0)',
    explanation: 'Pierwiastek z iloczynu jest równy iloczynowi pierwiastków.',
    goldenRule: 'Wyłączanie czynnika przed znak pierwiastka: rozłóż liczbę na iloczyn z kwadratem (np. √50 = √(25 · 2) = 5√2).',
    ckeTrap: '√(16 + 9) = √25 = 5, a NIE √16 + √9 = 4 + 3 = 7! Pod pierwiastkiem nie wolno rozdzielać dodawania.',
    keywords: ['pierwiastek', 'wyłączanie czynnika', 'pierwiastek sześcienny']
  },
  {
    id: 'f-pierwiastki-2',
    topicId: 'potegi-pierwiastki',
    topicName: 'Potęgi i Pierwiastki',
    title: 'Szacowanie wartości pierwiastków',
    formula: '√1 = 1, √4 = 2, √9 = 3, √16 = 4, √25 = 5, √36 = 6, √49 = 7, √64 = 8, √81 = 9, √100 = 10',
    explanation: 'Aby oszacować pierwiastek niewymierny (np. √10), znajdź najbliższe pełne kwadraty: √9 < √10 < √16, czyli 3 < √10 < 4.',
    goldenRule: 'Zadania Prawda/Fałsz z E8 często pytają: „Liczba √30 leży między 5 a 6 na osi”. Tak, bo 5² = 25 < 30 < 36 = 6².',
    ckeTrap: 'Pamiętaj: √2 ≈ 1,41 oraz √3 ≈ 1,73.',
    keywords: ['szacowanie', 'oś liczbowa', 'kwadraty liczb']
  },

  // 3. Procenty i Prędkość
  {
    id: 'f-procenty-1',
    topicId: 'procenty-predkosc',
    topicName: 'Procenty i Prędkość',
    title: 'Obliczenia procentowe i jakim procentem jest liczba',
    formula: 'p% liczby a = (p / 100) · a\nJakim procentem liczby b jest liczba a: (a / b) · 100%',
    explanation: '1% to jedna setna część (0,01). Aby policzyć procent z liczby, zamień procent na ułamek i pomnóż.',
    goldenRule: 'Szybkie liczenie: 10% to przesunięcie przecinka o 1 miejsce w lewo. 5% to połowa z 10%.',
    ckeTrap: 'Zawsze patrz, od jakiej kwoty liczysz procent! Mianownik ułamka to ZAWSZE baza wyjściowa („od czego”).',
    keywords: ['procent', 'ułamek', 'obliczenia procentowe', 'promil']
  },
  {
    id: 'f-procenty-2',
    topicId: 'procenty-predkosc',
    topicName: 'Procenty i Prędkość',
    title: 'Podwyżki i obniżki cen',
    formula: 'Podwyżka o p%: Nowa cena = Cena początkowa · (1 + p/100)\nObniżka o p%: Nowa cena = Cena początkowa · (1 - p/100)',
    explanation: 'Np. podwyżka o 20% to mnożenie przez 1,20. Obniżka o 15% to mnożenie przez 0,85.',
    goldenRule: 'Cena po dwóch kolejnych obniżkach o 20%: 100 zł -> 80 zł -> 64 zł (obniżka o 36%, a NIE o 40%!).',
    ckeTrap: 'Podwyżka o 20%, a potem obniżka o 20% NIE daje tej samej ceny! 100 zł + 20% = 120 zł; 120 zł - 20% = 96 zł.',
    keywords: ['podwyżka', 'obniżka', 'cena', 'kolejne zmiany cen']
  },
  {
    id: 'f-predkosc-1',
    topicId: 'procenty-predkosc',
    topicName: 'Procenty i Prędkość',
    title: 'Prędkość, droga i czas (Trójkąt s-v-t)',
    formula: 'v = s / t   (prędkość = droga : czas)\ns = v · t   (droga = prędkość · czas)\nt = s / v   (czas = droga : prędkość)',
    explanation: 'Podstawowy wzór fizyczno-matematyczny pojawiający się na każdym egzaminie ósmoklasisty.',
    goldenRule: 'Zgodność jednostek: jeśli prędkość jest w km/h, czas MUSI być w godzinach (np. 15 min = 1/4 h = 0,25 h, a 40 min = 2/3 h)!',
    ckeTrap: 'Nigdy nie wstawiaj 15 minut jako 0,15 godziny! 15 minut to 15/60 = 0,25 h.',
    keywords: ['prędkość', 'droga', 'czas', 'zamiana jednostek']
  },
  {
    id: 'f-skala-1',
    topicId: 'procenty-predkosc',
    topicName: 'Procenty i Prędkość',
    title: 'Skala na planie i mapie oraz jednostki',
    formula: 'Skala 1 : 50 000 oznacza, że 1 cm na mapie = 50 000 cm w terenie = 500 m = 0,5 km\n1 m = 100 cm, 1 km = 1000 m = 100 000 cm\n1 a (ar) = 100 m², 1 ha (hektar) = 10 000 m² = 100 a',
    explanation: 'Skala liczbowa informuje, ile razy wymiary rzeczywiste zostały pomniejszone.',
    goldenRule: 'Odrzucanie zer: 50 000 cm -> utnij 2 zera, masz 500 m -> utnij kolejne 3 zera, masz 0,5 km.',
    ckeTrap: 'Pamiętaj: 1 m² = 10 000 cm² (100 cm · 100 cm), a NIE 100 cm²!',
    keywords: ['skala', 'mapa', 'ar', 'hektar', 'jednostki']
  },

  // 4. Algebra i Równania
  {
    id: 'f-algebra-1',
    topicId: 'algebra-rownania',
    topicName: 'Algebra i Równania',
    title: 'Redukcja wyrazów podobnych i mnożenie sum',
    formula: 'a · (b + c) = a · b + a · c\n(a + b) · (c + d) = a · c + a · d + b · c + b · d\n-(a - b) = -a + b (minus przed nawiasem zmienia znaki!)',
    explanation: 'Wyrazy podobne to te, które mają takie same litery w tych samych potęgach (np. 3x i -5x).',
    goldenRule: 'Gdy przed nawiasem stoi minus, ZMIEŃ ZNAK każdego składnika wewnątrz nawiasu!',
    ckeTrap: '2 - (x - 3) = 2 - x + 3 = 5 - x, a NIE 2 - x - 3!',
    keywords: ['algebra', 'nawiasy', 'wyrazy podobne', 'redukcja']
  },
  {
    id: 'f-algebra-2',
    topicId: 'algebra-rownania',
    topicName: 'Algebra i Równania',
    title: 'Rozwiązywanie równań z jedną niewiadomą',
    formula: '1. Opuść nawiasy (wymnóż)\n2. Przenieś niewiadome na lewą stronę, liczby na prawą (zmieniając znak!)\n3. Zredukuj wyrazy podobne\n4. Podziel obie strony przez liczbę stojącą przy x',
    explanation: 'Równość zachowuje się, gdy do obu stron dodamy lub odejmiemy tę samą liczbę albo podzielimy przez tę samą liczbę różną od zera.',
    goldenRule: 'Przenosisz przez znak równości (=)? ZAWSZE ZMIEŃ ZNAK na przeciwny!',
    ckeTrap: 'Jeśli masz ułamki w równaniu, pomnóż całe równanie przez wspólny mianownik, aby się ich pozbyć.',
    keywords: ['równanie', 'niewiadoma', 'przenoszenie na stronę']
  },

  // 5. Geometria Płaska (Planimetria)
  {
    id: 'f-pitagoras-1',
    topicId: 'planimetria',
    topicName: 'Geometria Płaska',
    title: 'Twierdzenie Pitagorasa',
    formula: 'a² + b² = c²   (w trójkącie prostokątnym)\na, b – przyprostokątne, c – przeciwprostokątna (najdłuższy bok)',
    explanation: 'Suma kwadratów długości przyprostokątnych jest równa kwadratowi długości przeciwprostokątnej.',
    goldenRule: 'Popularne trójki pitagorejskie: 3, 4, 5 oraz 5, 12, 13 oraz 6, 8, 10.',
    ckeTrap: 'Twierdzenie Pitagorasa działa TYLKO i WYŁĄCZNIE w trójkątach prostokątnych!',
    keywords: ['Pitagoras', 'trójkąt prostokątny', 'przeciwprostokątna', 'przyprostokątne']
  },
  {
    id: 'f-trojkaty-spec-1',
    topicId: 'planimetria',
    topicName: 'Geometria Płaska',
    title: 'Trójkąty szczególne: 30°-60°-90° oraz 45°-45°-90°',
    formula: 'Dla 45°-45°-90° (połowa kwadratu): przyprostokątne a, przeciwprostokątna a√2 (przekątna d = a√2)\nDla 30°-60°-90° (połowa równobocznego): przyprostokątna naprzeciw 30° to a, przeciwprostokątna to 2a, przyprostokątna naprzeciw 60° to a√3',
    explanation: 'Zależności między bokami pozwalają natychmiast wyznaczyć boki bez używania twierdzenia Pitagorasa.',
    goldenRule: 'W trójkącie 30°-60°-90° najkrótszy bok leży ZAWSZE naprzeciwko najmniejszego kąta (30°) i jest równy połowie przeciwprostokątnej.',
    ckeTrap: 'Bok a√3 leży naprzeciw kąta 60°, a bok a naprzeciw 30° – nie zamień ich miejscami!',
    keywords: ['trójkąty szczególne', '30 60 90', '45 45 90', 'przekątna kwadratu']
  },
  {
    id: 'f-pola-figur-1',
    topicId: 'planimetria',
    topicName: 'Geometria Płaska',
    title: 'Wzory na pola figur płaskich (musisz znać na pamięć!)',
    formula: 'Trójkąt: P = (a · h) / 2\nTrójkąt równoboczny: P = (a²√3) / 4,   h = (a√3) / 2\nProstokąt: P = a · b\nKwadrat: P = a² = d² / 2\nRównoległobok: P = a · h_a\nRomb: P = a · h = (e · f) / 2   (e, f to przekątne)\nTrapez: P = ((a + b) · h) / 2   (a, b to podstawy)',
    explanation: 'Zestaw najważniejszych wzorów na pola wielokątów w szkole podstawowej.',
    goldenRule: 'Wysokość h MUSI ZAWSZE opadać na dany bok a pod kątem prostym (90°)!',
    ckeTrap: 'W trapezie nie pomyl ramion z podstawami! Dodajemy TYLKO podstawy równoległe a i b.',
    keywords: ['pole trójkąta', 'pole trapezu', 'pole rombu', 'równoległobok']
  },
  {
    id: 'f-katy-w-figurach',
    topicId: 'planimetria',
    topicName: 'Geometria Płaska',
    title: 'Kąty w trójkątach i czworokątach',
    formula: 'Suma kątów w każdym trójkącie = 180°\nSuma kątów w każdym czworokącie = 360°\nKąty przyległe: suma = 180°\nKąty wierzchołkowe: są równe\nKąty przy jednym ramieniu trapezu: suma = 180°',
    explanation: 'Związki miarowe kątów pozwalają obliczyć brakujące kąty w figurach geometrycznych.',
    goldenRule: 'W trójkącie równoramiennym kąty przy podstawie są DOKŁADNIE TAKIE SAME.',
    ckeTrap: 'Suma kątów w czworokącie to 360°, a nie 180°.',
    keywords: ['kąty', 'suma kątów', 'kąty przyległe', 'kąty wierzchołkowe']
  },

  // 6. Bryły (Stereometria)
  {
    id: 'f-bryly-prostopadloscian',
    topicId: 'stereometria',
    topicName: 'Bryły (Stereometria)',
    title: 'Sześcian i Prostopadłościan',
    formula: 'Prostopadłościan (krawędzie a, b, c):\nV = a · b · c\nP_c = 2ab + 2bc + 2ac\n\nSześcian (krawędź a):\nV = a³\nP_c = 6a²\nLiczba wierzchołków: 8, krawędzi: 12, ścian: 6',
    explanation: 'Objętość to iloczyn trzech wymiarów. Pole powierzchni całkowitej to suma pól wszystkich 6 prostokątnych ścian.',
    goldenRule: 'Przeliczanie objętości: 1 litr = 1 dm³ = 1000 cm³ = 1000 ml.',
    ckeTrap: 'Pamiętaj: prostopadłościan ma 12 krawędzi: 4 o długości a, 4 o długości b i 4 o długości c! Suma krawędzi = 4(a + b + c).',
    keywords: ['sześcian', 'prostopadłościan', 'objętość', 'pole powierzchni', 'litr']
  },
  {
    id: 'f-bryly-graniastoslup',
    topicId: 'stereometria',
    topicName: 'Bryły (Stereometria)',
    title: 'Graniastosłup prosty i Ostrosłup',
    formula: 'Graniastosłup prosty:\nV = P_p · H   (Pole podstawy · wysokość)\nP_c = 2 · P_p + P_b\n\nOstrosłup:\nV = (1/3) · P_p · H   (Jedna trzecia pola podstawy · wysokość)\nP_c = P_p + P_b',
    explanation: 'Graniastosłup ma dwie identyczne podstawy. Ostrosłup ma jedną podstawę, a ściany boczne są trójkątami zbiegającymi się w jednym wierzchołku.',
    goldenRule: 'Objętość ostrosłupa jest 3 razy mniejsza niż graniastosłupa o tej samej podstawie i wysokości (nie zapomnij o 1/3!).',
    ckeTrap: 'Graniastosłup ma 2 podstawy (2 · P_p), a ostrosłup ma tylko 1 podstawę (1 · P_p)!',
    keywords: ['graniastosłup', 'ostrosłup', 'pole podstawy', 'wysokość bryły']
  },

  // 7. Statystyka i Prawdopodobieństwo
  {
    id: 'f-stat-srednia',
    topicId: 'statystyka-prawdopodobienstwo',
    topicName: 'Statystyka i Szansa',
    title: 'Średnia arytmetyczna',
    formula: 'Średnia = (x_1 + x_2 + ... + x_n) / n   (suma wszystkich liczb podzielona przez ich liczbę)',
    explanation: 'Pozwala wyznaczyć przeciętną wartość zbioru danych liczbowych (np. średnią ocen lub temperatur).',
    goldenRule: 'Jeśli znasz średnią n liczb, to ich suma wynosi n · średnia! Np. średnia 4 ocen to 4,5, więc suma ocen = 4 · 4,5 = 18.',
    ckeTrap: 'Pamiętaj o nawiasie przy wpisywaniu w kalkulator lub obliczaniu: najpierw dodaj wszystkie liczby, dopiero potem dziel!',
    keywords: ['średnia', 'średnia arytmetyczna', 'statystyka', 'oceny']
  },
  {
    id: 'f-stat-prawd',
    topicId: 'statystyka-prawdopodobienstwo',
    topicName: 'Statystyka i Szansa',
    title: 'Prawdopodobieństwo zdarzenia losowego',
    formula: 'P(A) = liczba zdarzeń sprzyjających / liczba wszystkich możliwych zdarzeń = m / n\n0 ≤ P(A) ≤ 1',
    explanation: 'Ułamek określający szansę zajścia zdarzenia. Np. rzut monetą: szansa na orła to 1/2. Rzut kostką: szansa na liczbę parzystą to 3/6 = 1/2.',
    goldenRule: 'Prawdopodobieństwo ZAWSZE mieści się w przedziale od 0 (zdarzenie niemożliwe) do 1 (zdarzenie pewne).',
    ckeTrap: 'Prawdopodobieństwo NIGDY nie może być ujemne ani większe od 1 (lub 100%)!',
    keywords: ['prawdopodobieństwo', 'szansa', 'losowanie', 'kostka', 'moneta']
  }
];
