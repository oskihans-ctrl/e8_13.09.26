import fs from 'fs';

let content = fs.readFileSync('src/components/LearnView.tsx', 'utf8');

const target1 = `if (task.type === 'theory') {
                groupName = task.title;
              } else if (task.topic.includes('Sprawdzian')) {`;
const rep1 = `if (task.id.includes('THEORY')) {
                groupName = task.title;
              } else if (task.topic.includes('Sprawdzian')) {`;

content = content.replace(target1, rep1);

const target2 = `if (task.type === 'theory') {
                      return (
                        <div key={task.id} className="mb-2">`;
const rep2 = `if (task.id.includes('THEORY')) {
                      return (
                        <div key={task.id} className="mb-2">`;

content = content.replace(target2, rep2);

fs.writeFileSync('src/components/LearnView.tsx', content);
