const fs = require('fs');
const path = require('path');

class ApplicationLogger {
  constructor(logDir = 'logs') {
    this.logDir = path.resolve(process.cwd(), logDir);
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  logExecution(context, actions) {
    const timestamp = new Date().toISOString();
    const filename = `execution_${timestamp.replace(/[:.]/g, '-')}.json`;
    const filepath = path.join(this.logDir, filename);

    const logData = {
      timestamp,
      context,
      stepsExecuted: actions
    };

    fs.writeFileSync(filepath, JSON.stringify(logData, null, 2), 'utf8');
    return filepath;
  }
}

module.exports = ApplicationLogger;
