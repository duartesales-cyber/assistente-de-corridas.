/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */
import { GoogleGenAI, Type } from "@google/genai";
import { RideAnalysis, AnalysisVerdict } from "../types";

// @ts-ignore - Ignora o erro de leitura do env para o Cursor parar de reclamar
const apiKey = (import.meta as any).env.VITE_GEMINI_API_KEY;
const ai = new GoogleGenAI({ apiKey });

const ANALYSIS_PROMPT = `
Analyze the provided screenshot of a ride-share or delivery request (like Uber, Lyft, DoorDash, UberEats, etc.).
Extract the total payout value, the distance (in miles or kilometers), and the estimated duration.
Be precise. If distance is in km, specify that.
Rules for verdict:
- Earnings per mile >= 2.00: GOOD
- Earnings per mile between 1.50 and 1.99: AVERAGE
- Earnings per mile < 1.50: POOR
Return a JSON object following the schema.`;

export async function analyzeRideScreenshot(base64Image: string, mimeType: string): Promise<RideAnalysis> {
  const model = "gemini-2.0-flash";
  
  // Usando o formato .models.generateContent que o seu projeto reconhece
  const response = await ai.models.generateContent({
    model,
    contents: {
      parts: [
        { inlineData: { data: base64Image.split(',')[1] || base64Image, mimeType } },
        { text: ANALYSIS_PROMPT }
      ]
    },
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          value: { type: Type.NUMBER, description: "Total payout value" },
          distance: { type: Type.NUMBER, description: "Total distance" },
          duration: { type: Type.NUMBER, description: "Estimated duration in minutes" },
          service: { type: Type.STRING, description: "Platform name (Uber, Lyft, etc)" },
          currency: { type: Type.STRING, description: "Currency symbol" }
        },
        required: ["value", "distance"]
      }
    }
  });

  const text = response.text;
  if (!text) throw new Error("Could not analyze image");
  
  const data = JSON.parse(text);
  const perMile = data.value / data.distance;
  
  let verdict = AnalysisVerdict.POOR;
  if (perMile >= 2) {
    verdict = AnalysisVerdict.GOOD;
  } else if (perMile >= 1.5) {
    verdict = AnalysisVerdict.AVERAGE;
  }

  return {
    ...data,
    perMile,
    verdict,
    currency: data.currency || "$"
  };
}