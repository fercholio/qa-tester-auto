require('dotenv').config();
const { execSync } = require('child_process');
const BddAiRunner = require('./src/usecases/BddAiRunner');

function cleanupDb() {
  try {
    execSync(`php artisan tinker --execute="
      \\App\\Models\\TimeEntry::whereIn('description', ['Cita Medica Simultanea', 'Cita Medica Simultanea Solapada', 'Revision de Expediente', 'Entrada Invalida'])->forceDelete();
      \\App\\Models\\Tenant::where('name', 'ILCO Operaciones')->forceDelete();
      \\App\\Models\\Project::where('name', 'Defensa Civil')->forceDelete();
      \\App\\Models\\Tag::where('name', 'Facturable Extraordinario')->forceDelete();
      \\App\\Models\\Position::whereIn('name', ['Director General', 'Analista Senior'])->forceDelete();
    "`, {
      cwd: '/Users/fercho/dev/timetracking/api',
      stdio: 'ignore'
    });
  } catch (e) {
    // ignore
  }
}

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
  cleanupDb();
  const runner = new BddAiRunner(process.env.GROQ_API_KEY, new MockSocket());
  
  console.log('\n=============================================');
  console.log('--- RUNNING rf-tenantadmin.feature ---');
  console.log('=============================================\n');

  const tenantAdminResult = await runner.runFeature('./bdd/features/rf-tenantadmin.feature', 'http://localhost:3000/platform', {
    loginUrl: 'http://localhost:3000/login',
    email: 'admin@demo.com',
    password: 'password'
  });

  console.log('\n--- rf-tenantadmin.feature Results:');
  console.log('Passed:', tenantAdminResult.passed);
  console.table(tenantAdminResult.scenarios?.map(s => ({ title: s.title, passed: s.passed, error: s.error })));

  console.log('\n=============================================');
  console.log('--- RUNNING rf-projects.feature ---');
  console.log('=============================================\n');

  const projectsResult = await runner.runFeature('./bdd/features/rf-projects.feature', 'http://localhost:3000/platform', {
    loginUrl: 'http://localhost:3000/login',
    email: 'admin@demo.com',
    password: 'password'
  });

  console.log('\n--- rf-projects.feature Results:');
  console.log('Passed:', projectsResult.passed);
  console.table(projectsResult.scenarios?.map(s => ({ title: s.title, passed: s.passed, error: s.error })));

  const allPassed = tenantAdminResult.passed && projectsResult.passed;

  console.log('\n=============================================');
  console.log('FINAL VALIDATION RESULT:', allPassed ? 'ALL PASSED ✅' : 'SOME FAILED ❌');
  console.log('=============================================\n');
}

run();
