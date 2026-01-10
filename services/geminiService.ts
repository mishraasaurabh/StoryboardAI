
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { SceneBeat, StoryboardProject, Scene, AudioConfig, DialogueEntry } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

/**
 * Helper to retry a function if it fails due to rate limiting (429) or transient server errors (500).
 */
async function withRetry<T>(fn: () => Promise<T>, maxRetries = 5, initialDelay = 5000): Promise<T> {
  let lastError: any;
  for (let i = 0; i <= maxRetries; i++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      const errorStr = JSON.stringify(err).toUpperCase();
      
      // Check for both Rate Limits (429) and Internal Server Errors (500)
      const isRetryable = 
        errorStr.includes('429') || 
        errorStr.includes('RESOURCE_EXHAUSTED') || 
        errorStr.includes('QUOTA') ||
        errorStr.includes('500') ||
        errorStr.includes('INTERNAL') ||
        (err?.message && (err.message.includes('429') || err.message.includes('500'))) || 
        (err?.status === 'RESOURCE_EXHAUSTED' || err?.status === 'INTERNAL');

      if (isRetryable && i < maxRetries) {
        const delay = initialDelay * Math.pow(2, i); // Exponential backoff: 5s, 10s, 20s, 40s, 80s
        console.warn(`Transient error encountered (${err?.status || 'Error'}). Retrying in ${delay}ms... (Attempt ${i + 1}/${maxRetries})`);
        await new Promise(resolve => setTimeout(resolve, delay));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

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
  view.setUint16(20, 1, true); 
  view.setUint16(22, 1, true); 
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); 
  view.setUint16(32, 2, true); 
  view.setUint16(34, 16, true); 
  writeString(36, 'data');
  view.setUint32(40, pcmData.length, true);
  return new Blob([header, pcmData], { type: 'audio/wav' });
}

export const expandSceneToFrames = async (project: StoryboardProject, scene: Scene): Promise<SceneBeat[]> => {
  return withRetry(async () => {
    const targetFrames = Math.min(scene.frames || 4, 12); 
    
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: `You are a film director. Expand Scene ${scene.scene_id} into ${targetFrames} storyboard frames.
      
      PROJECT CONTEXT:
      Title: ${project.project_title}
      Language: ${project.language}
      Visual Style: ${project.style.visual_style}
      Lighting: ${project.style.lighting}
      Color Grading: ${project.style.color_grading}
      
      CHARACTER IDENTITIES (Use these for descriptions):
      ${JSON.stringify(project.character_identity)}
      
      SCENE DATA:
      Base Visual Prompt: ${scene.visual_prompt}
      Audio/Dialogue: ${JSON.stringify(scene.audio)}
      
      INSTRUCTIONS:
      1. Divide the scene into ${targetFrames} progressive visual beats.
      2. Split the dialogue/narration across the beats in 'audioScript' (original language).
      3. Ensure 'visualPrompt' includes character physical traits from Character Identities.
      4. Output a JSON array of ${targetFrames} objects.`,
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
              audioScript: { type: Type.STRING },
              mood: { type: Type.STRING },
            },
            required: ["sceneNumber", "location", "timeOfDay", "description", "visualPrompt", "audioScript", "mood"],
          },
        },
      },
    });

    try {
      const text = response.text;
      if (!text) throw new Error("Empty response during expansion");
      return JSON.parse(text.trim()).slice(0, targetFrames);
    } catch (error) {
      throw new Error(`Failed to parse scene expansion for Scene ${scene.scene_id}`);
    }
  });
};

const VOICE_MAP: Record<string, string> = {
  mother: 'Kore',
  father: 'Charon',
  son: 'Puck',
  narrator: 'Fenrir'
};

export const generateSceneAudioFromConfig = async (text: string, mood: string, config?: AudioConfig): Promise<string> => {
  if (!text) return "";

  return withRetry(async () => {
    const dialogues = config?.dialogues || (config?.dialogue ? [config.dialogue] : []);
    const uniqueSpeakers = Array.from(new Set(dialogues.map(d => d.speaker.toLowerCase())));

    if (uniqueSpeakers.length === 2 && dialogues.length >= 2) {
      const prompt = `TTS this conversation naturally:\n` + dialogues.map(d => `${d.speaker}: ${d.text}`).join('\n');
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash-preview-tts",
        contents: [{ parts: [{ text: prompt }] }],
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            multiSpeakerVoiceConfig: {
              speakerVoiceConfigs: uniqueSpeakers.map(s => ({
                speaker: s,
                voiceConfig: { prebuiltVoiceConfig: { voiceName: VOICE_MAP[s] || 'Kore' } }
              }))
            }
          },
        },
      });
      const data = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
      return data ? URL.createObjectURL(pcmToWav(decodeBase64(data))) : "";
    }

    let selectedVoice = 'Kore';
    if (dialogues.length > 0) {
      selectedVoice = VOICE_MAP[dialogues[0].speaker.toLowerCase()] || 'Kore';
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Read with ${mood} tone: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: selectedVoice },
          },
        },
      },
    });
    const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64 ? URL.createObjectURL(pcmToWav(decodeBase64(base64))) : "";
  });
};

export const generateSceneImageWithProjectStyle = async (visualPrompt: string, mood: string, project: StoryboardProject, refImage?: string): Promise<string> => {
  return withRetry(async () => {
    const parts: any[] = [];
    if (refImage) {
      parts.push({ inlineData: { data: refImage.replace(/\s/g, ''), mimeType: "image/png" } });
    }

    const negativePrompt = project.negative_prompt.join(", ");
    const styleStr = `Genre: ${project.style.genre}. Visual: ${project.style.visual_style}. Lighting: ${project.style.lighting}. Color: ${project.style.color_grading}.`;
    
    const enhancedPrompt = `
      ${styleStr} 
      Cinematic professional storyboard concept art. 
      Mood: ${mood}. 
      Character Detail: ${JSON.stringify(project.character_identity)}.
      Scene: ${visualPrompt}. 
      Negative constraints (DO NOT SHOW): ${negativePrompt}.
    `;

    parts.push({ text: enhancedPrompt });

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts },
      config: { 
        imageConfig: { aspectRatio: project.style.aspect_ratio as any || "16:9" } 
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
    }
    throw new Error("No image data returned from generator.");
  });
};
