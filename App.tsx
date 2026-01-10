
import React, { useState } from 'react';
import { AppState, StoryboardItem, StoryboardProject } from './types';
import { expandSceneToFrames, generateSceneImageWithProjectStyle, generateSceneAudioFromConfig } from './services/geminiService';
import ScriptInput from './components/ScriptInput';
import StoryboardCard from './components/StoryboardCard';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [items, setItems] = useState<StoryboardItem[]>([]);
  const [projectInfo, setProjectInfo] = useState<StoryboardProject | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processInput = async (text: string) => {
    try {
      setError(null);
      setAppState(AppState.PARSING);
      setItems([]);

      let project: StoryboardProject;
      try {
        project = JSON.parse(text);
        if (!project.scenes || !project.style || !project.character_identity) {
          throw new Error("Missing critical project fields (scenes, style, or character_identity).");
        }
        setProjectInfo(project);
      } catch (e: any) {
        throw new Error(e.message || "Invalid Project JSON. Please provide the full story metadata.");
      }

      setAppState(AppState.GENERATING);
      
      let allExpandedBeats: StoryboardItem[] = [];
      
      // 1. Expansion phase - Sequential with small throttle
      for (let i = 0; i < project.scenes.length; i++) {
        const scene = project.scenes[i];
        const expanded = await expandSceneToFrames(project, scene);
        const skeleton = expanded.map(beat => ({
          ...beat,
          scene_id: scene.scene_id,
          isGenerating: true,
          isAudioGenerating: true,
          audioConfig: scene.audio
        }));
        allExpandedBeats = [...allExpandedBeats, ...skeleton];
        
        // Brief pause between scene expansions
        if (i < project.scenes.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      setItems(allExpandedBeats);

      // 2. Asset generation - STRICTLY SEQUENTIAL to minimize concurrent quota usage
      let globalLastImage: string | undefined = undefined;
      for (let i = 0; i < allExpandedBeats.length; i++) {
        try {
          const beat = allExpandedBeats[i];
          
          // Generate Image FIRST
          const imageUrl = await generateSceneImageWithProjectStyle(beat.visualPrompt, beat.mood, project, globalLastImage);
          
          setItems(prev => prev.map((item, idx) => 
            idx === i ? { ...item, imageUrl, isGenerating: false } : item
          ));

          // Then generate Audio (sequential call instead of Promise.all)
          const audioUrl = await generateSceneAudioFromConfig(beat.audioScript, beat.mood, beat.audioConfig);

          setItems(prev => prev.map((item, idx) => 
            idx === i ? { ...item, audioUrl: audioUrl || undefined, isAudioGenerating: false } : item
          ));

          if (imageUrl.includes('base64,')) {
            globalLastImage = imageUrl.split('base64,')[1];
          }

          // Throttle: Significant delay between frames to stay under rate limits
          if (i < allExpandedBeats.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 3000));
          }
        } catch (err: any) {
          console.error(`Frame ${i} failed`, err);
          setItems(prev => prev.map((item, idx) => 
            idx === i ? { ...item, isGenerating: false, isAudioGenerating: false, error: err.message || "Resource limit reached" } : item
          ));
        }
      }

      setAppState(AppState.COMPLETE);
    } catch (err: any) {
      setError(err.message || "An unexpected error occurred.");
      setAppState(AppState.ERROR);
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setItems([]);
    setProjectInfo(null);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-200 pb-20">
      <nav className="sticky top-0 z-50 bg-slate-950/80 backdrop-blur-xl border-b border-slate-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center shadow-lg">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polygon points="10 8 16 12 10 16 10 8"/></svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white">Director<span className="text-orange-500">AI</span></h1>
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">Master Narrative Mode</p>
            </div>
          </div>
          {(appState === AppState.COMPLETE || appState === AppState.GENERATING) && (
            <button onClick={handleReset} className="text-xs font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest">New Production</button>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 mt-12">
        {projectInfo && (
           <div className="mb-12 border-l-4 border-orange-500 pl-6 py-2">
              <h2 className="text-4xl font-serif text-white">{projectInfo.project_title}</h2>
              <div className="flex flex-wrap gap-4 mt-2">
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-900 px-3 py-1 rounded-full border border-slate-800">{projectInfo.style.genre}</span>
                 <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest bg-orange-500/10 px-3 py-1 rounded-full border border-orange-500/20">{projectInfo.language}</span>
                 <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest bg-slate-900 px-3 py-1 rounded-full border border-slate-800">{projectInfo.style.aspect_ratio}</span>
              </div>
           </div>
        )}

        {appState === AppState.IDLE && (
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-serif text-white max-w-3xl mx-auto leading-tight">
              Transform your <span className="text-orange-500 italic">detailed script</span> into vision.
            </h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto font-bold uppercase tracking-widest">
              Upload your complete Project JSON with identity and dialogue metadata.
            </p>
          </div>
        )}

        {(appState === AppState.IDLE || appState === AppState.PARSING) && (
          <ScriptInput onProcess={(text) => processInput(text)} isLoading={appState === AppState.PARSING} />
        )}

        {(appState === AppState.GENERATING || appState === AppState.COMPLETE) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            {items.map((item, index) => (
              <StoryboardCard key={index} item={item} />
            ))}
          </div>
        )}

        {appState === AppState.GENERATING && items.length === 0 && (
           <div className="flex flex-col items-center justify-center py-20 gap-4">
              <div className="w-16 h-16 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
              <p className="text-sm font-black text-slate-500 uppercase tracking-[0.2em] animate-pulse">Director is analyzing script structure...</p>
           </div>
        )}

        {appState === AppState.ERROR && (
          <div className="max-w-2xl mx-auto text-center py-20 bg-red-900/10 border border-red-500/20 rounded-3xl p-8">
            <h3 className="text-xl font-bold text-white mb-2 uppercase tracking-widest">Production Halted</h3>
            <p className="text-red-400 text-sm mb-8">{error}</p>
            <button onClick={handleReset} className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-xl font-bold uppercase tracking-widest text-xs">Start Over</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
