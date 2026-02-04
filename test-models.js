import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config';

const API_KEY = process.env.GEMINI_API_KEY || "AIzaSyCMXsc7gUFstVpPdMX8YqRgqOYRlkIwoXk";

async function testAvailableModels() {
  console.log("Testing with API Key:", API_KEY ? "Present" : "Missing");
  
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    
    // Try to list models first
    console.log("\n--- Attempting to list models ---");
    try {
      const models = await genAI.listModels();
      console.log("✅ Models found:");
      models.forEach(model => {
        console.log(`- ${model.name}: ${model.description}`);
        console.log(`  Methods: ${model.supportedGenerationMethods?.join(', ')}`);
      });
    } catch (error) {
      console.log("❌ Could not list models:", error.message);
    }

    const modelsToTest = [
      "gemini-1.5-flash-latest",
      "gemini-1.5-flash-001", 
      "gemini-1.5-flash-002",
      "gemini-1.5-flash-8b",
      "gemini-1.5-pro-latest",
      "gemini-1.5-pro-001",
      "gemini-1.5-pro-002",
      "text-embedding-004",
      "embedding-001"
    ];

    console.log("\n--- Testing individual models ---");
    for (const modelName of modelsToTest) {
      try {
        console.log(`Testing ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello, respond briefly");
        const response = await result.response;
        console.log(`✅ ${modelName}: ${response.text().substring(0, 100)}...`);
        break; // Stop at first successful model
      } catch (error) {
        console.log(`❌ ${modelName}: ${error.message.split(',')[0]}`);
      }
    }

  } catch (error) {
    console.error("Fatal error:", error);
  }
}

testAvailableModels();
