require('dotenv').config();
const BddAiRunner = require('./src/usecases/BddAiRunner');

class MockSocket {
  emit(event, data) {
    if (event === 'log') {
      console.log(`[${data.type || 'info'}]`, data.message);
    } else {
      console.log(`[${event}]`, typeof data === 'object' ? JSON.stringify(data) : data);
    }
  }
}

async function run() {
  const runner = new BddAiRunner(process.env.GROQ_API_KEY, new MockSocket());
  
  console.log('\n=============================================');
  console.log('--- RUNNING rf-approvals.feature ---');
  console.log('=============================================\n');

  const approvalsResult = await runner.runFeature('./bdd/features/rf-approvals.feature', 'http://localhost:3000/timesheet', {
    loginUrl: 'http://localhost:3000/login',
    email: 'admin@demo.com',
    password: 'password'
  });

  console.log('\n--- rf-approvals.feature Results:');
  console.log('Passed:', approvalsResult.passed);
  console.table(approvalsResult.scenarios?.map(s => ({ title: s.title, passed: s.passed, error: s.error })));

  console.log('\n=============================================');
  console.log('--- RUNNING rf-superadmin.feature ---');
  console.log('=============================================\n');

  const superadminResult = await runner.runFeature('./bdd/features/rf-superadmin.feature', 'http://localhost:3000/platform', {
    loginUrl: 'http://localhost:3000/login',
    email: 'super@demo.com',
    password: 'password'
  });

  console.log('\n--- rf-superadmin.feature Results:');
  console.log('Passed:', superadminResult.passed);
  console.table(superadminResult.scenarios?.map(s => ({ title: s.title, passed: s.passed, error: s.error })));

  const allPassed = approvalsResult.passed && superadminResult.passed;

  console.log('\n=============================================');
  console.log('APPROVALS & SUPERADMIN RESULT:', allPassed ? 'ALL PASSED ✅' : 'SOME FAILED ❌');
  console.log('=============================================\n');
}

run();
