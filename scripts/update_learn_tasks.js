import fs from 'fs';

let content = fs.readFileSync('src/components/LearnView.tsx', 'utf8');

const mapStart = `{displayData[selectedSubjectKey].topics[selectedTopicIndex].tasks.map((task: any, idx: number, tasksArr: any[]) => {`;
const mapEnd = `              );
            })}
          </div>
        </motion.div>
      )}`;

const replacement = `{displayData[selectedSubjectKey].topics[selectedTopicIndex].tasks.map((task: any, idx: number, tasksArr: any[]) => {
              const isTaskCompleted = completedTasks.includes(task.id);
              const isTaskLocked = idx > 0 && !completedTasks.includes(tasksArr[idx - 1].id);
              let Icon = BookText;
              let methodColor = 'text-blue-400 bg-blue-500/10';
              if (task.type === 'quiz') { Icon = Zap; methodColor = 'text-purple-400 bg-purple-500/10'; }
              if (task.type === 'practice') { Icon = PenTool; methodColor = 'text-emerald-400 bg-emerald-500/10'; }
              if (task.type === 'exam') { Icon = Award; methodColor = 'text-amber-400 bg-amber-500/10'; }
              
              if (task.type === 'theory') {
                return (
                  <div key={task.id} className="mt-4 mb-1 first:mt-0">
                    <button 
                      onClick={() => {
                        if (isTaskLocked) return;
                        triggerHaptic('medium');
                        onStartTask?.(task);
                      }}
                      disabled={isTaskLocked}
                      className={\`w-full group flex flex-col p-5 rounded-[24px] border transition-all text-left relative overflow-hidden \${isTaskLocked ? 'opacity-60 border-white/5 bg-[#13141A]/50 cursor-not-allowed' : 'border-blue-500/20 bg-gradient-to-br from-blue-900/20 to-indigo-900/10 hover:border-blue-500/40 shadow-lg shadow-blue-900/10'}\`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div className="flex items-center gap-2">
                          <div className={\`w-10 h-10 rounded-[12px] flex items-center justify-center \${isTaskCompleted ? 'bg-emerald-500/20 text-emerald-400' : isTaskLocked ? 'bg-white/5 text-[#8B8D98]' : 'bg-blue-500/20 text-blue-400'}\`}>
                            {isTaskCompleted ? <Award size={20} /> : isTaskLocked ? <Lock size={20} /> : <BookOpen size={20} />}
                          </div>
                          <span className={\`text-[10px] font-bold uppercase tracking-wider \${isTaskLocked ? 'text-[#8B8D98]' : 'text-blue-400/80'}\`}>
                            Część teoretyczna • {task.time}
                          </span>
                        </div>
                        <span className="text-[11px] font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded-md">+{task.xp} XP</span>
                      </div>
                      
                      <h3 className={\`font-display font-bold text-lg mt-1 mb-1.5 transition-colors \${isTaskLocked ? 'text-white/50' : 'text-white group-hover:text-blue-300'}\`}>
                        <MathText text={task.title} />
                      </h3>
                      <div className={\`text-sm leading-relaxed mb-4 line-clamp-2 \${isTaskLocked ? 'text-[#8B8D98]/50' : 'text-blue-100/70'}\`}>
                        <MathText text={task.question} />
                      </div>
                      
                      <div className="flex items-center justify-between w-full pt-3 border-t border-blue-500/10">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-blue-400">
                          Przeczytaj pigułkę wiedzy
                        </span>
                        <div className="flex items-center gap-1.5 opacity-60 group-hover:opacity-100 transition-opacity">
                          <span className="text-[11px] font-bold text-white">Rozpocznij</span>
                          <ArrowRight size={14} className="text-white" />
                        </div>
                      </div>
                    </button>
                  </div>
                );
              }

              return (
                <button 
                  key={task.id}
                  onClick={() => {
                    if (isTaskLocked) return;
                    triggerHaptic('medium');
                    onStartTask?.(task);
                  }}
                  disabled={isTaskLocked}
                  className={\`group flex items-center p-3 sm:p-4 rounded-[20px] bg-[#13141A] border transition-all text-left relative overflow-hidden \${
                    isTaskLocked ? 'opacity-50 border-white/5 cursor-not-allowed' : 'border-white/5 hover:border-white/10 hover:bg-[#1A1B23]'
                  }\`}
                >
                  <div className={\`w-10 h-10 rounded-[12px] flex-shrink-0 flex items-center justify-center mr-4 \${isTaskCompleted ? 'bg-emerald-500/10 text-emerald-400' : isTaskLocked ? 'bg-white/5 text-[#8B8D98]' : methodColor}\`}>
                    {isTaskCompleted ? <Award size={18} /> : isTaskLocked ? <Lock size={18} /> : <Icon size={18} />}
                  </div>
                  
                  <div className="flex-1 min-w-0 pr-4">
                    <h3 className={\`font-display font-bold text-[14px] mb-1 truncate transition-colors \${isTaskLocked ? 'text-white/50' : 'text-white group-hover:text-white'}\`}>
                      <MathText text={task.title} />
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className={\`text-[9px] font-bold uppercase tracking-wider \${isTaskLocked ? 'text-[#8B8D98]' : methodColor.split(' ')[0]}\`}>
                        {task.method}
                      </span>
                      <span className="text-[#8B8D98] text-[9px]">•</span>
                      <span className="text-[#8B8D98] text-[9px] font-medium">{task.time}</span>
                    </div>
                  </div>
                  
                  <div className="flex flex-col items-end flex-shrink-0">
                    <span className="text-[11px] font-bold text-white/70 bg-white/5 px-2 py-1 rounded-md mb-1.5 group-hover:bg-white/10 transition-colors">+{task.xp} XP</span>
                    <ChevronRight size={14} className="text-[#8B8D98] group-hover:text-white transition-colors" />
                  </div>
                </button>
              );
            })}
          </div>
        </motion.div>
      )}`;

const startIndex = content.indexOf(mapStart);
const endIndex = content.indexOf(mapEnd) + mapEnd.length;

if (startIndex !== -1 && endIndex !== -1) {
  content = content.slice(0, startIndex) + replacement + content.slice(endIndex);
  fs.writeFileSync('src/components/LearnView.tsx', content);
  console.log('Success');
} else {
  console.log('Could not find boundaries');
}

