import fs from 'fs';

// App.tsx
let appContent = fs.readFileSync('src/App.tsx', 'utf8');
appContent = appContent.replace('const handleCompleteTask = () => {', 'const handleCompleteTask = (taskId?: string) => {\n    if (taskId) {\n      try {\n        const stored = JSON.parse(localStorage.getItem("matura_quest_completed_tasks") || "[]");\n        if (!stored.includes(taskId)) {\n          stored.push(taskId);\n          localStorage.setItem("matura_quest_completed_tasks", JSON.stringify(stored));\n        }\n      } catch (e) {}\n    }');
fs.writeFileSync('src/App.tsx', appContent);

// TaskView.tsx
let taskViewContent = fs.readFileSync('src/components/TaskView.tsx', 'utf8');
taskViewContent = taskViewContent.replace('onCompleteTask: () => void;', 'onCompleteTask: (taskId?: string) => void;');
taskViewContent = taskViewContent.replace('onCompleteTask();', 'onCompleteTask(activeTask.id);');
fs.writeFileSync('src/components/TaskView.tsx', taskViewContent);

