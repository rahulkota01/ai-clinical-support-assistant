const API_KEY = "AIzaSyCMXsc7gUFstVpPdMX8YqRgqOYRlkIwoXk";

async function listModels() {
  console.log("Listing available models...");
  
  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
    
    console.log("Making request to:", url);
    
    const response = await fetch(url);
    
    console.log("Response status:", response.status);
    
    const data = await response.json();
    console.log("Response data:", JSON.stringify(data, null, 2));
    
    if (response.ok && data.models) {
      console.log("\n✅ Available models:");
      data.models.forEach(model => {
        console.log(`- ${model.name}: ${model.description}`);
        console.log(`  Supported methods: ${model.supportedGenerationMethods?.join(', ')}`);
        console.log("");
      });
    } else {
      console.log("❌ Failed:", data.error?.message || "Unknown error");
    }
    
  } catch (error) {
    console.error("Fatal error:", error);
  }
}

listModels();
