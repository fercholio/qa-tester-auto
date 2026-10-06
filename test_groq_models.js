const Groq = require("groq-sdk");
require("dotenv").config();

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function testModels() {
  const modelsToTest = [
    "llama-3.1-8b-instant",
    "gemma2-9b-it",
    "llama-3.2-90b-vision-preview",
    "llama-3.2-11b-vision-preview",
    "llama-3.1-70b-versatile",
    "llama3-70b-8192",
    "mixtral-8x7b-32768"
  ];

  for (const model of modelsToTest) {
    try {
      await groq.chat.completions.create({
        messages: [{ role: "user", content: "hi" }],
        model: model,
      });
      console.log(`✅ Model works: ${model}`);
    } catch (e) {
      console.error(`❌ Model failed: ${model} - ${e.message}`);
    }
  }
}

testModels();
