
import React, { useState, useCallback } from 'react';
import { AppState, StoryboardItem, SceneBeat } from './types';
import { parseScript, generateSceneImage } from './services/geminiService';
import ScriptInput from './components/ScriptInput';
import StoryboardCard from './components/StoryboardCard';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.IDLE);
  const [items, setItems] = useState<StoryboardItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const processScript = async (text: string) => {
    try {
      setError(null);
      setAppState(AppState.PARSING);
      setItems([]);

      const beats = await parseScript(text);
      
      const initialItems: StoryboardItem[] = beats.map(beat => ({
        ...beat,
        isGenerating: true
      }));
      
      setItems(initialItems);
      setAppState(AppState.GENERATING);

      let lastImageBase64: string | undefined = undefined;

      // Process images sequentially to maintain character and style consistency
      for (let i = 0; i < initialItems.length; i++) {
        try {
          const imageUrl = await generateSceneImage(
            initialItems[i].visualPrompt,
            initialItems[i].mood,
            lastImageBase64 // Pass the previous frame as reference
          );
          
          setItems(prev => prev.map((item, idx) => 
            idx === i ? { ...item, imageUrl, isGenerating: false, error: undefined } : item
          ));

          lastImageBase64 = imageUrl.split(',')[1];
        } catch (imgError) {
          console.error(`Failed to generate image for scene ${i + 1}`, imgError);
          setItems(prev => prev.map((item, idx) => 
            idx === i ? { ...item, isGenerating: false, error: "Image generation failed" } : item
          ));
          lastImageBase64 = undefined;
        }
      }

      setAppState(AppState.COMPLETE);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred");
      setAppState(AppState.ERROR);
    }
  };

  const retryFrame = async (index: number) => {
    const itemToRetry = items[index];
    if (!itemToRetry) return;

    // To maintain consistency, we should try to find the last successful image before this frame
    let lastImageBase64: string | undefined = undefined;
    for (let i = index - 1; i >= 0; i--) {
      if (items[i].imageUrl) {
        lastImageBase64 = items[i].imageUrl?.split(',')[1];
        break;
      }
    }

    setItems(prev => prev.map((item, idx) => 
      idx === index ? { ...item, isGenerating: true, error: undefined } : item
    ));

    try {
      const imageUrl = await generateSceneImage(
        itemToRetry.visualPrompt,
        itemToRetry.mood,
        lastImageBase64
      );
      
      setItems(prev => prev.map((item, idx) => 
        idx === index ? { ...item, imageUrl, isGenerating: false, error: undefined } : item
      ));
    } catch (err) {
      console.error(`Retry failed for frame ${index + 1}`, err);
      setItems(prev => prev.map((item, idx) => 
        idx === index ? { ...item, isGenerating: false, error: "Retry failed" } : item
      ));
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
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center shadow-lg shadow-blue-500/20">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="3" width="20" height="14" rx="2" ry="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight text-white">Storyboard<span className="text-blue-500">AI</span></h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-[0.2em]">Studio Edition</p>
            </div>
          </div>
          
          {(appState === AppState.COMPLETE || appState === AppState.GENERATING) && (
            <button 
              onClick={handleReset}
              className="text-sm font-semibold text-slate-400 hover:text-white transition-colors"
            >
              Start New Project
            </button>
          )}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-6 mt-12">
        {(appState === AppState.IDLE || appState === AppState.PARSING) && (
          <div className="text-center mb-16 space-y-4">
            <h2 className="text-4xl md:text-6xl font-serif text-white max-w-3xl mx-auto leading-tight">
              Turn your <span className="italic text-blue-400">vision</span> into cinematic visual frames.
            </h2>
            <p className="text-slate-400 text-lg max-w-2xl mx-auto">
              Our AI analyzes your script and generates a high-fidelity production storyboard, maintaining character consistency across every frame.
            </p>
          </div>
        )}

        {(appState === AppState.IDLE || appState === AppState.PARSING) && (
          <ScriptInput onProcess={processScript} isLoading={appState === AppState.PARSING} />
        )}

        {(appState === AppState.GENERATING || appState === AppState.COMPLETE) && (
          <div className="space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-slate-800 pb-8">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="px-2 py-0.5 bg-blue-500 text-[10px] font-black text-white rounded uppercase">Project Alpha</span>
                  <h2 className="text-3xl font-serif text-white">Production Storyboard</h2>
                </div>
                <p className="text-slate-400">
                  {appState === AppState.GENERATING 
                    ? `AI is generating frame-by-frame for character consistency (${items.filter(i => !!i.imageUrl).length} of ${items.length})...`
                    : `Complete consistent sequence generated with ${items.length} key frames.`}
                </p>
              </div>
              
              {appState === AppState.COMPLETE && (
                <button 
                  onClick={() => window.print()}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-6 py-2.5 rounded-lg border border-slate-700 transition-all font-medium"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  Export PDF
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {items.map((item, index) => (
                <StoryboardCard 
                  key={index} 
                  item={item} 
                  onRetry={() => retryFrame(index)}
                />
              ))}
            </div>
          </div>
        )}

        {appState === AppState.ERROR && (
          <div className="max-w-2xl mx-auto text-center py-20 bg-red-900/10 border border-red-500/20 rounded-3xl p-8">
            <div className="w-16 h-16 bg-red-500/20 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
            </div>
            <h3 className="text-2xl font-bold text-white mb-2">Analysis Failed</h3>
            <p className="text-red-400 mb-8">{error}</p>
            <button 
              onClick={handleReset}
              className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-xl font-bold transition-all"
            >
              Try Again
            </button>
          </div>
        )}
      </main>

      <footer className="mt-20 border-t border-slate-800 py-12 px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8 text-slate-500 text-sm">
          <div className="flex items-center gap-4">
            <span className="font-bold tracking-widest uppercase text-[10px]">Powered By Gemini 3.0</span>
            <div className="w-1 h-1 bg-slate-700 rounded-full"></div>
            <span className="font-bold tracking-widest uppercase text-[10px]">Cinema AI Engine v1.0</span>
          </div>
          <p>© 2024 Storyboard AI. For creative visualization only.</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
