
export interface VoiceMetadata {
  gender: string;
  age: string;
  accent: string;
  language: string;
  pitch: string;
  tone: string;
}

export interface DialogueEntry {
  speaker: string;
  voice: VoiceMetadata;
  text: string;
}

export interface AudioConfig {
  type: string;
  dialogue?: DialogueEntry;
  dialogues?: DialogueEntry[];
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
  visual_prompt: string;
  audio: AudioConfig;
}

export interface StoryboardProject {
  project_title: string;
  language: string;
  frame_logic: string;
  style: ProjectStyle;
  negative_prompt: string[];
  character_identity: Record<string, string>;
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
  audioConfig?: AudioConfig;
}

export interface StoryboardItem extends SceneBeat {
  imageUrl?: string;
  audioUrl?: string;
  isGenerating: boolean;
  isAudioGenerating?: boolean;
  error?: string;
  scene_id: number;
}

export enum AppState {
  IDLE = 'IDLE',
  PARSING = 'PARSING',
  GENERATING = 'GENERATING',
  COMPLETE = 'COMPLETE',
  ERROR = 'ERROR'
}
