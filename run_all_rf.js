require('dotenv').config();
const fs = require('fs');
const path = require('path');
const BddAiRunner = require('./src/usecases/BddAiRunner');

class MockSocket {
  emit(event, data) {
    console.log(`[${event}]`, data);
  }
}

async function runAll() {
  const featuresDir = path.join(__dirname, 'bdd', 'features');
  const files = fs.readdirSync(featuresDir).filter(f => f.endsWith('.feature'));
  
  const runner = new BddAiRunner(process.env.GROQ_API_KEY, new MockSocket());
  
  let xmlReport = `<?xml version="1.0" encoding="UTF-8"?>\n<testsuites>\n`;
  let totalTests = files.length;
  let failures = 0;
  
  xmlReport += `  <testsuite name="BDD RF Tests" tests="${totalTests}">\n`;
  
  for (const file of files) {
    const featurePath = path.join(featuresDir, file);
    console.log(`\n================================`);
    console.log(`Running feature: ${file}`);
    console.log(`================================\n`);
    
    let passed = false;
    let scenarios = [];
    let screenshotPath = `screenshot-${file.replace('.feature', '')}-${Date.now()}.png`;
    
    try {
      const result = await runner.runFeature(featurePath, 'http://localhost:3000/platform', {
        loginUrl: 'http://localhost:3000/login',
        email: 'super@demo.com',
        password: 'password'
      });
      passed = result.passed;
      scenarios = result.scenarios;
    } catch (e) {
      passed = false;
      console.error(`Error executing ${file}:`, e);
    }
    
    if (!passed) failures++;
    
    xmlReport += `    <testcase name="${file}" classname="RF">\n`;
    if (!passed) {
      xmlReport += `      <failure message="Scenario failed. Check logs and screenshots." />\n`;
    }
    
    let allErrors = [];
    for (const sc of scenarios) {
      if (sc.pageErrors && sc.pageErrors.length > 0) {
        allErrors.push(...sc.pageErrors);
      }
    }
    
    if (allErrors.length > 0) {
      xmlReport += `      <system-err><![CDATA[\n${allErrors.join('\n')}\n      ]]></system-err>\n`;
    }
    
    // We can add a property for the screenshot
    xmlReport += `      <system-out>Screenshot saved as: ${screenshotPath} (if taken by Playwright error)</system-out>\n`;
    xmlReport += `    </testcase>\n`;
  }
  
  xmlReport += `  </testsuite>\n</testsuites>\n`;
  
  fs.writeFileSync('report.xml', xmlReport);
  console.log(`\nTests finished. XML report generated at report.xml`);
}

runAll();
