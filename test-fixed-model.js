import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyCMXsc7gUFstVpPdMX8YqRgqOYRlkIwoXk";

async function testFixedModel() {
  console.log("Testing with updated model names...");
  
  try {
    const genAI = new GoogleGenerativeAI(API_KEY);
    
    const modelsToTest = [
      "gemini-2.5-flash",
      "gemini-2.0-flash",
      "gemini-flash-latest",
      "gemini-pro-latest"
    ];
    
    for (const modelName of modelsToTest) {
      try {
        console.log(`Testing ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello, respond briefly with 'API working!'");
        const response = await result.response;
        console.log(`✅ SUCCESS with ${modelName}:`, response.text());
        return; // Stop on first success
      } catch (error) {
        console.log(`❌ ${modelName}: ${error.message.split(',')[0]}`);
      }
    }
    
  } catch (error) {
    console.error("Fatal error:", error);
  }
}

testFixedModel();
