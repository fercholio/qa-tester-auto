require('dotenv').config();
const BddAiRunner = require('./src/usecases/BddAiRunner');

class MockSocket {
  emit(event, data) {
    console.log(`[${event}]`, data);
  }
}

async function run() {
  const runner = new BddAiRunner(process.env.GROQ_API_KEY, new MockSocket());
  const result = await runner.runFeature('./bdd/features/01-rf-auth-identidad-dual.feature', 'http://localhost:5174/', {
    loginUrl: 'http://localhost:5174/login',
    email: 'abogado@mendezgarza.mx',
    password: 'Password123!' 
  });
  console.log('Test result passed:', result.passed);
  console.log('Scenarios summary:', result.scenarios?.map(s => ({ title: s.title, passed: s.passed, error: s.error })));
}

run();
