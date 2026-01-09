
import React, { useState } from 'react';
import { AppState, StoryboardItem, SceneBeat, MultimodalInput } from './types';
import { expandToEightFrames, generateSceneImage, generateSceneAudio } from './services/geminiService';
import ScriptInput from './components/ScriptInput';
import StoryboardCard from './components/StoryboardCard';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [items, setItems] = useState<StoryboardItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const processInput = async (text: string, isMultimodal: boolean) => {
    try {
      setError(null);
      setAppState(AppState.PARSING);
      setItems([]);

      let rawData: MultimodalInput[] = [];
      const trimmedText = text.trim();

      // Auto-detect JSON even if the toggle wasn't set
      if (trimmedText.startsWith('[') || trimmedText.startsWith('{')) {
        try {
          const parsed = JSON.parse(trimmedText);
          rawData = Array.isArray(parsed) ? parsed : [parsed];
        } catch (e) {
          if (isMultimodal) throw new Error("Invalid JSON format. Please check your brackets and quotes.");
          // If not explicitly multimodal, we might treat as text script later (not implemented for 8-frame yet)
          throw new Error("Input looks like JSON but is malformed.");
        }
      } else {
        throw new Error("Please provide your script in the Multimodal JSON format: [{ \"audio\": \"...\", \"image\": \"...\" }]");
      }

      setAppState(AppState.GENERATING);
      
      let allExpandedBeats: StoryboardItem[] = [];
      let globalLastImage: string | undefined = undefined;

      // 1. Expand each input object into 8 distinct beats
      for (let i = 0; i < rawData.length; i++) {
        const expandedBeats = await expandToEightFrames(rawData[i]);
        const skeletonBeats: StoryboardItem[] = expandedBeats.map(beat => ({
          ...beat,
          isGenerating: true,
          isAudioGenerating: true,
          sourceImage: rawData[i].image,
          sourceAudio: rawData[i].audio
        }));
        allExpandedBeats = [...allExpandedBeats, ...skeletonBeats];
      }
      
      setItems(allExpandedBeats);

      // 2. Generate assets for each beat
      for (let i = 0; i < allExpandedBeats.length; i++) {
        try {
          const currentBeat = allExpandedBeats[i];
          
          // Generate Audio and Image concurrently
          // We use the generated description for the audio to create a cohesive scene
          const [imageUrl, audioUrl] = await Promise.all([
            generateSceneImage(currentBeat.visualPrompt, currentBeat.mood, globalLastImage),
            generateSceneAudio(currentBeat.description, currentBeat.mood)
          ]);

          setItems(prev => prev.map((item, idx) => 
            idx === i ? { ...item, imageUrl, audioUrl, isGenerating: false, isAudioGenerating: false } : item
          ));

          // Update reference for visual consistency in the next frame
          if (imageUrl.includes('base64,')) {
            globalLastImage = imageUrl.split('base64,')[1];
          }
        } catch (err) {
          console.error(`Failed frame ${i + 1}`, err);
          setItems(prev => prev.map((item, idx) => 
            idx === i ? { ...item, isGenerating: false, isAudioGenerating: false, error: "Asset generation failed" } : item
          ));
        }
      }

      setAppState(AppState.COMPLETE);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during generation.");
      setAppState(AppState.ERROR);
    }
  };

  const handleReset = () => {
    setAppState(AppState.IDLE);
    setItems([]);
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
              <p className="text-[10px] text-slate-500 font-black uppercase tracking-widest">8-Frame Multi-Sync</p>
            </div>
          </div>
          {(appState === AppState.COMPLETE || appState === AppState.GENERATING) && (
            <button onClick={handleReset} className="text-xs font-black text-slate-500 hover:text-white transition-colors uppercase tracking-widest">Restart Director</button>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 mt-12">
        {(appState === AppState.IDLE || appState === AppState.PARSING) && (
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-5xl font-serif text-white max-w-3xl mx-auto leading-tight">
              Turn your beats into <span className="text-orange-500 italic">directed sequences.</span>
            </h2>
            <p className="text-slate-400 text-sm max-w-xl mx-auto font-bold uppercase tracking-widest">
              Every JSON object expands into 8 cinematic frames with synced AI audio.
            </p>
          </div>
        )}

        {(appState === AppState.IDLE || appState === AppState.PARSING) && (
          <ScriptInput onProcess={processInput} isLoading={appState === AppState.PARSING} />
        )}

        {(appState === AppState.GENERATING || appState === AppState.COMPLETE) && (
          <div className="space-y-12">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
              {items.map((item, index) => (
                <StoryboardCard key={index} item={item} />
              ))}
            </div>
            
            {appState === AppState.GENERATING && (
              <div className="flex flex-col items-center justify-center py-10 gap-4">
                <div className="w-12 h-12 border-4 border-orange-500/20 border-t-orange-500 rounded-full animate-spin"></div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest animate-pulse">
                  The Director is working on your sequence...
                </p>
              </div>
            )}
          </div>
        )}

        {appState === AppState.ERROR && (
          <div className="max-w-2xl mx-auto text-center py-20 bg-red-900/10 border border-red-500/20 rounded-3xl p-8">
            <h3 className="text-xl font-bold text-white mb-2 uppercase">Director Error</h3>
            <p className="text-red-400 text-sm mb-8">{error}</p>
            <button onClick={handleReset} className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-xl font-bold transition-colors">Try Again</button>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
