import fs from 'fs';

let content = fs.readFileSync('src/components/LearnView.tsx', 'utf8');

const oldState = `  const [viewState, setViewState] = useState<ViewState>('subjects');
  const [selectedSubjectKey, setSelectedSubjectKey] = useState<string | null>(null);
  const [selectedTopicIndex, setSelectedTopicIndex] = useState<number | null>(null);`;

const newState = `  const [viewState, setViewState] = useState<ViewState>(() => {
    try {
      const stored = localStorage.getItem('matura_quest_last_viewed');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.viewState) return parsed.viewState;
      }
    } catch(e) {}
    return 'subjects';
  });

  const [selectedSubjectKey, setSelectedSubjectKey] = useState<string | null>(() => {
    try {
      const stored = localStorage.getItem('matura_quest_last_viewed');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.subjectKey) return parsed.subjectKey;
      }
    } catch(e) {}
    return null;
  });

  const [selectedTopicIndex, setSelectedTopicIndex] = useState<number | null>(() => {
    try {
      const stored = localStorage.getItem('matura_quest_last_viewed');
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.topicIndex !== undefined && parsed.topicIndex !== null) return parsed.topicIndex;
      }
    } catch(e) {}
    return null;
  });

  const [completedTasks, setCompletedTasks] = useState<string[]>(() => {
    try {
      const stored = localStorage.getItem('matura_quest_completed_tasks');
      if (stored) return JSON.parse(stored);
    } catch(e) {}
    return [];
  });

  import('react').then(react => {
    react.useEffect(() => {
      localStorage.setItem('matura_quest_last_viewed', JSON.stringify({
        viewState,
        subjectKey: selectedSubjectKey,
        topicIndex: selectedTopicIndex
      }));
    }, [viewState, selectedSubjectKey, selectedTopicIndex]);
  });`;

content = content.replace(oldState, newState);

fs.writeFileSync('src/components/LearnView.tsx', content);

