require('dotenv').config();
const BddAiRunner = require('./src/usecases/BddAiRunner');

class MockSocket {
  emit(event, data) {
    console.log(`[${event}]`, data);
  }
}

async function run() {
  const runner = new BddAiRunner(process.env.GROQ_API_KEY, new MockSocket());
  const passed = await runner.runScenario('./bdd/features/rf-1.4.feature', 'http://localhost:3000/platform', {
    loginUrl: 'http://localhost:3000/login',
    email: 'super@demo.com', // wait, is this the right superadmin?
    password: 'password' 
  });
  console.log('Test result:', passed);
}

run();
