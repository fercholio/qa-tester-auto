require('dotenv').config();
const fs = require('fs');
const path = require('path');
const BddAiRunner = require('./src/usecases/BddAiRunner');
const HtmlReportGenerator = require('./src/utils/HtmlReportGenerator');

class MockSocket {
  emit(event, data) {
    if (event === 'log') {
      const icon = data.type === 'success' ? '✅' : (data.type === 'error' ? '❌' : (data.type === 'warning' ? '⚠️' : 'ℹ️'));
      console.log(`${icon} [${data.type.toUpperCase()}] ${data.message}`);
    }
  }
}

async function runAll() {
  const startTime = Date.now();
  const featuresDir = path.join(__dirname, 'bdd', 'features');
  const files = fs.readdirSync(featuresDir).filter(f => f.endsWith('.feature'));
  
  const { execSync } = require('child_process');
  try {
    execSync('php artisan tinker --execute="App\\\\Models\\\\User::withTrashed()->where(\'email\', \'like\', \'test-iso%\')->forceDelete(); App\\\\Models\\\\Tenant::where(\'name\', \'like\', \'%ILCO%\')->orWhere(\'name\', \'like\', \'%Empresa Demo%\')->delete();"', {
      cwd: '/Users/fercho/dev/timetracking/api',
      stdio: 'ignore'
    });
  } catch (_) {}

  const runner = new BddAiRunner(process.env.GROQ_API_KEY, new MockSocket());
  const featureResults = [];

  let xmlReport = `<?xml version="1.0" encoding="UTF-8"?>\n<testsuites>\n`;
  let totalTests = files.length;
  let failures = 0;
  
  xmlReport += `  <testsuite name="BDD RF Tests" tests="${totalTests}">\n`;
  
  for (const file of files) {
    const featurePath = path.join(featuresDir, file);
    console.log(`\n================================`);
    console.log(`🚀 Running feature: ${file}`);
    console.log(`================================\n`);
    
    let result = null;
    try {
      result = await runner.runFeature(featurePath, 'http://localhost:3000/platform', {
        loginUrl: 'http://localhost:3000/login',
        email: 'super@demo.com',
        password: 'password'
      });
    } catch (e) {
      console.error(`Error executing ${file}:`, e);
      result = {
        title: file.replace('.feature', ''),
        file,
        path: featurePath,
        passed: false,
        duration: 0,
        scenarios: [{
          title: 'Execution Error',
          passed: false,
          error: e.message,
          steps: [],
          stepResults: []
        }]
      };
    }
    
    featureResults.push(result);
    if (!result.passed) failures++;
    
    xmlReport += `    <testcase name="${file}" classname="RF">\n`;
    if (!result.passed) {
      xmlReport += `      <failure message="Scenario failed. Check HTML report and screenshots." />\n`;
    }
    
    let allErrors = [];
    for (const sc of (result.scenarios || [])) {
      if (sc.pageErrors && sc.pageErrors.length > 0) {
        allErrors.push(...sc.pageErrors);
      }
    }
    
    if (allErrors.length > 0) {
      xmlReport += `      <system-err><![CDATA[\n${allErrors.join('\n')}\n      ]]></system-err>\n`;
    }
    
    xmlReport += `    </testcase>\n`;
  }
  
  xmlReport += `  </testsuite>\n</testsuites>\n`;
  fs.writeFileSync('report.xml', xmlReport);

  const endTime = Date.now();
  const htmlContent = HtmlReportGenerator.generate({
    features: featureResults,
    startTime,
    endTime,
    environment: {
      targetUrl: process.env.TARGET_URL || 'http://localhost:3000',
      model: 'Groq / openai/gpt-oss-120b',
      browser: 'Playwright Chromium',
      node: process.version,
      platform: process.platform
    }
  });

  fs.writeFileSync('report.html', htmlContent);
  const publicDir = path.join(__dirname, 'public');
  if (!fs.existsSync(publicDir)) fs.mkdirSync(publicDir, { recursive: true });
  fs.writeFileSync(path.join(publicDir, 'report.html'), htmlContent);
  const timeTrackingReport = path.resolve(__dirname, '..', 'timetracking', 'report.html');
  try { fs.writeFileSync(timeTrackingReport, htmlContent); } catch (_) {}

  console.log(`\n======================================================`);
  console.log(`✨ BDD SUITE COMPLETED ✨`);
  console.log(`======================================================`);
  console.log(`📄 Reporte HTML (Imprimible): ${path.resolve('report.html')}`);
  console.log(`📄 Reporte XML (JUnit):       ${path.resolve('report.xml')}`);
  console.log(`⏱️ Duración Total:            ${((endTime - startTime) / 1000).toFixed(2)}s`);
  console.log(`🎯 Features:                  ${files.length} total, ${files.length - failures} passed, ${failures} failed`);
  console.log(`======================================================\n`);
}

runAll();
