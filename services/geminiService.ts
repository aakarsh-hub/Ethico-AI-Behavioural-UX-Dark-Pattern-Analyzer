import { GoogleGenAI, Type, Schema } from "@google/genai";
import { AnalysisResult } from "../types";

// Define the response schema for structured JSON output
const analysisSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    overallTrustScore: {
      type: Type.NUMBER,
      description: "A score from 0 to 100 indicating how trustworthy the UX is.",
    },
    darkPatternRiskScore: {
      type: Type.NUMBER,
      description: "A score from 0 to 100 indicating the severity of dark patterns detected.",
    },
    regulatoryRisks: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: "List of potential legal or compliance risks (e.g., GDPR, FTC).",
    },
    executiveSummary: {
      type: Type.STRING,
      description: "A concise executive summary of the audit findings.",
    },
    detections: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          patternName: { type: Type.STRING, description: "Name of the dark pattern (e.g., False Urgency)." },
          description: { type: Type.STRING, description: "Brief description of where and what the pattern is." },
          severity: { type: Type.STRING, enum: ["High", "Medium", "Low"] },
          confidence: { type: Type.NUMBER, description: "Confidence score 0-100." },
          boundingBox: {
            type: Type.ARRAY,
            items: { type: Type.NUMBER },
            description: "Coordinates [ymin, xmin, ymax, xmax] normalized to 0-1000 scale.",
          },
          psychology: {
            type: Type.OBJECT,
            properties: {
              bias: { type: Type.STRING, description: "Cognitive bias exploited (e.g., Scarcity Bias)." },
              effect: { type: Type.STRING, description: "Intended psychological effect on the user." },
              emotion: { type: Type.STRING, description: "Likely emotion induced (e.g., Anxiety)." },
            },
            required: ["bias", "effect", "emotion"],
          },
          redesign: {
            type: Type.OBJECT,
            properties: {
              suggestion: { type: Type.STRING, description: "Specific copy or layout change." },
              principle: { type: Type.STRING, description: "Ethical principle applied." },
              impact: { type: Type.STRING, description: "Expected impact on trust and conversion." },
            },
            required: ["suggestion", "principle", "impact"],
          },
        },
        required: ["patternName", "description", "severity", "confidence", "boundingBox", "psychology", "redesign"],
      },
    },
  },
  required: ["overallTrustScore", "darkPatternRiskScore", "regulatoryRisks", "executiveSummary", "detections"],
};

export const analyzeScreenshot = async (base64Image: string): Promise<AnalysisResult> => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key is missing. Please check your environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey });

  const prompt = `
    You are an expert Senior UX Auditor and Behavioral Scientist specializing in 'Dark Patterns' and Ethical Design.
    
    Analyze the provided screenshot of a user interface. 
    Identify any dark patterns, deceptive design tactics, or manipulative UX elements.
    
    For each detection:
    1. Identify the specific pattern name (e.g., Confirmshaming, Roach Motel, Forced Continuity, Sneak into Basket).
    2. Estimate the bounding box [ymin, xmin, ymax, xmax] on a 0-1000 scale.
    3. Explain the cognitive bias being exploited (e.g., Loss Aversion, Default Bias).
    4. Propose a concrete ethical redesign that improves trust without destroying business viability.
    
    Also provide a 'Trust Score' and a 'Risk Score' based on the severity of findings.
    If no dark patterns are found, provide a high trust score and note the good practices.
    
    Return the response strictly in JSON format matching the schema.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/png",
              data: base64Image,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: analysisSchema,
        temperature: 0.2, // Low temperature for analytical precision
      },
    });

    const text = response.text;
    if (!text) throw new Error("No response generated");

    const result = JSON.parse(text) as AnalysisResult;
    
    // Post-process to ensure IDs exist for React keys if needed, though index can be used.
    // Adding synthetic IDs for better React handling
    const processedResult = {
      ...result,
      detections: result.detections.map((d, i) => ({
        ...d,
        id: `detect-${Date.now()}-${i}`,
      })),
    };

    return processedResult;
  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    throw error;
  }
};
