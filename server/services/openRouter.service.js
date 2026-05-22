import { GoogleGenAI } from "@google/genai";
import dotenv from "dotenv";

dotenv.config(); 

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export const askAI = async (messages) => {
    try {
        const systemMessage = messages.find(m => m.role === "system")?.content || "";
        const userMessage = messages.find(m => m.role === "user")?.content || "";

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: userMessage,
            config: {
                systemInstruction: systemMessage,
                temperature: 0.7 
            }
        });

        return response.text;
    } catch (error) {
        console.error("Gemini API Error:", error);
        throw new Error("Failed to communicate with AI");
    }
};