const AiPlanGenerator = require('../src/usecases/AiPlanGenerator');

// Mock GroqAdapter inside AiPlanGenerator
jest.mock('../src/infrastructure/GroqAdapter', () => {
  return jest.fn().mockImplementation(() => {
    return {
      groq: {
        chat: {
          completions: {
            create: jest.fn().mockRejectedValue(new Error("Mock API Limit Hit"))
          }
        }
      }
    };
  });
});

describe('AiPlanGenerator (Zero Mock Architecture)', () => {
  let generator;

  beforeEach(() => {
    generator = new AiPlanGenerator('dummy-key');
  });

  test('should gracefully fallback when API fails and still return valid test plans', async () => {
    const surfaceMap = [
      { url: 'http://localhost:3000/dashboard', inputs: [ { name: 'email', type: 'email' } ], buttons: [ { id: 'btn1' } ] },
      { url: 'http://localhost:3000/home', inputs: [], buttons: [ { id: 'btn2' } ] },
      { url: 'http://localhost:3000/profile', inputs: [], buttons: [] }
    ];

    const plans = await generator.generateTestPlan(surfaceMap);
    
    // Fallback logic produces 1 case per page with inputs/buttons + 1 global monkey test
    // Dashboard (inputs) -> 1
    // Home (buttons) -> 1
    // Profile (empty) -> 0
    // Global -> 1
    // Total = 3 for this chunk. Wait, the chunking splits the 3 into 1 chunk.
    expect(plans.length).toBe(3);
    
    const monkeyPlan = plans.find(p => p.id === 'fallback_monkey');
    expect(monkeyPlan).toBeDefined();
    expect(monkeyPlan.title).toContain('Monkey Test Global');
  });

  test('should chunk large surface maps correctly during fallback', async () => {
    const surfaceMap = Array.from({ length: 5 }).map((_, i) => ({
      url: `http://localhost:3000/page${i}`,
      inputs: [ { name: 'email', type: 'email' } ],
      buttons: []
    }));

    // 5 pages = 2 chunks (3 and 2)
    // Chunk 1 Fallback: 3 pages -> 3 basic tests + 1 monkey = 4
    // Chunk 2 Fallback: 2 pages -> 2 basic tests + 1 monkey = 3
    // Total = 7
    const plans = await generator.generateTestPlan(surfaceMap);
    expect(plans.length).toBe(7);
  });
});
