require('dotenv').config();
const BddAiRunner = require('./src/usecases/BddAiRunner');

class MockSocket {
  emit(event, data) {
    console.log(`[${event}]`, data);
  }
}

async function run() {
  const runner = new BddAiRunner(process.env.GROQ_API_KEY, new MockSocket());
  const result = await runner.runFeature('./bdd/features/rf-user.feature', 'http://localhost:3000/platform', {
    loginUrl: 'http://localhost:3000/login',
    email: 'super@demo.com',
    password: 'password' 
  });
  console.log('Test result passed:', result.passed);
  console.log('Scenarios summary:', result.scenarios?.map(s => ({ title: s.title, passed: s.passed, error: s.error })));
}

run();
