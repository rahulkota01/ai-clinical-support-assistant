import { GoogleGenerativeAI } from "@google/generative-ai";
import 'dotenv/config'; // To load environment variables from .env file

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("GEMINI_API_KEY is not set in your environment variables. Please create a .env file and add it.");
  process.exit(1);
}

async function testGemini() {
  console.log("Testing Gemini API...");

  try {
    const genAI = new GoogleGenerativeAI(API_KEY);

    // 1. List Available Models
    console.log("\n--- Listing Available Models ---");
    try {
      const models = await genAI.listModels();
      console.log("Available models:");
      models.forEach(model => {
        console.log(`- ${model.name}: ${model.description}`);
        console.log(`  Supported methods: ${model.supportedGenerationMethods?.join(', ')}`);
      });
    } catch (error) {
      console.log(`❌ Failed to list models: ${error.message}`);
    }

    // 2. Test Model Generation
    console.log("\n--- Testing Model Generation ---");

    const modelsToTest = [
      "gemini-pro",
      "gemini-1.5-flash",
      "gemini-1.5-pro",
      // These are likely to fail as they might not be public yet
      "gemini-2.0-flash",
      "gemini-2.0-flash-exp",
    ];

    for (const modelName of modelsToTest) {
      console.log(`\nTesting model: ${modelName}`);
      try {
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent("Hello, what can you do?");
        const response = await result.response;
        console.log(`✅ Success! Response: ${response.text()}`);
      } catch (error) {
        console.log(`❌ Failed: ${error.message}`);
      }
    }

    // 2. Test Chat Session
    console.log("\n\n--- Testing Chat Session with gemini-1.5-flash ---");
    try {
        const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const chat = model.startChat({
            history: [
                {
                    role: "user",
                    parts: [{ text: "Hello, I have a few questions for you." }],
                },
                {
                    role: "model",
                    parts: [{ text: "Great. I'm ready to answer." }],
                },
            ],
            generationConfig: {
                maxOutputTokens: 100,
            },
        });

        const msg = "What is the capital of France?";
        console.log(`> User: ${msg}`);
        const result = await chat.sendMessage(msg);
        const response = await result.response;
        const text = response.text();
        console.log(`> Gemini: ${text}`);

        const msg2 = "And what is its population?";
        console.log(`> User: ${msg2}`);
        const result2 = await chat.sendMessage(msg2);
        const response2 = await result2.response;
        const text2 = response2.text();
        console.log(`> Gemini: ${text2}`);
        console.log("✅ Chat session successful!");
    } catch (error) {
        console.log(`❌ Chat session failed: ${error.message}`);
    }

  } catch (error) {
    console.error("Fatal Error:", error);
  }
}

testGemini();
