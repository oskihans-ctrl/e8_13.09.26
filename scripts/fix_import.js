import fs from 'fs';
let content = fs.readFileSync('src/components/LearnView.tsx', 'utf8');

content = content.replace("import { useState } from 'react';", "import { useState, useEffect } from 'react';");
content = content.replace(/import\('react'\)\.then\(react => \{\n    react\.useEffect/g, "useEffect");
content = content.replace(/  \}\);\n  const displayData/g, "  const displayData");

fs.writeFileSync('src/components/LearnView.tsx', content);
