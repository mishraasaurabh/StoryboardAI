
import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";
import { SceneBeat } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const parseScript = async (scriptText: string): Promise<SceneBeat[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `Analyze the following script and extract the most important 6-8 visual beats for a storyboard. For each beat, provide a clear scene description and a high-quality visual prompt for an image generator (describe lighting, camera angle, characters, and environment). 

Script:
${scriptText}`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            sceneNumber: { type: Type.INTEGER },
            location: { type: Type.STRING },
            timeOfDay: { type: Type.STRING },
            description: { type: Type.STRING },
            visualPrompt: { type: Type.STRING },
            mood: { type: Type.STRING },
          },
          required: ["sceneNumber", "location", "timeOfDay", "description", "visualPrompt", "mood"],
        },
      },
    },
  });

  try {
    const text = response.text;
    if (!text) throw new Error("No response from AI");
    return JSON.parse(text.trim()) as SceneBeat[];
  } catch (error) {
    console.error("Failed to parse AI response:", error);
    throw new Error("Could not parse script beats. Ensure your script is clear.");
  }
};

export const generateSceneImage = async (visualPrompt: string, mood: string, referenceImageBase64?: string): Promise<string> => {
  // If we have a reference image, we tell the model to maintain consistency.
  const consistencyInstruction = referenceImageBase64 
    ? "Maintain identical character appearance, clothing, and artistic style from the attached reference image." 
    : "Establish a clear character design and cinematic style.";

  const enhancedPrompt = `Cinematic storyboard frame, professional movie concept art. 
    Style: Digital painting, atmospheric lighting, detailed textures. 
    Mood: ${mood}. 
    Instruction: ${consistencyInstruction}
    Scene details: ${visualPrompt}`;
  
  const parts: any[] = [{ text: enhancedPrompt }];

  // Add the reference image as part of the prompt if it exists
  if (referenceImageBase64) {
    parts.unshift({
      inlineData: {
        data: referenceImageBase64,
        mimeType: "image/png"
      }
    });
  }

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: {
      parts: parts,
    },
    config: {
      imageConfig: {
        aspectRatio: "16:9",
      }
    }
  });

  // Iterate through parts to find the image
  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }

  throw new Error("No image data returned from generator");
};
