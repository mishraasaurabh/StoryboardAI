
import { GoogleGenAI, Type, Modality } from "@google/genai";
import { SceneBeat, StoryboardProject, Scene, DialogueLine } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

function decodeBase64(base64: string): Uint8Array {
  const binaryString = atob(base64);
  const bytes = new Uint8Array(binaryString.length);
  for (let i = 0; i < binaryString.length; i++) {
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
  const targetFrames = Math.min(scene.frames || 4, 8); // Cap at 8 for performance
  
  const response = await ai.models.generateContent({
    model: 'gemini-3-pro-preview',
    contents: `You are a film director. Expand Scene ${scene.scene_id} into ${targetFrames} storyboard frames.
    
    PROJECT INFO:
    Title: ${project.project_title}
    Language: ${project.language}
    Visual Style: ${project.style.visual_style}
    Lighting: ${project.style.lighting}
    Color Grading: ${project.style.color_grading}
    
    SCENE DATA:
    Visual Prompt: ${scene.visual_prompt}
    Audio/Dialogue: ${JSON.stringify(scene.audio_dialogue || scene.audio_text)}
    
    INSTRUCTIONS:
    1. Narrative: Divide the scene into ${targetFrames} progressive visual beats.
    2. Dialogue: If there is dialogue, assign specific lines or reactions to each frame in 'audioScript'. Keep the original language.
    3. Consistency: Ensure character descriptions match project info.
    4. Frames: Output exactly ${targetFrames} objects in a JSON array.`,
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
    return JSON.parse(response.text || '[]').slice(0, targetFrames);
  } catch (error) {
    throw new Error(`Failed to expand Scene ${scene.scene_id}`);
  }
};

const VOICE_MAP: Record<string, string> = {
  mother: 'Kore',
  father: 'Charon',
  son: 'Puck',
  narrator: 'Fenrir'
};

export const generateSceneAudioMulti = async (text: string, mood: string, dialogue?: DialogueLine[]): Promise<string> => {
  if (!text && (!dialogue || dialogue.length === 0)) return "";

  try {
    // If we have multi-speaker dialogue and exactly 2 speakers (per API rules), use multi-speaker mode
    const uniqueSpeakers = Array.from(new Set(dialogue?.map(d => d.speaker.toLowerCase()) || []));
    
    if (dialogue && dialogue.length > 0 && uniqueSpeakers.length === 2) {
      const prompt = `TTS the following conversation:\n` + dialogue.map(d => `${d.speaker}: ${d.text}`).join('\n');
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

    // Default to single speaker narration
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash-preview-tts",
      contents: [{ parts: [{ text: `Read with ${mood} tone: ${text}` }] }],
      config: {
        responseModalities: [Modality.AUDIO],
        speechConfig: {
          voiceConfig: {
            prebuiltVoiceConfig: { voiceName: 'Kore' },
          },
        },
      },
    });
    const base64 = response.candidates?.[0]?.content?.parts?.[0]?.inlineData?.data;
    return base64 ? URL.createObjectURL(pcmToWav(decodeBase64(base64))) : "";
  } catch (err) {
    return "";
  }
};

export const generateSceneImageWithStyle = async (visualPrompt: string, mood: string, project: StoryboardProject, refImage?: string): Promise<string> => {
  const parts: any[] = [];
  if (refImage) parts.push({ inlineData: { data: refImage.replace(/\s/g, ''), mimeType: "image/png" } });

  const styleStr = `Style: ${project.style.visual_style}. Lighting: ${project.style.lighting}. Color: ${project.style.color_grading}. Aspect: ${project.style.aspect_ratio}.`;
  const enhancedPrompt = `${styleStr} Cinematic storyboard. Mood: ${mood}. Character descriptions: ${JSON.stringify(project.characters)}. Scene: ${visualPrompt}`;
  parts.push({ text: enhancedPrompt });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash-image',
    contents: { parts },
    config: { imageConfig: { aspectRatio: project.style.aspect_ratio as any || "16:9" } },
  });

  for (const part of response.candidates?.[0]?.content?.parts || []) {
    if (part.inlineData) return `data:image/png;base64,${part.inlineData.data}`;
  }
  throw new Error("Safety filters or API error.");
};
