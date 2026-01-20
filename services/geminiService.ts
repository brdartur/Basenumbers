import { GoogleGenAI } from "@google/genai";
import { Grid } from "../types";

export const getBestMove = async (grid: Grid): Promise<{ direction: string; reasoning: string }> => {
  // This assumes API_KEY is set in environment. In a real dApp this is tricky, 
  // but we follow the strict instructions to use process.env.API_KEY.
  if (!process.env.API_KEY) {
    throw new Error("API Key not found");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  const prompt = `
    You are a Grandmaster at the game 2048.
    Here is the current board configuration (0 represents empty space):
    ${JSON.stringify(grid)}
    
    Analyze the board carefully. 
    1. Identify the corner where the largest tile is being built.
    2. Suggest the absolute best next move (UP, DOWN, LEFT, RIGHT).
    3. Provide a very short, punchy reason (max 10 words).
    
    Output JSON format: { "direction": "UP", "reasoning": "Merge 16s to clear top row." }
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-latest",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from AI");
    
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini Error:", error);
    return { direction: "UNKNOWN", reasoning: "My circuits are busy. Follow your gut!" };
  }
};