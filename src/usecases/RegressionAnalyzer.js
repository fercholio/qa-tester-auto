const fs = require('fs');
const path = require('path');

class RegressionAnalyzer {
  constructor(historyDir = 'surface_history') {
    this.historyDir = path.resolve(process.cwd(), historyDir);
    if (!fs.existsSync(this.historyDir)) {
      fs.mkdirSync(this.historyDir, { recursive: true });
    }
  }

  saveSnapshotAndCompare(url, currentSurface) {
    const safeUrl = url.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const historyFile = path.join(this.historyDir, `${safeUrl}.json`);
    
    let previousSurface = null;
    if (fs.existsSync(historyFile)) {
      previousSurface = JSON.parse(fs.readFileSync(historyFile, 'utf8'));
    }

    // Save current as latest
    const snapshot = {
      timestamp: Date.now(),
      url: url,
      surface: currentSurface
    };
    fs.writeFileSync(historyFile, JSON.stringify(snapshot, null, 2));

    // Compare
    const report = { changed: false, missingInputs: [], newInputs: [], missingButtons: [], newButtons: [] };
    if (previousSurface) {
      const prevIds = previousSurface.surface.inputs.map(i => i.id || i.name).filter(Boolean);
      const currIds = currentSurface.inputs.map(i => i.id || i.name).filter(Boolean);
      
      report.missingInputs = prevIds.filter(id => !currIds.includes(id));
      report.newInputs = currIds.filter(id => !prevIds.includes(id));

      const prevBtns = previousSurface.surface.buttons.map(b => b.text || b.id).filter(Boolean);
      const currBtns = currentSurface.buttons.map(b => b.text || b.id).filter(Boolean);

      report.missingButtons = prevBtns.filter(b => !currBtns.includes(b));
      report.newButtons = currBtns.filter(b => !prevBtns.includes(b));

      if (report.missingInputs.length || report.newInputs.length || report.missingButtons.length || report.newButtons.length) {
        report.changed = true;
      }
    }
    
    return report;
  }
}

module.exports = RegressionAnalyzer;
