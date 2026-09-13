import fs from 'fs';
let content = fs.readFileSync('src/components/LearnView.tsx', 'utf8');

const target = `<div key={groupIdx} className="mb-8 last:mb-0 relative">`;
const replacement = `<motion.div 
                key={groupIdx} 
                className="mb-8 last:mb-0 relative"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: groupIdx * 0.05 + 0.1, duration: 0.3 }}
              >`;

content = content.replace(target, replacement);

const targetEnd = `</div>
              );
            });`;
const replacementEnd = `</motion.div>
              );
            });`;

content = content.replace(targetEnd, replacementEnd);
fs.writeFileSync('src/components/LearnView.tsx', content);
