
export interface SceneBeat {
  sceneNumber: number;
  location: string;
  timeOfDay: string;
  description: string;
  visualPrompt: string;
  audioScript: string; // Specific text for TTS
  mood: string;
}

export interface MultimodalInput {
  audio: string; // base64 or text
  image: string; // base64 or text
}

export interface StoryboardItem extends SceneBeat {
  imageUrl?: string;
  audioUrl?: string; // URL for generated TTS
  isGenerating: boolean;
  isAudioGenerating?: boolean;
  error?: string;
  // Source material for reference
  sourceImage?: string;
  sourceAudio?: string;
}

export enum AppState {
  IDLE = 'IDLE',
  PARSING = 'PARSING',
  GENERATING = 'GENERATING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}
