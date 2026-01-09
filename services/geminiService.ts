
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { SceneBeat, MultimodalInput } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

// Helper for base64 decoding
function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

/**
 * Converts raw PCM 16-bit audio data to a playable WAV Blob.
 */
function pcmToWav(pcmData: Uint8Array, sampleRate: number = 24000): Blob {
  const header = new ArrayBuffer(44);
  const view = new DataView(header);

  const writeString = (offset: number, string: string) => {
    for (let i = 0; i < string.length; i++) {
      view.setUint8(offset + i, string.charCodeAt(i));
    }
  };

  writeString(0, 'RIFF');
  view.setUint32(4, 36 + pcmData.length, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true);
  view.setUint16(20, 1, true); // PCM format
  view.setUint16(22, 1, true); // Mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // Byte rate
  view.setUint16(32, 2, true); // Block align
  view.setUint16(34, 16, true); // Bits per sample
  writeString(36, 'data');
  view.setUint32(40, pcmData.length, true);

  return new Blob([header, pcmData], { type: 'audio/wav' });
}

export const expandToEightFrames = async (input: MultimodalInput): Promise<SceneBeat[]> => {
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `You are an award-winning film director. Expand the following input beat into a cinematic 8-frame storyboard sequence. 
    
    SOURCE INPUT:
    Visual/Shot Description: ${input.image}
    Narration/Script (Original Language): ${input.audio}

    INSTRUCTIONS:
    1. Narrative Flow: Divide the provided narration across exactly 8 frames. 
    2. LANGUAGE CONSISTENCY: The 'audioScript' MUST be in the same language as the input narration (e.g., Hindi). DO NOT translate it to English in the 'audioScript' field.
    3. NO EMPTY SCRIPTS: Every single frame MUST have some text in 'audioScript'. If the narration is short, repeat key phrases or add descriptive emotional sounds (e.g. "[Sobbing]", "[Silence, heavy breathing]") to ensure the field is never empty.
    4. Visual progression: Ensure each frame's 'visualPrompt' describes a distinct cinematic angle (Wide, Close-up, POV, etc.) while keeping characters consistent.

    Output as a JSON array of 8 objects.`,
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
            audioScript: { type: Type.STRING, description: "Narration text for this frame. MUST NOT BE EMPTY." },
            mood: { type: Type.STRING },
          },
          required: ["sceneNumber", "location", "timeOfDay", "description", "visualPrompt", "audioScript", "mood"],
        },
      },
    },
  });

  try {
    const text = response.text;
    if (!text) throw new Error("No response from Director AI");
    const beats = JSON.parse(text.trim());
    return beats.slice(0, 8);
  } catch (error) {
    console.error("Failed to expand frames:", error);
    throw new Error("Director failed to expand sequence.");
  }
};

export const generateSceneAudio = async (text: string, mood: string): Promise<string> => {
  if (!text || text.trim().length === 0) {
    console.warn("Empty text provided for audio generation. Skipping.");
    return "";
  }

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Read with ${mood} emotion: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });

    const base64Audio = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    if (!base64Audio) {
      console.warn("TTS API returned success but no audio data part.");
      return "";
    }

    const pcmBytes = decodeBase64(base64Audio);
    const wavBlob = pcmToWav(pcmBytes);
    return URL.createObjectURL(wavBlob);
  } catch (err) {
    console.error("Audio generation error:", err);
    return ""; // Return empty string so the UI can still show the frame without audio
  }
};

export const generateSceneImage = async (visualPrompt: string, mood: string, referenceImageBase64?: string): Promise<string> => {
  const parts: any[] = [];
  
  // Sanitize reference image
  if (referenceImageBase64 && referenceImageBase64.length > 10) {
    parts.push({ 
      inlineData: { 
        data: referenceImageBase64.replace(/\s/g, ''), 
        mimeType: "image/png" 
      } 
    });
  }

  const enhancedPrompt = `High-end cinematic storyboard frame. Style: Professional movie concept art, digital painting, dramatic lighting, detailed textures, 8k resolution. Character consistency maintained. Mood: ${mood}. Scene: ${visualPrompt}`;
  parts.push({ text: enhancedPrompt });

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: { 
        imageConfig: { aspectRatio: "16:9" } 
      },
    });

    const candidates = response.candidates;
    if (!candidates || candidates.length === 0) throw new Error("Safety filters blocked image generation.");

    for (const part of candidates[0].content.parts) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    throw new Error("No image data in response.");
  } catch (err) {
    console.error("Image generation error:", err);
    throw err; // Re-throw to show error state in the specific card
  }
};
