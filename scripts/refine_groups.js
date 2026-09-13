import fs from 'fs';

let content = fs.readFileSync('src/components/LearnView.tsx', 'utf8');

const targetStr = `return grouped.map((group, groupIdx) => (
              <div key={groupIdx} className="mb-10 last:mb-0">
                <div className="flex items-center gap-3 mb-4">
                  <div className="h-[1px] flex-1 bg-white/5"></div>
                  <h2 className="text-[13px] font-bold text-white/40 uppercase tracking-widest">{group.name}</h2>
                  <div className="h-[1px] flex-1 bg-white/5"></div>
                </div>
                <div className="flex flex-col gap-3">`;

const replacement = `return grouped.map((group, groupIdx) => {
              const hasTheoryHeader = group.tasks[0]?.id.includes('THEORY');
              
              return (
              <div key={groupIdx} className="mb-8 last:mb-0 relative">
                {!hasTheoryHeader && (
                  <div className="flex items-center gap-3 mb-4 mt-2">
                    <div className="h-[1px] flex-1 bg-gradient-to-r from-transparent to-white/10"></div>
                    <h2 className="text-[11px] font-bold text-white/40 uppercase tracking-[0.2em]">{group.name}</h2>
                    <div className="h-[1px] flex-1 bg-gradient-to-l from-transparent to-white/10"></div>
                  </div>
                )}
                
                {hasTheoryHeader && groupIdx > 0 && (
                   <div className="h-[1px] w-full bg-white/5 mb-8 mt-4"></div>
                )}
                
                <div className="flex flex-col gap-3">`;

content = content.replace(targetStr, replacement);
content = content.replace('))', ')}'); // fix the map callback closing

fs.writeFileSync('src/components/LearnView.tsx', content);

