const fs = require('fs');

let content = fs.readFileSync('src/components/LearnView.tsx', 'utf-8');

// We want to replace all motion.div variants that use staggerChildren
// with simple initial/animate/exit

const replacements = [
  {
    from: `                  variants={{
                    hidden: { opacity: 0, y: 10 },
                    show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut', staggerChildren: 0.05 } },
                    exit: { opacity: 0, y: -10, transition: { duration: 0.15, ease: 'easeIn' } }
                  }}`,
    to: `                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}`
  },
  {
    from: `                  variants={{
                    hidden: { opacity: 0, x: 15 },
                    show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut', staggerChildren: 0.05 } },
                    exit: { opacity: 0, x: -15, transition: { duration: 0.15, ease: 'easeIn' } }
                  }}`,
    to: `                  initial={{ opacity: 0, x: 15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -15 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}`
  },
  {
    from: `                          variants={{
                            hidden: { opacity: 0, y: 15 },
                            show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
                          }}`,
    to: ``
  },
  {
    from: `                          variants={{
                            hidden: { opacity: 0, x: 20 },
                            show: { opacity: 1, x: 0, transition: { duration: 0.3, ease: 'easeOut' } }
                          }}`,
    to: ``
  },
  {
    from: `                          variants={{
                            hidden: { opacity: 0, y: 15 },
                            show: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' } }
                          }}`,
    to: ``
  }
];

let changed = false;
for (const r of replacements) {
  if (content.includes(r.from)) {
    content = content.split(r.from).join(r.to);
    changed = true;
  }
}

// Remove initial="hidden" animate="show" exit="exit" from the inner motion divs that we just stripped variants from
content = content.replace(/initial="hidden"\s+animate="show"\s+exit="exit"/g, "");

// Convert inner motion.divs to regular divs or remove their motion props
content = content.replace(/<motion\.div\s+key=\{topic\.id\}\s+className="relative/g, '<div key={topic.id} className="relative');
content = content.replace(/<\/motion\.div>\s+<\/div>\s+<div className="hidden sm:block w-32 shrink-0"><\/div>\s+<\/div>\s+<\/motion\.div>/g, 
                          '</div></div><div className="hidden sm:block w-32 shrink-0"></div></div></div>'); // For lessons/topics
// Let's just use simpler regex or string replaces to remove motion.div where possible, or just remove the variants.
// Wait, if we remove `variants`, the motion.div will just be a regular div (unless it has other motion props).
// That's fine.

fs.writeFileSync('src/components/LearnView.tsx', content);
console.log('Fixed animations in LearnView.tsx');
