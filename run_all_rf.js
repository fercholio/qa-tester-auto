require('dotenv').config();
const fs = require('fs');
const path = require('path');
const BddAiRunner = require('./src/usecases/BddAiRunner');
const HtmlReportGenerator = require('./src/utils/HtmlReportGenerator');
const RepoConfigLoader = require('./src/infrastructure/config/RepoConfigLoader');

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
  const repoName = process.env.REPO_NAME || process.env.APP_NAME || 'abogalia';
  const repoDir = path.join(__dirname, 'bdd', `features_${repoName}`);
  const featuresDir = process.env.FEATURES_DIR
    ? path.resolve(process.env.FEATURES_DIR)
    : (fs.existsSync(repoDir) ? repoDir : path.join(__dirname, 'bdd', 'features'));
  console.log(`📁 Usando directorio de features: ${featuresDir}`);
  const files = fs.readdirSync(featuresDir).filter(f => f.endsWith('.feature')).sort();

  const repoConfig = RepoConfigLoader.load(repoName, featuresDir);
  console.log(`⚙️ Configuración cargada para repositorio: ${repoConfig.displayName} (${repoConfig.targetUrl})`);

  const runner = new BddAiRunner(process.env.GROQ_API_KEY, new MockSocket(), repoConfig);
  const featureResults = [];

  let xmlReport = `<?xml version="1.0" encoding="UTF-8"?>\n<testsuites>\n`;
  let totalTests = files.length;
  let failures = 0;
  
  xmlReport += `  <testsuite name="BDD RF Tests" tests="${totalTests}">\n`;
  
  const startFrom = process.env.START_FROM_FEATURE || null;
  let skipping = !!startFrom;

  for (const file of files) {
    if (skipping) {
      if (file.includes(startFrom) || file === startFrom) {
        skipping = false;
      } else {
        console.log(`⏩ Omitiendo (antes de ${startFrom}): ${file}`);
        continue;
      }
    }
    const featurePath = path.join(featuresDir, file);
    console.log(`\n================================`);
    console.log(`🚀 Running feature: ${file}`);
    console.log(`================================\n`);
    
    let result = null;
    try {
      const defaultCreds = repoConfig.auth.credentials.default || Object.values(repoConfig.auth.credentials)[0] || { email: '', password: '' };
      result = await runner.runFeature(featurePath, repoConfig.targetUrl, {
        loginUrl: repoConfig.loginUrl,
        email: defaultCreds.email,
        password: defaultCreds.password
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
      targetUrl: process.env.TARGET_URL || 'http://localhost:5174',
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
  const repoReport = path.resolve(__dirname, '..', repoName, 'report.html');
  try { fs.writeFileSync(repoReport, htmlContent); } catch (_) {}

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
