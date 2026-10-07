const fs = require('fs');
const content = fs.readFileSync("/Users/fercho/dev/timetracking/docs/tempus_v2/func_requirements_v2.md", "utf8");
const lines = content.split('\n');
const requirements = [];
let currentModule = 'General';

lines.forEach(line => {
    if (line.startsWith('## ')) {
      currentModule = line.replace('## ', '').trim();
    } else if (line.match(/^### (RF-[A-Z0-9-]+):\s*(.*)/)) {
      const match = line.match(/^### (RF-[A-Z0-9-]+):\s*(.*)/);
      requirements.push({
        id: match[1],
        module: currentModule,
        title: match[2].trim(),
        description: match[2].trim()
      });
    } else if (line.match(/^\*\*RF-\d+\.\d+:/)) {
      const match = line.match(/^\*\*(RF-\d+\.\d+):\s*(.*?)\.\*\*(.*)/);
      if (match) {
        requirements.push({
          id: match[1],
          module: currentModule,
          title: match[2].trim(),
          description: match[3] ? match[3].trim() : match[2].trim()
        });
      } else {
         const simpleMatch = line.match(/^\*\*(RF-\d+\.\d+.*?\*\*.*)/);
         if (simpleMatch) {
            requirements.push({
               id: line.split(':')[0].replace('**', ''),
               module: currentModule,
               title: line,
               description: line
            });
         }
      }
    } else if (line.match(/^\*\*(RF-[A-Z0-9-]+):\s*(.*?)\.\*\*(.*)/)) {
       const match = line.match(/^\*\*(RF-[A-Z0-9-]+):\s*(.*?)\.\*\*(.*)/);
       if (match) {
          requirements.push({
             id: match[1],
             module: currentModule,
             title: match[2].trim(),
             description: match[3] ? match[3].trim() : match[2].trim()
          });
       }
    } else if (line.match(/^\| \*\*(RF-[A-Z0-9-]+)\*\* \|/)) {
       const parts = line.split('|').map(p => p.trim());
       if (parts.length >= 4) {
          requirements.push({
             id: parts[1].replace(/\*\*/g, ''),
             module: currentModule,
             title: parts[2],
             description: parts[3]
          });
       }
    }
  });

console.log(requirements);
