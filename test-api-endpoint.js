import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyCMXsc7gUFstVpPdMX8YqRgqOYRlkIwoXk";

async function testDirectAPI() {
  console.log("Testing direct API call...");
  
  try {
    // Test with different API versions
    const versions = ["v1beta", "v1"];
    
    for (const version of versions) {
      console.log(`\n--- Testing API version: ${version} ---`);
      
      // Try different model names
      const models = [
        "gemini-1.5-flash",
        "gemini-1.5-pro", 
        "gemini-pro",
        "gemini-pro-vision"
      ];
      
      for (const model of models) {
        try {
          const url = `https://generativelanguage.googleapis.com/${version}/models/${model}:generateContent?key=${API_KEY}`;
          
          const response = await fetch(url, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              contents: [{
                parts: [{
                  text: "Hello, respond briefly"
                }]
              }]
            })
          });
          
          if (response.ok) {
            const data = await response.json();
            console.log(`✅ SUCCESS with ${version}/${model}:`, data.candidates?.[0]?.content?.parts?.[0]?.text?.substring(0, 100));
            return; // Stop on first success
          } else {
            const errorData = await response.json();
            console.log(`❌ ${version}/${model}: ${response.status} - ${errorData.error?.message || response.statusText}`);
          }
        } catch (error) {
          console.log(`❌ ${version}/${model}: ${error.message}`);
        }
      }
    }
    
  } catch (error) {
    console.error("Fatal error:", error);
  }
}

testDirectAPI();
