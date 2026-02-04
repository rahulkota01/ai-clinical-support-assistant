import { GoogleGenerativeAI } from "@google/generative-ai";
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const API_KEY = process.env.VITE_GEMINI_API_KEY;

console.log("API Key found:", API_KEY ? "Yes" : "No");
console.log("API Key length:", API_KEY ? API_KEY.length : 0);

if (!API_KEY) {
  console.error("❌ VITE_GEMINI_API_KEY is not set in .env.local file.");
  process.exit(1);
}

async function testGemini() {
  console.log("🔍 Testing Gemini API with your key...");

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);

    console.log("✅ Gemini client created successfully");

    // Test with the simplest possible model
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    console.log("✅ Model created successfully");

    const result = await model.generateContent("Hello");
    const response = await result.response;
    const text = response.text();

    console.log("✅ SUCCESS! Response:", text);

  } catch (error) {
    console.error("❌ ERROR:", error.message);
    console.error("Full error:", error);
  }
}

testGemini();
