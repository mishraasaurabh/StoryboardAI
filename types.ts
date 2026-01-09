
export interface SceneBeat {
  sceneNumber: number;
  location: string;
  timeOfDay: string;
  description: string;
  visualPrompt: string;
  mood: string;
}

export interface StoryboardItem extends SceneBeat {
  imageUrl?: string;
  isGenerating: boolean;
  error?: string;
}

export enum AppState {
  IDLE = 'IDLE',
  PARSING = 'PARSING',
  GENERATING = 'GENERATING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}
