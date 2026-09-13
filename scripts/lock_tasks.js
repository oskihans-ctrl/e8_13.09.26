import fs from 'fs';

let content = fs.readFileSync('src/components/LearnView.tsx', 'utf8');

const oldMap = `{displayData[selectedSubjectKey].topics[selectedTopicIndex].tasks.map((task: any) => {`;
const newMap = `{displayData[selectedSubjectKey].topics[selectedTopicIndex].tasks.map((task: any, idx: number, tasksArr: any[]) => {
              const isTaskCompleted = completedTasks.includes(task.id);
              const isTaskLocked = idx > 0 && !completedTasks.includes(tasksArr[idx - 1].id);`;

content = content.replace(oldMap, newMap);

const oldBtn = `<button 
                  key={task.id}
                  onClick={() => {
                    triggerHaptic('medium');
                    onStartTask?.(task);
                  }}
                  className="group flex flex-col p-4 rounded-[20px] bg-[#13141A] border border-white/5 hover:border-blue-500/30 transition-all text-left relative overflow-hidden"
                >`;

const newBtn = `<button 
                  key={task.id}
                  onClick={() => {
                    if (isTaskLocked) return;
                    triggerHaptic('medium');
                    onStartTask?.(task);
                  }}
                  disabled={isTaskLocked}
                  className={\`group flex flex-col p-4 rounded-[20px] bg-[#13141A] border transition-all text-left relative overflow-hidden \${
                    isTaskLocked ? 'opacity-50 border-white/5 cursor-not-allowed' : 'border-white/5 hover:border-blue-500/30'
                  }\`}
                >`;

content = content.replace(oldBtn, newBtn);

const oldHeader = `<h3 className="font-display font-bold text-white text-[15px] mb-1 group-hover:text-blue-400 transition-colors">
                    <MathText text={task.title} />
                  </h3>`;

const newHeader = `<h3 className={\`font-display font-bold text-[15px] mb-1 transition-colors \${isTaskLocked ? 'text-white/50' : 'text-white group-hover:text-blue-400'}\`}>
                    <MathText text={task.title} />
                  </h3>`;

content = content.replace(oldHeader, newHeader);

const oldIcon = `<div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className={\`w-8 h-8 rounded-[10px] flex items-center justify-center \${methodColor}\`}>
                        <Icon size={16} />
                      </div>`;

const newIcon = `<div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-2">
                      <div className={\`w-8 h-8 rounded-[10px] flex items-center justify-center \${isTaskCompleted ? 'bg-emerald-500/20 text-emerald-400' : isTaskLocked ? 'bg-white/5 text-[#8B8D98]' : methodColor}\`}>
                        {isTaskCompleted ? <Award size={16} /> : isTaskLocked ? <Lock size={16} /> : <Icon size={16} />}
                      </div>`;

content = content.replace(oldIcon, newIcon);

fs.writeFileSync('src/components/LearnView.tsx', content);

