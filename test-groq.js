require('dotenv').config();
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
async function main() {
  try {
    const res = await groq.chat.completions.create({
      messages: [{ role: "user", content: "hello" }],
      model: "llama-3.2-11b-vision-preview"
    });
    console.log("Success:", res.choices[0].message.content);
  } catch (e) {
    console.error("Error:", e.message);
  }
}
main();
