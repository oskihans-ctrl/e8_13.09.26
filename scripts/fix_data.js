import fs from 'fs';

const path = 'src/components/LearnView.tsx';
let content = fs.readFileSync(path, 'utf8');

// Remove the injected math override in the global `data` object
const injectedMathStr = `  math: {
      ...data.math,
      topics: data.math.topics.map((t, i) => ({
        ...t,
        locked: i > 0,
        isPro: i > 0
      }))
    },
    pol: {`;

content = content.replace(injectedMathStr, '  pol: {');

// Inject it into displayData
const targetPolStr = `    pol: {
      ...data.pol,`;

const mathOverride = `    math: {
      ...data.math,
      topics: data.math.topics.map((t, i) => ({
        ...t,
        locked: i > 0,
        isPro: i > 0
      }))
    },
    pol: {
      ...data.pol,`;

content = content.replace(targetPolStr, mathOverride);

fs.writeFileSync(path, content);
