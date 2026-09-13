import fs from 'fs';

const path = 'src/components/LearnView.tsx';
let content = fs.readFileSync(path, 'utf8');

const mathGuestOverride = `math: {
      ...data.math,
      topics: data.math.topics.map((t, i) => ({
        ...t,
        locked: i > 0,
        isPro: i > 0
      }))
    },
    pol: {`;

content = content.replace(/pol: {/, mathGuestOverride);
fs.writeFileSync(path, content);
console.log('Updated guest math topics');
