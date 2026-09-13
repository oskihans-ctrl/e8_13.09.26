import fs from 'fs';
let content = fs.readFileSync('src/components/LearnView.tsx', 'utf8');

const target = `                  })}
                </div>
              </div>
            });`;

const replacement = `                  })}
                </div>
              </div>
              );
            });`;

content = content.replace(target, replacement);
fs.writeFileSync('src/components/LearnView.tsx', content);
