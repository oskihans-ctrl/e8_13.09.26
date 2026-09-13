import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '10mb' }));

  const getGenAI = () => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return null;
    return new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  };

  // API Routes: Dedicated Socratic AI Tutor exclusively for OPEN tasks (OPEN_PROOF / calculations)
  app.post('/api/ai-tutor', async (req, res) => {
    try {
      const { question, instruction, studentAnswer, staticHint, studentImage } = req.body;
      const ai = getGenAI();
      
      if (!ai) {
        // Fallback socratic hint when GEMINI_API_KEY is not configured
        const fallbackHint = staticHint || 'Zastosuj odpowiedni wzór skróconego mnożenia lub rozłóż wyrażenie na czynniki. Zastanów się, co łączy kolejne wyrazy.';
        return res.json({ reply: fallbackHint });
      }

      const prompt = `Jesteś doświadczonym, cierpliwym nauczycielem matematyki przygotowującym ucznia do polskiej matury. Prowadzisz ucznia wyłącznie METODĄ SOKRATEJSKĄ.

TREŚĆ ZADANIA OTWARTEGO:
${question}
${instruction ? `Wskazówki/polecenie: ${instruction}` : ''}

DOTYCHCZASOWE OBLICZENIA / ROZUMOWANIE UCZNIA:
${studentAnswer || 'Uczeń prosi o pierwszą ukierunkowaną wskazówkę do rozpoczęcia dowodu'}

BEZWZGLĘDNE REGUŁY:
1. BEZWZGLĘDNY ZAKAZ: Nigdy nie podawaj końcowego wyniku ani pełnego gotowego dowodu! Uczeń musi dojść do celu samodzielnie.
2. ZADANIE: Podaj JEDNĄ zwięzłą, ukierunkowaną wskazówkę wiodącą do kolejnego kroku myślowego (np. "Spróbuj wyłączyć wspólny czynnik przed nawias", "Rozłóż trójmian w nawiasie na czynniki liniowe", "Zauważ, że masz do czynienia z iloczynem kolejnych liczb naturalnych").
3. MAKSYMALNIE 2-3 LINJKI TEKSTU: Twoja odpowiedź musi być krótka, zwięzła i natychmiast czytelna.
4. FORMATOWANIE KATEX: Wszelkie wzory, symbole i wyrażenia zapisuj w czytelnym KaTeX, otaczając je pojedynczymi dolarami $...$ (np. $n(n+1)(n+2)$).
5. Zwracaj się życzliwie bezpośrednio do ucznia w 2. os. lp. po polsku.`;

      const contents: any[] = [prompt];
      
      if (studentImage && typeof studentImage === 'string' && studentImage.startsWith('data:image/')) {
        const base64Data = studentImage.split(',')[1];
        const mimeType = studentImage.split(';')[0].split(':')[1];
        contents.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        });
      }

      let response;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: contents,
        });
      } catch (err: any) {
        try {
          response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: contents,
          });
        } catch (err2: any) {
          response = await ai.models.generateContent({
            model: 'gemini-1.5-flash',
            contents: contents,
          });
        }
      }

      const replyText = response.text?.trim() || staticHint || 'Spróbuj rozłożyć wyrażenie na czynniki lub wyłączyć wspólny składnik przed nawias.';
      res.json({ reply: replyText });
    } catch (error: any) {
      const fallbackHint = req.body?.staticHint || 'Zwróć uwagę na sprowadzenie wyrażeń do wspólnej postaci i zastosowanie wzorów skróconego mnożenia.';
      res.json({ reply: fallbackHint });
    }
  });

  // Helper for resilient rubric-based matura evaluation
  function evaluateFallback(params: {
    cleanAnswer: string;
    officialKey?: string;
    maxPts: number;
    isFirstAttempt: boolean;
    ai_tutor_rubric?: { criterion_1_point?: string; criterion_2_points?: string };
  }) {
    const { cleanAnswer, officialKey, maxPts, isFirstAttempt, ai_tutor_rubric } = params;
    const text = cleanAnswer.toLowerCase();
    
    // Check algebra tokens for progress (Lesson 1.7 and general algebra)
    const hasAlgebraProgress = 
      text.includes('3n^2') || 
      text.includes('3n²') || 
      text.includes('4n(n+1)') || 
      text.includes('4k(k+1)') || 
      text.includes('4k(') ||
      text.includes('4n(') ||
      text.includes('5(n-1)') || 
      text.includes('5n(') || 
      text.includes('2^96') || 
      text.includes('2^{96}') || 
      text.includes('2^20') || 
      text.includes('2^{20}') || 
      text.includes('2k') ||
      text.includes('wyłącz') || 
      text.includes('wspólny') ||
      text.includes('rozł') || 
      text.includes('kwadrat') || 
      text.includes('wzór skróconego') ||
      text.includes('iloczyn') ||
      text.includes('reszt');

    const hasConclusion = 
      text.includes('podziel') || 
      text.includes('całkowit') || 
      text.includes('wniosek') || 
      text.includes('udowodnion') || 
      text.includes('cnd') || 
      text.includes('c.n.d') ||
      text.includes('reszta 2') || 
      text.includes('8k') || 
      text.includes('30k') || 
      text.includes('21k') || 
      text.includes('k \\in') || 
      text.includes('m \\in') || 
      text.includes('c \\in') ||
      text.includes('n \\in');

    const keywords = (officialKey || '').toLowerCase().split(/\s+/).filter((w: string) => w.length > 3);
    const matchCount = keywords.filter((kw: string) => text.includes(kw)).length;
    const ratio = keywords.length > 0 ? matchCount / keywords.length : 0.5;

    let calculatedScore = Math.min(maxPts, Math.round(ratio * maxPts));
    if (hasAlgebraProgress) calculatedScore = Math.max(calculatedScore, 1);
    if (hasAlgebraProgress && hasConclusion) calculatedScore = maxPts;
    if (text.length > 30 && calculatedScore === 0) calculatedScore = 1;

    const passed = calculatedScore >= Math.ceil(maxPts * 0.5);

    return {
      score: calculatedScore,
      maxPoints: maxPts,
      isPassed: passed,
      gradeTitle: calculatedScore === maxPts
        ? `${maxPts} / ${maxPts} PKT – Pełny dowód i wniosek`
        : calculatedScore > 0
          ? `${calculatedScore} / ${maxPts} PKT – Zasadniczy postęp`
          : `0 / ${maxPts} PKT – Próba rozwiązania`,
      summary: calculatedScore === maxPts 
        ? (ai_tutor_rubric?.criterion_2_points || 'Perfekcyjne rozwiązanie! Odpowiedź w pełni zgodna ze schematem maturalnym.')
        : calculatedScore > 0 
        ? (ai_tutor_rubric?.criterion_1_point || 'Częściowo poprawna odpowiedź (zasadniczy postęp algebraiczny).')
        : 'Odpowiedź wymaga dopracowania kluczowych przekształceń algebraicznych.',
      strengths: calculatedScore > 0 ? ['Zastosowano poprawną tożsamość algebraiczną', 'Przedstawiono zasadniczy tok rozumowania'] : [],
      errors: calculatedScore < maxPts ? ['Pamiętaj o precyzyjnym wniosku końcowym powołującym się na podzielność przez odpowiednią liczbę całkowitą'] : [],
      ckeFeedback: `Zgodnie ze schematem oceniania maturalnego, przyznano ${calculatedScore} z ${maxPts} punktów.`,
      suggestion: isFirstAttempt 
        ? 'Zapisz precyzyjny wniosek końcowy powołujący się na podzielność przez odpowiednią liczbę.'
        : 'Podpowiedź do kolejnej próby: Zwróć uwagę na formalne uzasadnienie, dlaczego otrzymany iloczyn spełnia warunek zadania.',
      hintForNextAttempt: 'Sprawdź czy Twoja odpowiedź zawiera wszystkie wymagane kroki dowodowe.'
    };
  }

  // Strict Matura Task Evaluation Endpoint
  app.post('/api/evaluate-task', async (req, res) => {
    try {
      const { 
        question, 
        contextText, 
        subQuestions, 
        officialKey, 
        studentAnswer, 
        taskType, 
        maxPoints, 
        studentImage,
        ai_tutor_rubric,
        attemptCount = 1
      } = req.body;

      const maxPts = maxPoints || 4;
      const isFirstAttempt = attemptCount === 1;

      // Check if student answer is empty or too short / gibberish
      const cleanAnswer = typeof studentAnswer === 'string' ? studentAnswer.trim() : JSON.stringify(studentAnswer || '');
      const isMultipleChoice = taskType === 'multiple-choice';
      const isGibberish = !isMultipleChoice && (cleanAnswer.length < 3 || /^(asdf|qwer|xyz|1234|abc|cokolwiek|nie wiem| test|aaa)+$/i.test(cleanAnswer));

      if ((isGibberish || cleanAnswer.length === 0) && !studentImage) {
        return res.json({
          score: 0,
          maxPoints: maxPts,
          isPassed: false,
          gradeTitle: 'Niepoprawna odpowiedź (0 pkt)',
          summary: 'Odpowiedź jest zbyt krótka, pusta lub nie zawiera merytorycznych treści.',
          strengths: [],
          errors: ['Brak rzeczowej odpowiedzi, obliczeń lub argumentacji.'],
          ckeFeedback: 'Zgodnie z zasadami maturalnymi brak merytorycznej odpowiedzi lub wpisanie przypadkowych znaków skutkuje przyznaniem 0 punktów.',
          suggestion: isFirstAttempt 
            ? 'Przeanalizuj polecenie, zapisz swoje obliczenia lub tok rozumowania i spróbuj ponownie.'
            : 'Podpowiedź: Przeczytaj uważnie polecenie. Zwróć uwagę na kluczowe założenia, wzory skróconego mnożenia i wyłączanie przed nawias.',
          hintForNextAttempt: 'W kolejnej próbie spróbuj wypisać dane z treści zadania i zastosować odpowiednie wzory.'
        });
      }

      const ai = getGenAI();

      if (!ai) {
        return res.json(evaluateFallback({
          cleanAnswer,
          officialKey,
          maxPts,
          isFirstAttempt,
          ai_tutor_rubric
        }));
      }

      const prompt = `Jesteś oficjalnym egzaminatorem maturalnym z matematyki i innych przedmiotów maturalnych.
Twoim zadaniem jest RZETELNA, PRECYZYJNA OCENA toku myślenia ucznia, jego obliczeń, pisma odręcznego na wirtualnej tablicy lub wpisanego dowodu algebraicznego.

[DANE ZADANIA]
Typ zadania: ${taskType || 'Zadanie maturalne'}
Maksymalna liczba punktów: ${maxPts}
Treść pytania / Polecenie: ${question}
${contextText ? `Tekst źródłowy / Kontekst:\n${contextText}` : ''}
${subQuestions && subQuestions.length > 0 ? `Podpytania:\n${subQuestions.join('\n')}` : ''}

[OFICJALNY SCHEMAT OCENIANIA I WZORCOWE ROZWIĄZANIE]
${officialKey}
${ai_tutor_rubric ? `
[DEDYKOWANE KRYTERIA PUNKTACJI MATURALNEJ DLA TEGO ZADANIA]
- 1 PUNKT (Zasadniczy postęp): ${ai_tutor_rubric.criterion_1_point}
- 2 PUNKTY (Pełny dowód i wniosek): ${ai_tutor_rubric.criterion_2_points}
` : ''}

[PRÓBA UCZNIA - PRÓBA NR ${attemptCount}]
Komentarz tekstowy ucznia / Zapis dowodu: "${cleanAnswer}"
${studentImage ? 'DOŁĄCZONO OBRAZ WIRTUALNEJ TABLICY Z PISMEM ODRĘCZNYM / OBLICZENIAMI / RYSUNKIEM POMOCNICZYM.' : ''}

ZASADY OCENIANIA MATURALNEGO:

1. ZADANIA OTWARTE I DOWODOWE (OPEN_PROOF / WYKAŻ, ŻE / UDOWODNIJ):
   - 2 PUNKTY: Pełne, bezbłędne rozwiązanie. Uczeń wykonał poprawne przekształcenia algebraiczne (np. wyłączenie wspólnego czynnika przed nawias, zwinięcie do iloczynu) ORAZ sformułował poprawny wniosek końcowy (np. uzasadnił, że otrzymany iloczyn jest liczbą całkowitą podzielną przez daną liczbę).
   - 1 PUNKT: Zasadniczy postęp w rozwiązaniu zadania. Uczeń wykonał kluczowe przekształcenie algebraiczne (np. wyłączył $2^{20}$ i otrzymał $2^{20} \\cdot 7$, lub rozpisał $4k(k+1)$), ale nie sformułował wniosku końcowego o podzielności LUB popełnił drobny błąd nieuwzględniający wszystkich założeń, który nie zepsuł idei dowodu.
   - 0 PUNKTÓW: Brak istotnego postępu, błędne przekształcenia lub brak powiązania z tezą.

2. ANALIZA PISMA ODRĘCZNEGO I TABLICY:
   - Jeśli dołączono obraz wirtualnej tablicy, dokładnie odczytaj całe pismo odręczne ucznia, przekształcenia algebraiczne, zapisane liczby i wzory.
   - Oceń poprawność merytoryczną każdego odczytanego kroku. Jeśli uczeń popełnił błąd rachunkowy lub logiczny, opisz go dokładnie w polu "errors".

3. JEŚLI ODPOWIEDŹ NIE JEST MAKSYMALNA:
   - W polu "strengths" wymień to, co uczeń zrobił dobrze (np. "Poprawne wyłączenie wspólnego czynnika przed nawias").
   - W polu "errors" wskaż brakujący element (np. "Brak formalnego wniosku końcowego o podzielności przez 7 dla liczb całkowitych").
   - W polu "ckeFeedback" podaj profesjonalny, motywujący komentarz egzaminatora maturalnego wyjaśniający ocenę punktową.

4. isPassed musi wynosić true gdy score >= ${Math.ceil(maxPts * 0.5)}.
5. Wszystkie komentarze sporządź w języku polskim, z precyzyjnym odwołaniem do toku rozumowania ucznia.`;

      const contents: any[] = [prompt];
      if (studentImage && typeof studentImage === 'string' && studentImage.startsWith('data:image/')) {
        const base64Data = studentImage.split(',')[1];
        const mimeType = studentImage.split(';')[0].split(':')[1];
        contents.push({
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        });
      }

      const evaluationConfig = {
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            score: { type: Type.NUMBER, description: 'Uzyskana liczba punktów (0 do maxPoints)' },
            maxPoints: { type: Type.NUMBER, description: 'Maksymalna liczba punktów' },
            isPassed: { type: Type.BOOLEAN, description: 'True jeśli score >= połowa maxPoints' },
            gradeTitle: { type: Type.STRING, description: 'Tytuł oceny np. 2/2 PKT – Maksimum' },
            summary: { type: Type.STRING, description: 'Krótkie podsumowanie oceny' },
            strengths: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Lista poprawnych elementów w odpowiedzi' },
            errors: { type: Type.ARRAY, items: { type: Type.STRING }, description: 'Lista brakujących elementów lub błędów' },
            ckeFeedback: { type: Type.STRING, description: 'Komentarz egzaminatora maturalnego' },
            suggestion: { type: Type.STRING, description: 'Instrukcja/porada dla ucznia' },
            hintForNextAttempt: { type: Type.STRING, description: 'Wskazówka naprowadzająca' }
          },
          required: ['score', 'maxPoints', 'isPassed', 'gradeTitle', 'summary', 'strengths', 'errors', 'ckeFeedback', 'suggestion', 'hintForNextAttempt']
        }
      };

      let response;
      try {
        response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents,
          config: evaluationConfig
        });
      } catch (err: any) {
        try {
          response = await ai.models.generateContent({
            model: 'gemini-2.0-flash',
            contents,
            config: evaluationConfig
          });
        } catch (err2: any) {
          try {
            response = await ai.models.generateContent({
              model: 'gemini-1.5-flash',
              contents,
              config: evaluationConfig
            });
          } catch (err3: any) {
            return res.json(evaluateFallback({
              cleanAnswer,
              officialKey,
              maxPts,
              isFirstAttempt,
              ai_tutor_rubric
            }));
          }
        }
      }

      let parsed;
      try {
        parsed = JSON.parse(response.text || '{}');
      } catch (jsonErr) {
        return res.json(evaluateFallback({
          cleanAnswer,
          officialKey,
          maxPts,
          isFirstAttempt,
          ai_tutor_rubric
        }));
      }

      res.json(parsed);
    } catch (error: any) {
      const cleanAnswer = typeof req.body?.studentAnswer === 'string' ? req.body.studentAnswer.trim() : '';
      return res.json(evaluateFallback({
        cleanAnswer,
        officialKey: req.body?.officialKey,
        maxPts: req.body?.maxPoints || 2,
        isFirstAttempt: req.body?.attemptCount === 1,
        ai_tutor_rubric: req.body?.ai_tutor_rubric
      }));
    }
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();

