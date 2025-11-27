import { GoogleGenAI } from "@google/genai";
import { Resource } from '../types';

export const generateSynthesis = async (moduleName: string, resources: Resource[]) => {
  // The API key is injected automatically by the platform after the user selects it via window.aistudio.openSelectKey()
  const apiKey = process.env.API_KEY;

  if (!apiKey) {
    console.warn("No API_KEY found. Returning mock synthesis.");
    return {
      summaryText: "This is a simulated summary because no API key was detected. Please ensure you have connected your Google account.",
      keyTakeaways: ["Always validate problems first.", "Data is your best friend.", "Communication is key.", "Prioritize ruthlessly.", "Ship to learn."],
      comprehensionQuestions: ["What is the main goal of this module?", "How does X relate to Y?", "Explain the concept of MVP."],
      practicalApplications: ["Conduct a user interview tomorrow.", "Draft a PRD for a small feature.", "Analyze a competitor's funnel."]
    };
  }

  const ai = new GoogleGenAI({ apiKey: apiKey });
  const model = "gemini-2.5-flash";

  const resourceText = resources
    .map(r => `Title: ${r.title}\nContent: ${r.extractedContent || r.userNotes || 'No content available.'}`)
    .join('\n\n---\n\n');

  const prompt = `
    Synthesize these learning materials for the module "${moduleName}" into a JSON object with the following structure:
    {
      "summaryText": "A concise summary (max 200 words)",
      "keyTakeaways": ["Array of 5 key takeaways"],
      "comprehensionQuestions": ["Array of 5 quiz-style questions to test understanding"],
      "practicalApplications": ["Array of 3 practical tasks for a Product Manager to apply this knowledge"]
    }

    Resources:
    ${resourceText}
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
      config: {
        responseMimeType: "application/json"
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response text");
    return JSON.parse(text);
  } catch (error) {
    console.error("Gemini API Error:", error);
    throw error;
  }
};