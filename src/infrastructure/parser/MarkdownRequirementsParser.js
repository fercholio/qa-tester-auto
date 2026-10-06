const fs = require('fs');
const Requirement = require('../../domain/models/Requirement');

class MarkdownRequirementsParser {
  static parse(filePath) {
    if (!fs.existsSync(filePath)) {
      throw new Error(`Docs file not found: ${filePath}`);
    }

    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split('\n');
    const requirements = [];
    let currentModule = 'General';

    lines.forEach(line => {
      if (line.startsWith('## ')) {
        currentModule = line.replace('## ', '').trim();
      } else if (line.match(/^### (RF-[A-Z0-9-]+):\s*(.*)/)) {
        const match = line.match(/^### (RF-[A-Z0-9-]+):\s*(.*)/);
        requirements.push(new Requirement(match[1], currentModule, match[2].trim(), match[2].trim()));
      } else if (line.match(/^\*\*RF-\d+\.\d+:/)) {
        const match = line.match(/^\*\*(RF-\d+\.\d+):\s*(.*?)\.\*\*(.*)/);
        if (match) {
          requirements.push(new Requirement(match[1], currentModule, match[2].trim(), match[3].trim()));
        } else {
           const simpleMatch = line.match(/^\*\*(RF-\d+\.\d+.*?\*\*.*)/);
           if (simpleMatch) {
              requirements.push(new Requirement(line.split(':')[0].replace('**', ''), currentModule, line, line));
           }
        }
      } else if (line.match(/^\*\*(RF-[A-Z0-9-]+):\s*(.*?)\.\*\*(.*)/)) {
         const match = line.match(/^\*\*(RF-[A-Z0-9-]+):\s*(.*?)\.\*\*(.*)/);
         if (match) {
            requirements.push(new Requirement(match[1], currentModule, match[2].trim(), match[3] ? match[3].trim() : match[2].trim()));
         }
      } else if (line.match(/^\| \*\*(RF-[A-Z0-9-]+)\*\* \|/)) {
         const parts = line.split('|').map(p => p.trim());
         if (parts.length >= 4) {
            requirements.push(new Requirement(parts[1].replace(/\*\*/g, ''), currentModule, parts[2], parts[3]));
         }
      }
    });

    return requirements;
  }
}

module.exports = MarkdownRequirementsParser;
