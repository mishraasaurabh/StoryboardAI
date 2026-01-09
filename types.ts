
export interface Character {
  gender: string;
  age: string;
  voice: string;
}

export interface DialogueLine {
  speaker: string;
  text: string;
}

export interface ProjectStyle {
  genre: string;
  visual_style: string;
  lighting: string;
  camera: string;
  color_grading: string;
  aspect_ratio: string;
}

export interface Scene {
  scene_id: number;
  duration_sec: number;
  frames: number;
  audio_speaker?: string;
  audio_text?: string;
  audio_dialogue?: DialogueLine[];
  visual_prompt: string;
}

export interface StoryboardProject {
  project_title: string;
  language: string;
  style: ProjectStyle;
  characters: Record<string, Character>;
  scenes: Scene[];
}

export interface SceneBeat {
  sceneNumber: number;
  location: string;
  timeOfDay: string;
  description: string;
  visualPrompt: string;
  audioScript: string; 
  mood: string;
  dialogue?: DialogueLine[];
}

export interface StoryboardItem extends SceneBeat {
  imageUrl?: string;
  audioUrl?: string;
  isGenerating: boolean;
  isAudioGenerating?: boolean;
  error?: string;
  scene_id: number; // reference to parent scene
}

export enum AppState {
  IDLE = 'IDLE',
  PARSING = 'PARSING',
  GENERATING = 'GENERATING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}
