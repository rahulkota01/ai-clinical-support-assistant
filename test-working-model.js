import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyCMXsc7gUFstVpPdMX8YqRgqOYRlkIwoXk";

async function testWorkingModel() {
  console.log("Testing with correct API endpoint format...");
  
  try {
    // The correct API endpoint for Gemini models
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${API_KEY}`;
    
    const requestBody = {
      contents: [{
        parts: [{
          text: "Hello, respond briefly with 'API working!'"
        }]
      }]
    };
    
    console.log("Making request to:", url);
    console.log("Request body:", JSON.stringify(requestBody, null, 2));
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    });
    
    console.log("Response status:", response.status);
    console.log("Response headers:", Object.fromEntries(response.headers.entries()));
    
    const data = await response.json();
    console.log("Response data:", JSON.stringify(data, null, 2));
    
    if (response.ok && data.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.log("✅ SUCCESS! Response:", data.candidates[0].content.parts[0].text);
    } else {
      console.log("❌ Failed:", data.error?.message || "Unknown error");
    }
    
  } catch (error) {
    console.error("Fatal error:", error);
  }
}

testWorkingModel();
