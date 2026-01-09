
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
    
    The input may contain multilingual text (e.g., Hindi dialogue). Carefully translate and interpret the emotional subtext.
    
    SOURCE INPUT:
    Visual/Shot Description: ${input.image}
    Audio/Dialogue/Narration: ${input.audio}

    Each frame must represent a progressive visual beat:
    1. Framing: Opening shot/Context.
    2. Focus: Character reaction/Detail.
    3. Movement: Middle of the action.
    4. Emotion: The "turning point" of the beat.
    5. Detail: Close-up on a significant object or expression.
    6. Response: Secondary character or environment shift.
    7. Climax: The peak of this specific scene beat.
    8. Transition: Preparation for the next scene.

    Output must be a JSON array of 8 objects with character consistency.`,
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
    if (!text) throw new Error("No response from Director AI");
    const beats = JSON.parse(text.trim());
    return beats.slice(0, 8);
  } catch (error) {
    console.error("Failed to expand frames:", error);
    throw new Error("Director failed to expand the sequence into 8 frames.");
  }
};

export const generateSceneAudio = async (text: string, mood: string): Promise<string> => {
  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash-preview-tts",
    contents: [{ parts: [{ text: `Read the following with a ${mood} tone: ${text}` }] }],
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
  if (!base64Audio) throw new Error("No audio data generated");

  const pcmBytes = decodeBase64(base64Audio);
  const wavBlob = pcmToWav(pcmBytes);
  return URL.createObjectURL(wavBlob);
};

export const generateSceneImage = async (visualPrompt: string, mood: string, referenceImageBase64?: string): Promise<string> => {
  const parts: any[] = [];
  if (referenceImageBase64) {
    parts.push({ inlineData: { data: referenceImageBase64, mimeType: "image/png" } });
  }

  const enhancedPrompt = `High-end cinematic storyboard, professional movie concept art. Style: Digital painting, cinematic lighting, 8k resolution, photorealistic but artistic. Mood: ${mood}. Scene: ${visualPrompt}`;
  parts.push({ text: enhancedPrompt });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
    config: { 
      imageConfig: { 
        aspectRatio: "16:9" 
      } 
    },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) {
      return `data:image/png;base64,${part.inlineData.data}`;
    }
  }
  throw new Error("Image generation failed");
};
